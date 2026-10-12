import {
  ConnectionState,
  createAudioAnalyser,
  DisconnectReason,
  type LocalAudioTrack,
  type Participant as LKParticipant,
  type RemoteAudioTrack,
  type RemoteTrack,
  type RemoteTrackPublication,
  Room,
  RoomEvent,
  Track,
  type TrackPublication,
} from 'livekit-client'
import { ApiError, callFunction } from '../api'
import { microphoneSupported, toMicrophoneError } from './microphone'
import type { AudioRoomClient, AudioRoomSnapshot, JoinAudioRoomOptions, RoomParticipant } from './types'

interface GuestCredential {
  identity: string
  signature: string
}

interface TokenResponse {
  token: string
  serverUrl: string
  identity: string
  role: 'host' | 'speaker' | 'listener'
  guest: GuestCredential | null
}

const GUEST_KEY = 'prayerbox.guest'
const HOST_PREFIX = 'host_'

// Per-tab guest identity, so two tabs are two participants instead of kicking each other.
function readGuest(): GuestCredential | null {
  try {
    const raw = sessionStorage.getItem(GUEST_KEY)
    return raw ? (JSON.parse(raw) as GuestCredential) : null
  } catch {
    return null
  }
}

function saveGuest(guest: GuestCredential | null) {
  try {
    if (guest) sessionStorage.setItem(GUEST_KEY, JSON.stringify(guest))
  } catch {
    // Storage unavailable: a new guest identity is issued on the next join.
  }
}

type Analyser = ReturnType<typeof createAudioAnalyser>

function toParticipant(p: LKParticipant, isLocal: boolean): RoomParticipant {
  const isHost = p.identity.startsWith(HOST_PREFIX)
  const canSpeak = isHost || Boolean(p.permissions?.canPublish)
  const mic = p.getTrackPublication(Track.Source.Microphone)
  return {
    id: p.identity,
    displayName: p.name || 'Guest',
    role: isHost ? 'host' : canSpeak ? 'speaker' : 'listener',
    canSpeak,
    isMuted: !mic || mic.isMuted,
    handRaised: p.attributes.handRaised === 'true',
    joinedAt: (p.joinedAt ?? new Date()).toISOString(),
    isSpeaking: p.isSpeaking,
    isLocal,
  }
}

export class LiveKitAudioClient implements AudioRoomClient {
  private room = new Room({
    adaptiveStream: false,
    dynacast: false,
    disconnectOnPageLeave: true,
    stopLocalTrackOnUnpublish: true,
    audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  })
  private listeners = new Set<() => void>()
  private options?: JoinAudioRoomOptions
  private leaving = false
  private userMutedAt = 0
  private localAnalyser?: Analyser
  private remoteAnalysers = new Map<string, Analyser>()
  private audioElements = new Map<string, HTMLMediaElement[]>()
  private snapshot: AudioRoomSnapshot = {
    connection: 'idle',
    microphone: { enabled: false, status: 'off' },
    receivingAudio: false,
    playbackBlocked: false,
    self: null,
    participants: [],
  }

  constructor() {
    const r = this.room
    r.on(RoomEvent.ConnectionStateChanged, (state) => {
      if (state === ConnectionState.Reconnecting || state === ConnectionState.SignalReconnecting) {
        this.update({ connection: 'reconnecting' })
      } else if (state === ConnectionState.Connected) {
        this.update({ connection: 'connected', connectionMessage: undefined })
        this.refresh()
      }
    })
    r.on(RoomEvent.Disconnected, (reason) => this.handleDisconnected(reason))
    r.on(RoomEvent.TrackSubscribed, (track, pub) => this.attachRemote(track, pub))
    r.on(RoomEvent.TrackUnsubscribed, (track, pub) => this.detachRemote(track, pub))
    r.on(RoomEvent.AudioPlaybackStatusChanged, () => this.update({ playbackBlocked: !r.canPlaybackAudio }))
    r.on(RoomEvent.MediaDevicesError, (error) =>
      this.update({ microphone: { ...this.snapshot.microphone, enabled: false, status: 'error', error: toMicrophoneError(error) } }),
    )
    r.on(RoomEvent.TrackMuted, (pub, participant) => {
      if (participant.isLocal && pub.source === Track.Source.Microphone && Date.now() - this.userMutedAt > 1500) {
        // Muted without the user pressing the button: the host muted them.
        this.update({ microphone: { ...this.snapshot.microphone, enabled: false, status: 'off', mutedByHost: true } })
      }
      this.refresh()
    })
    r.on(RoomEvent.ParticipantPermissionsChanged, (_prev, participant) => {
      if (participant.isLocal && !participant.permissions?.canPublish && this.snapshot.microphone.enabled) {
        // LiveKit unpublishes the mic when the server revokes publishing.
        this.stopLocalAnalyser()
        this.update({ microphone: { ...this.snapshot.microphone, enabled: false, status: 'off' } })
      }
      this.refresh()
    })
    for (const event of [
      RoomEvent.ParticipantConnected,
      RoomEvent.ParticipantDisconnected,
      RoomEvent.ParticipantAttributesChanged,
      RoomEvent.ParticipantNameChanged,
      RoomEvent.TrackPublished,
      RoomEvent.TrackUnpublished,
      RoomEvent.TrackUnmuted,
      RoomEvent.LocalTrackPublished,
      RoomEvent.LocalTrackUnpublished,
      RoomEvent.ActiveSpeakersChanged,
    ] as const) {
      r.on(event, () => this.refresh())
    }
  }

  private update(patch: Partial<AudioRoomSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch }
    this.listeners.forEach((l) => l())
  }

  private refresh() {
    const r = this.room
    if (r.state === ConnectionState.Disconnected) return
    const self = toParticipant(r.localParticipant, true)
    const participants = [self, ...Array.from(r.remoteParticipants.values(), (p) => toParticipant(p, false))]
    const receivingAudio = Array.from(r.remoteParticipants.values()).some((p) => {
      const mic = p.getTrackPublication(Track.Source.Microphone)
      return Boolean(mic?.isSubscribed && !mic.isMuted && mic.track)
    })
    const micOn = r.localParticipant.isMicrophoneEnabled
    const mic = this.snapshot.microphone
    const microphone =
      mic.status === 'requesting' || mic.status === 'error'
        ? mic
        : { ...mic, enabled: micOn, status: micOn ? ('on' as const) : ('off' as const) }
    this.update({ self, participants, receivingAudio, microphone, playbackBlocked: !r.canPlaybackAudio })
  }

  async connect(options: JoinAudioRoomOptions) {
    this.options = options
    this.leaving = false
    this.update({ connection: 'connecting', connectionMessage: undefined, endReason: undefined })

    let token: TokenResponse
    try {
      token = await callFunction<TokenResponse>('room-token', {
        sessionId: options.sessionId,
        displayName: options.displayName,
        guest: readGuest(),
      })
    } catch (error) {
      if (this.leaving) return
      return this.handleJoinError(error)
    }
    if (this.leaving) return
    saveGuest(token.guest)

    try {
      await this.room.connect(token.serverUrl, token.token, { autoSubscribe: true })
    } catch {
      if (this.leaving) return
      return this.update({
        connection: 'failed',
        connectionMessage: navigator.onLine
          ? 'We could not connect to the prayer audio. Your network may be blocking it. Please try again.'
          : 'You are offline. Connect to the internet and try again.',
      })
    }
    if (this.leaving) {
      await this.room.disconnect()
      return
    }
    this.refresh()
  }

  private handleJoinError(error: unknown) {
    if (error instanceof ApiError) {
      if (error.code === 'removed') return this.update({ connection: 'disconnected', endReason: 'removed' })
      if (error.code === 'session-ended' || error.code === 'session-cancelled') {
        return this.update({ connection: 'disconnected', endReason: 'ended' })
      }
      if (error.code === 'session-scheduled') return this.update({ connection: 'disconnected', endReason: 'not-live' })
      return this.update({ connection: 'failed', connectionMessage: error.message })
    }
    this.update({ connection: 'failed', connectionMessage: 'Something went wrong while joining. Please try again.' })
  }

  private handleDisconnected(reason?: DisconnectReason) {
    this.cleanupMedia()
    const base = {
      microphone: { enabled: false, status: 'off' as const, deviceId: this.snapshot.microphone.deviceId },
      receivingAudio: false,
      playbackBlocked: false,
    }
    if (this.leaving || reason === DisconnectReason.CLIENT_INITIATED) {
      return this.update({ ...base, connection: 'disconnected' })
    }
    switch (reason) {
      case DisconnectReason.PARTICIPANT_REMOVED:
        return this.update({ ...base, connection: 'disconnected', endReason: 'removed' })
      case DisconnectReason.ROOM_DELETED:
      case DisconnectReason.ROOM_CLOSED:
        return this.update({ ...base, connection: 'disconnected', endReason: 'ended' })
      case DisconnectReason.DUPLICATE_IDENTITY:
        return this.update({ ...base, connection: 'disconnected', endReason: 'duplicate' })
      default:
        return this.update({
          ...base,
          connection: 'failed',
          connectionMessage: navigator.onLine
            ? 'The connection to the prayer room was lost.'
            : 'You went offline and the connection could not be recovered.',
        })
    }
  }

  async disconnect() {
    this.leaving = true
    await this.room.disconnect()
    this.cleanupMedia()
  }

  async setMicrophoneEnabled(enabled: boolean) {
    const lp = this.room.localParticipant
    if (!enabled) {
      this.userMutedAt = Date.now()
      await lp.setMicrophoneEnabled(false)
      this.update({ microphone: { ...this.snapshot.microphone, enabled: false, status: 'off', error: undefined, mutedByHost: false } })
      return
    }
    if (!microphoneSupported()) {
      this.update({ microphone: { enabled: false, status: 'error', error: 'unsupported' } })
      return
    }
    if (!lp.permissions?.canPublish) {
      this.update({ microphone: { ...this.snapshot.microphone, enabled: false, status: 'error', error: 'not-permitted' } })
      return
    }
    const deviceId = this.snapshot.microphone.deviceId
    this.update({ microphone: { ...this.snapshot.microphone, enabled: true, status: 'requesting', error: undefined, mutedByHost: false } })
    try {
      const pub = await lp.setMicrophoneEnabled(true, deviceId ? { deviceId } : undefined)
      const track = pub?.track as LocalAudioTrack | undefined
      if (track) {
        this.stopLocalAnalyser()
        this.localAnalyser = createAudioAnalyser(track, { cloneTrack: true })
      }
      this.update({ microphone: { enabled: true, status: 'on', deviceId: track?.mediaStreamTrack.getSettings().deviceId ?? deviceId } })
    } catch (error) {
      this.update({ microphone: { ...this.snapshot.microphone, enabled: false, status: 'error', error: toMicrophoneError(error) } })
    }
  }

  async setInputDevice(deviceId: string) {
    this.update({ microphone: { ...this.snapshot.microphone, deviceId } })
    if (this.room.state === ConnectionState.Connected) await this.room.switchActiveDevice('audioinput', deviceId)
  }

  async setOutputDevice(deviceId: string) {
    this.update({ outputDeviceId: deviceId })
    if (this.room.state === ConnectionState.Connected) await this.room.switchActiveDevice('audiooutput', deviceId)
    for (const elements of this.audioElements.values()) {
      for (const el of elements) {
        const sinkable = el as HTMLMediaElement & { setSinkId?: (id: string) => Promise<void> }
        await sinkable.setSinkId?.(deviceId).catch(() => undefined)
      }
    }
  }

  async startAudio() {
    await this.room.startAudio()
    this.update({ playbackBlocked: !this.room.canPlaybackAudio })
  }

  async setHandRaised(raised: boolean) {
    if (!this.options) return
    await callFunction('room-moderate', {
      sessionId: this.options.sessionId,
      action: 'hand',
      raised,
      guest: readGuest(),
    })
  }

  getLocalLevel() {
    return this.snapshot.microphone.status === 'on' ? Math.min(1, (this.localAnalyser?.calculateVolume() ?? 0) * 2.5) : 0
  }

  getRemoteLevel() {
    let max = 0
    for (const a of this.remoteAnalysers.values()) max = Math.max(max, a.calculateVolume())
    return Math.min(1, max * 2.5)
  }

  getSnapshot = () => this.snapshot

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private attachRemote(track: RemoteTrack, pub: RemoteTrackPublication) {
    if (track.kind !== Track.Kind.Audio) return
    const el = track.attach()
    el.style.display = 'none'
    document.body.appendChild(el)
    const sinkId = this.snapshot.outputDeviceId
    const sinkable = el as HTMLMediaElement & { setSinkId?: (id: string) => Promise<void> }
    if (sinkId) void sinkable.setSinkId?.(sinkId).catch(() => undefined)
    this.audioElements.set(pub.trackSid, [...(this.audioElements.get(pub.trackSid) ?? []), el])
    try {
      this.remoteAnalysers.set(pub.trackSid, createAudioAnalyser(track as RemoteAudioTrack))
    } catch {
      // Level meter is cosmetic; playback still works without it.
    }
    this.refresh()
  }

  private detachRemote(track: RemoteTrack, pub: TrackPublication) {
    track.detach().forEach((el) => el.remove())
    this.audioElements.get(pub.trackSid)?.forEach((el) => el.remove())
    this.audioElements.delete(pub.trackSid)
    void this.remoteAnalysers.get(pub.trackSid)?.cleanup()
    this.remoteAnalysers.delete(pub.trackSid)
    this.refresh()
  }

  private stopLocalAnalyser() {
    void this.localAnalyser?.cleanup()
    this.localAnalyser = undefined
  }

  private cleanupMedia() {
    this.stopLocalAnalyser()
    for (const a of this.remoteAnalysers.values()) void a.cleanup()
    this.remoteAnalysers.clear()
    for (const elements of this.audioElements.values()) elements.forEach((el) => el.remove())
    this.audioElements.clear()
  }
}
