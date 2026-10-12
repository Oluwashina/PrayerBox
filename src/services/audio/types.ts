import type { Participant } from '@/domain/types'

export type AudioConnectionState =
  /** Not yet asked to connect. */
  | 'idle'
  | 'connecting'
  | 'connected'
  /** Network blip: the SDK is resuming the connection automatically. */
  | 'reconnecting'
  /** Left the room on purpose, or the room closed (see `endReason`). */
  | 'disconnected'
  /** Could not join, or the connection was lost and automatic recovery failed. */
  | 'failed'

export type RoomEndReason =
  /** The host removed this participant. */
  | 'removed'
  /** The host ended the session. */
  | 'ended'
  /** The same person joined from another tab or device. */
  | 'duplicate'
  /** The session is not live (not started yet, or cancelled). */
  | 'not-live'

export type MicrophoneErrorCode =
  | 'permission-denied'
  | 'no-device'
  | 'in-use'
  | 'unsupported'
  | 'not-permitted'
  | 'unknown'

export interface MicrophoneState {
  enabled: boolean
  status: 'off' | 'requesting' | 'on' | 'error'
  error?: MicrophoneErrorCode
  deviceId?: string
  /** Set when the host muted this participant's microphone. */
  mutedByHost?: boolean
}

export interface RoomParticipant extends Participant {
  isSpeaking: boolean
  isLocal: boolean
}

export interface AudioRoomSnapshot {
  connection: AudioConnectionState
  /** Human-readable detail for failed states. */
  connectionMessage?: string
  endReason?: RoomEndReason
  microphone: MicrophoneState
  /** True while at least one remote microphone is subscribed and unmuted. */
  receivingAudio: boolean
  /** The browser blocked audio playback until the user taps the page. */
  playbackBlocked: boolean
  outputDeviceId?: string
  /** The local participant once connected. Permissions come from the server. */
  self: RoomParticipant | null
  participants: RoomParticipant[]
}

export interface JoinAudioRoomOptions {
  sessionId: string
  /** Guest display name. Hosts are named from their host profile on the server. */
  displayName: string
}

/**
 * Transport-agnostic contract for the live audio room. The UI talks only to
 * this; `LiveKitAudioClient` is the implementation.
 */
export interface AudioRoomClient {
  connect(options: JoinAudioRoomOptions): Promise<void>
  disconnect(): Promise<void>
  setMicrophoneEnabled(enabled: boolean): Promise<void>
  setInputDevice(deviceId: string): Promise<void>
  setOutputDevice(deviceId: string): Promise<void>
  /** Must be called from a tap/click when `playbackBlocked` is true. */
  startAudio(): Promise<void>
  setHandRaised(raised: boolean): Promise<void>
  /** 0..1 level of the local microphone. Polled per animation frame. */
  getLocalLevel(): number
  /** 0..1 level of incoming room audio. */
  getRemoteLevel(): number
  getSnapshot(): AudioRoomSnapshot
  subscribe(listener: () => void): () => void
}
