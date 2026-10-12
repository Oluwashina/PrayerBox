import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import {
  AlertTriangle,
  CircleStop,
  Copy,
  Hand,
  HeartHandshake,
  Headphones,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Settings2,
  Share2,
  Sparkles,
  UserX,
  UsersRound,
  Volume2,
  WifiOff,
} from 'lucide-react'
import type { SessionMode } from '@/domain/types'
import { modeLabel } from '@/domain/session'
import { appConfig } from '@/config'
import { useAudioRoom } from '@/hooks/useAudioRoom'
import { useAuth } from '@/hooks/useAuth'
import { readGuestName } from '@/hooks/useGuestName'
import { useNow } from '@/hooks/useNow'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useSession } from '@/hooks/useSessions'
import { sessionService } from '@/services'
import { microphoneErrorCopy } from '@/services/audio/microphone'
import { formatElapsed } from '@/lib/format'
import { cn } from '@/lib/cn'
import { ParticipantList } from '@/components/ParticipantList'
import { ShareSession } from '@/components/ShareSession'
import { Waveform } from '@/components/Waveform'
import { AudioSettingsDialog } from '@/components/room/AudioSettingsDialog'
import { ConnectionStatus, type DisplayConnectionState } from '@/components/room/ConnectionStatus'
import { MicButton } from '@/components/room/MicButton'
import { LiveDot } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'

type Notice = 'invited' | 'speaking-ended' | null

export function RoomPage() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()

  const { session, loading, error, notFound, reload } = useSession(sessionId)
  const { host, loading: authLoading } = useAuth()
  const displayName = host?.name ?? readGuestName()
  const online = useOnlineStatus()
  const now = useNow()

  const isLive = session?.status === 'live'
  // Wait for the stored host session so the server can recognise a host and grant publishing.
  const audioOptions = useMemo(
    () => (isLive && !authLoading && displayName ? { sessionId, displayName } : null),
    [isLive, authLoading, displayName, sessionId],
  )
  const { client, snapshot } = useAudioRoom(audioOptions)
  const { microphone: mic, self, participants } = snapshot
  const canSpeak = Boolean(self?.canSpeak)
  const isHost = self?.role === 'host'

  // Tell people when the host grants or ends their turn to speak.
  const [notice, setNotice] = useState<Notice>(null)
  const prevCanSpeak = useRef<boolean | null>(null)
  useEffect(() => {
    if (!self || isHost) return
    if (prevCanSpeak.current !== null && prevCanSpeak.current !== canSpeak) setNotice(canSpeak ? 'invited' : 'speaking-ended')
    prevCanSpeak.current = canSpeak
  }, [self, isHost, canSpeak])

  // Rejoin automatically when the network returns after a failed connection.
  const wasOnline = useRef(online)
  useEffect(() => {
    const cameBack = online && !wasOnline.current
    wasOnline.current = online
    if (cameBack && client.getSnapshot().connection === 'failed' && audioOptions) void client.connect(audioOptions)
  }, [online, audioOptions, client])

  const [handError, setHandError] = useState<string | null>(null)
  const [handPending, setHandPending] = useState(false)
  const toggleHand = async () => {
    if (!self) return
    setHandPending(true)
    setHandError(null)
    try {
      await client.setHandRaised(!self.handRaised)
    } catch (e) {
      setHandError(e instanceof Error ? e.message : 'Could not reach the host. Please try again.')
    } finally {
      setHandPending(false)
    }
  }

  const toggleMic = () => {
    setNotice(null)
    void client.setMicrophoneEnabled(!mic.enabled)
  }

  const localLevel = useCallback(() => client.getLocalLevel(), [client])
  const remoteLevel = useCallback(() => client.getRemoteLevel(), [client])

  const [showSettings, setShowSettings] = useState(false)
  const [showPeople, setShowPeople] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [ending, setEnding] = useState(false)
  const [endError, setEndError] = useState<string | null>(null)

  const leave = () => navigate(`/s/${sessionId}`, { state: { left: true } })

  if (loading) {
    return (
      <RoomShell>
        <CenteredMessage icon={<Loader2 className="size-8 animate-spin" />} title="Preparing the prayer room…" />
      </RoomShell>
    )
  }
  if (error) {
    return (
      <RoomShell>
        <CenteredMessage
          icon={<AlertTriangle className="size-8" />}
          title="We could not open the prayer room"
          body={error}
          action={
            <Button variant="brand" onClick={reload}>
              Try again
            </Button>
          }
        />
      </RoomShell>
    )
  }
  if (notFound || !session) {
    return (
      <RoomShell>
        <CenteredMessage
          icon={<AlertTriangle className="size-8" />}
          title="This prayer room does not exist"
          body="Please check the link you were sent."
          action={
            <ButtonLink to="/" variant="brand">
              Go to home page
            </ButtonLink>
          }
        />
      </RoomShell>
    )
  }
  if (
    session.status === 'scheduled' ||
    (!authLoading && !displayName) ||
    (snapshot.endReason === 'not-live' && session.status !== 'live')
  ) {
    return <Navigate to={`/s/${sessionId}`} replace />
  }
  if (session.status === 'ended' || session.status === 'cancelled' || snapshot.endReason === 'ended') {
    return (
      <RoomShell>
        <CenteredMessage
          icon={<HeartHandshake className="size-10 text-brand-300" />}
          title={session.status === 'cancelled' ? 'This session was cancelled.' : 'Amen. This prayer has ended.'}
          body={`Thank you for praying with us${displayName ? `, ${displayName.split(' ')[0]}` : ''}. We hope to see you at the next session.`}
          action={
            <ButtonLink to="/sessions" variant="brand">
              See upcoming prayer
            </ButtonLink>
          }
        />
      </RoomShell>
    )
  }
  if (snapshot.endReason === 'removed') {
    return (
      <RoomShell>
        <CenteredMessage
          icon={<UserX className="size-8" />}
          title="You have been removed from this session"
          body="The host removed you from this prayer room. If you think this was a mistake, please contact the prayer team."
          action={
            <ButtonLink to="/" variant="brand">
              Go to home page
            </ButtonLink>
          }
        />
      </RoomShell>
    )
  }
  if (snapshot.endReason === 'duplicate') {
    return (
      <RoomShell>
        <CenteredMessage
          icon={<Copy className="size-8" />}
          title="You joined from another tab or device"
          body="You can only be in the prayer room in one place at a time. Close the other one, or continue here."
          action={
            audioOptions && (
              <Button variant="brand" onClick={() => void client.connect(audioOptions)}>
                Continue here
              </Button>
            )
          }
        />
      </RoomShell>
    )
  }

  let connection: DisplayConnectionState = snapshot.connection
  if (!online) connection = snapshot.connection === 'connected' || snapshot.connection === 'reconnecting' ? 'reconnecting' : 'offline'
  const connected = connection === 'connected'
  const micOn = mic.status === 'on'
  const micError = mic.status === 'error' ? mic.error : undefined

  return (
    <RoomShell>
      {/* Top bar */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
            <img src={appConfig.logoSrc} alt="" className="size-7" />
          </span>
          <span className="hidden text-sm text-white/70 sm:block">{appConfig.churchName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">
            <LiveDot /> LIVE
            {session.startedAt && <span className="font-normal text-white/70 tabular-nums">{formatElapsed(session.startedAt, now)}</span>}
          </span>
          <button
            type="button"
            onClick={() => setShowPeople(true)}
            disabled={!connected}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-sm font-semibold hover:bg-white/15 disabled:opacity-60 lg:pointer-events-none"
            aria-label={`${participants.length} people in the room. Show participants`}
          >
            <UsersRound className="size-4" aria-hidden />
            {connected ? participants.length : '–'}
          </button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 pb-4 sm:px-8 lg:grid-cols-[1fr_380px] lg:pt-6">
        {/* Stage */}
        <main className="flex flex-col items-center text-center">
          <div className="mt-4 flex flex-col items-center sm:mt-8">
            <p className="text-xs font-semibold tracking-[0.25em] text-brand-300 uppercase">{modeLabel(session.mode)}</p>
            <h1 className="mt-3 max-w-xl text-3xl leading-tight font-medium sm:text-[2.6rem]">{session.title}</h1>
            <p className="mt-3 max-w-md text-white/80">
              <span className="text-white/55">Praying for </span>
              {session.prayerFocus.charAt(0).toLowerCase() + session.prayerFocus.slice(1)}
            </p>
            <p className="mt-1.5 text-sm text-white/55">Led by {session.hostName}</p>
          </div>

          {/* Presence orb */}
          <div className="relative my-8 flex size-56 items-center justify-center sm:my-10 sm:size-64">
            <div
              aria-hidden
              className={cn(
                'absolute inset-0 rounded-full bg-gradient-to-b from-plum-600/40 to-plum-800/10 ring-1 ring-white/10',
                (micOn || snapshot.receivingAudio) && 'animate-breathe',
              )}
            />
            <div aria-hidden className="absolute inset-6 rounded-full bg-plum-900/80 ring-1 ring-white/5" />
            <div className="relative flex flex-col items-center gap-3">
              <Waveform
                tone="dark"
                bars={22}
                className="h-14"
                active={connected && (micOn || snapshot.receivingAudio)}
                getLevel={micOn ? localLevel : remoteLevel}
              />
              <p className="max-w-[11rem] text-xs leading-snug text-white/60">
                {!connected
                  ? 'Prayer audio will play here'
                  : micOn
                    ? 'Everyone can hear you'
                    : snapshot.receivingAudio
                      ? 'Listening'
                      : 'Waiting for someone to speak'}
              </p>
            </div>
          </div>

          <ConnectionStatus state={connection} />

          <div className="mt-5 flex w-full max-w-md flex-col gap-3 text-left">
            {connected && snapshot.playbackBlocked && (
              <RoomNotice
                icon={<Volume2 />}
                title="Tap to hear the prayer"
                action={
                  <Button size="sm" variant="brand" onClick={() => void client.startAudio()}>
                    Start audio
                  </Button>
                }
              >
                Your browser paused the sound until you tap.
              </RoomNotice>
            )}
            {(connection === 'reconnecting' || connection === 'offline') && (
              <RoomNotice icon={<WifiOff />} title={connection === 'offline' ? 'You are offline' : 'Connection interrupted'}>
                {connection === 'offline'
                  ? 'Connect to the internet to join the prayer. This page will keep trying.'
                  : 'We are reconnecting you automatically. Stay on this page.'}
              </RoomNotice>
            )}
            {connection === 'failed' && (
              <RoomNotice
                tone="danger"
                icon={<AlertTriangle />}
                title="We could not connect you to the prayer audio"
                action={
                  audioOptions && (
                    <Button size="sm" variant="brand" onClick={() => void client.connect(audioOptions)}>
                      Try again
                    </Button>
                  )
                }
              >
                {snapshot.connectionMessage ?? 'Check your internet connection, then try again.'}
              </RoomNotice>
            )}
            {mic.status === 'requesting' && (
              <RoomNotice icon={<Mic />} title="Waiting for microphone permission">
                Look for a message near the top of your screen or the web address, and choose “Allow”.
              </RoomNotice>
            )}
            {micError && (
              <RoomNotice
                tone="danger"
                icon={<MicOff />}
                title={microphoneErrorCopy[micError].title}
                action={
                  canSpeak && (
                    <Button size="sm" variant="brand" onClick={toggleMic}>
                      Try again
                    </Button>
                  )
                }
              >
                {microphoneErrorCopy[micError].body}
              </RoomNotice>
            )}
            {handError && (
              <RoomNotice tone="danger" icon={<Hand />} title="Your request did not go through" onDismiss={() => setHandError(null)}>
                {handError}
              </RoomNotice>
            )}
            {notice === 'invited' && (
              <RoomNotice icon={<Sparkles />} title="You are invited to pray aloud" onDismiss={() => setNotice(null)}>
                Tap the microphone when you are ready. Your browser may ask for permission.
              </RoomNotice>
            )}
            {mic.mutedByHost && (
              <RoomNotice icon={<MicOff />} title="The host muted your microphone">
                You can unmute again when you are ready to speak.
              </RoomNotice>
            )}
            {notice === 'speaking-ended' && (
              <RoomNotice icon={<Headphones />} title="You are listening again" onDismiss={() => setNotice(null)}>
                The host has ended your turn to speak. Thank you for praying.
              </RoomNotice>
            )}
          </div>

          {isHost && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button size="sm" variant="onDark" icon={<Share2 className="size-4" />} onClick={() => setShowShare(true)}>
                Share link
              </Button>
              <Button size="sm" variant="onDark" icon={<CircleStop className="size-4" />} onClick={() => setConfirmEnd(true)}>
                End prayer for everyone
              </Button>
            </div>
          )}
        </main>

        {/* Participants (desktop) */}
        <aside className="hidden lg:block" aria-label="Participants">
          <div className="sticky top-6 rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
            <PeopleHeader count={connected ? participants.length : null} />
            {isHost && <HostModeSwitch sessionId={sessionId} mode={session.mode} />}
            <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1">
              <RoomRoster
                connected={connected}
                sessionId={sessionId}
                participants={participants}
                mode={session.mode}
                selfId={self?.id}
                isHost={isHost}
              />
            </div>
          </div>
        </aside>
      </div>

      {/* Controls */}
      <nav aria-label="Prayer room controls" className="sticky bottom-0 z-10 border-t border-white/10 bg-plum-950/90 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-3 items-end px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <SideControl label="Audio" onClick={() => setShowSettings(true)}>
            <Settings2 className="size-6" aria-hidden />
          </SideControl>

          <div className="flex justify-center">
            {connected && canSpeak ? (
              <MicButton microphone={mic} onToggle={toggleMic} />
            ) : connected && session.mode === 'interactive' && self ? (
              <RaiseHandButton raised={self.handRaised} pending={handPending} onToggle={() => void toggleHand()} />
            ) : (
              <div className="flex flex-col items-center gap-2" role="status">
                <span className="flex size-20 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 sm:size-[5.5rem]">
                  {connected ? (
                    <Headphones className="size-8 text-white/85" aria-hidden />
                  ) : (
                    <Loader2 className="size-8 animate-spin text-white/60" aria-hidden />
                  )}
                </span>
                <span className="text-sm font-semibold">{connected ? 'Listening' : 'Joining…'}</span>
              </div>
            )}
          </div>

          <SideControl label="Leave" onClick={leave} danger>
            <PhoneOff className="size-6" aria-hidden />
          </SideControl>
        </div>
      </nav>

      <AudioSettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        client={client}
        snapshot={snapshot}
        canSpeak={canSpeak}
      />

      <Dialog open={showPeople} onClose={() => setShowPeople(false)} title="In this prayer room" tone="dark">
        {isHost && <HostModeSwitch sessionId={sessionId} mode={session.mode} />}
        <p className="mt-2 text-sm text-white/60">{participants.length} people</p>
        <div className="mt-3">
          <RoomRoster
            connected={connected}
            sessionId={sessionId}
            participants={participants}
            mode={session.mode}
            selfId={self?.id}
            isHost={isHost}
          />
        </div>
      </Dialog>

      <Dialog open={showShare} onClose={() => setShowShare(false)} title="Invite others to pray" size="sm">
        <ShareSession session={session} layout="stack" />
      </Dialog>

      <Dialog
        open={confirmEnd}
        onClose={() => setConfirmEnd(false)}
        title="End this prayer session?"
        description="Everyone will be disconnected and the session will move to previous sessions."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmEnd(false)}>
              Keep praying
            </Button>
            <Button
              variant="danger"
              loading={ending}
              onClick={async () => {
                setEnding(true)
                setEndError(null)
                try {
                  await sessionService.end(sessionId)
                  setConfirmEnd(false)
                } catch (e) {
                  setEndError(e instanceof Error ? e.message : 'Could not end the session.')
                } finally {
                  setEnding(false)
                }
              }}
            >
              End for everyone
            </Button>
          </>
        }
      >
        <p className="text-ink-700">This cannot be undone, but you can schedule a new session at any time.</p>
        {endError && <p className="mt-3 text-sm font-medium text-danger">{endError}</p>}
      </Dialog>
    </RoomShell>
  )
}

function RoomRoster({
  connected,
  sessionId,
  participants,
  mode,
  selfId,
  isHost,
}: {
  connected: boolean
  sessionId: string
  participants: Parameters<typeof ParticipantList>[0]['participants']
  mode: SessionMode
  selfId?: string
  isHost: boolean
}) {
  if (!connected) return <p className="text-sm text-white/60">The list of people appears once you are connected.</p>
  return (
    <ParticipantList
      sessionId={sessionId}
      participants={participants}
      mode={mode}
      currentParticipantId={selfId}
      canModerate={isHost}
      tone="dark"
    />
  )
}

function RoomShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-plum-950 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(ellipse_at_top,rgb(117_82_176/0.45),transparent_65%)]"
      />
      <div aria-hidden className="pointer-events-none absolute top-40 left-1/2 size-96 -translate-x-1/2 rounded-full bg-brand-400/[0.07] blur-3xl" />
      <div className="relative flex flex-1 flex-col">{children}</div>
    </div>
  )
}

function CenteredMessage({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-white/10 text-white/90 ring-1 ring-white/10">{icon}</div>
      <h1 className="mt-6 max-w-md text-3xl font-medium">{title}</h1>
      {body && <p className="mt-3 max-w-sm text-white/70">{body}</p>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  )
}

function RoomNotice({
  icon,
  title,
  children,
  tone = 'calm',
  action,
  onDismiss,
}: {
  icon: ReactNode
  title: string
  children?: ReactNode
  tone?: 'calm' | 'danger'
  action?: ReactNode
  onDismiss?: () => void
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex gap-3 rounded-2xl px-4 py-3.5 ring-1',
        tone === 'calm' ? 'bg-white/[0.06] ring-white/10' : 'bg-danger/15 ring-danger/30',
      )}
    >
      <span className={cn('mt-0.5 shrink-0 [&_svg]:size-5', tone === 'calm' ? 'text-brand-300' : 'text-[#ffb4ae]')}>{icon}</span>
      <div className="flex-1 text-sm leading-relaxed">
        <p className="font-semibold text-white">{title}</p>
        {children && <p className="mt-0.5 text-white/70">{children}</p>}
        {(action || onDismiss) && (
          <div className="mt-3 flex gap-2">
            {action}
            {onDismiss && (
              <Button size="sm" variant="onDarkGhost" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SideControl({
  label,
  onClick,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  children: ReactNode
}) {
  return (
    <button type="button" onClick={onClick} className="group flex flex-col items-center gap-2 justify-self-center">
      <span
        className={cn(
          'flex size-14 items-center justify-center rounded-full transition-colors',
          danger ? 'bg-danger text-white group-hover:bg-danger/85' : 'bg-white/10 text-white ring-1 ring-white/15 group-hover:bg-white/15',
        )}
      >
        {children}
      </span>
      <span className="text-sm font-medium text-white/80">{label}</span>
    </button>
  )
}

function RaiseHandButton({ raised, pending, onToggle }: { raised: boolean; pending: boolean; onToggle: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        aria-pressed={raised}
        aria-label={raised ? 'Lower hand' : 'Ask to pray aloud'}
        className={cn(
          'flex size-20 items-center justify-center rounded-full transition-colors disabled:opacity-70 sm:size-[5.5rem]',
          raised ? 'bg-brand-400 text-ink-900 hover:bg-brand-300' : 'bg-white text-plum-900 hover:bg-cream-100',
        )}
      >
        {pending ? <Loader2 className="size-8 animate-spin" aria-hidden /> : <Hand className="size-8" aria-hidden />}
      </button>
      <span className="text-sm font-semibold">{raised ? 'Waiting for host' : 'Ask to speak'}</span>
    </div>
  )
}

function PeopleHeader({ count }: { count: number | null }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-sans text-base font-semibold">In this prayer room</h2>
      {count !== null && <span className="text-sm text-white/60">{count}</span>}
    </div>
  )
}

function HostModeSwitch({ sessionId, mode }: { sessionId: string; mode: SessionMode }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = async (next: SessionMode) => {
    if (next === mode) return
    setPending(true)
    setError(null)
    try {
      await sessionService.setMode(sessionId, next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change the mode.')
    } finally {
      setPending(false)
    }
  }
  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-white/[0.06] p-1 ring-1 ring-white/10" role="radiogroup" aria-label="Session mode">
        {(['broadcast', 'interactive'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            disabled={pending}
            onClick={() => void set(m)}
            className={cn(
              'h-9 rounded-full text-sm font-semibold transition-colors',
              mode === m ? 'bg-white text-plum-900' : 'text-white/70 hover:text-white',
            )}
          >
            {m === 'broadcast' ? 'Broadcast' : 'Interactive'}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-[#ffb4ae]">{error}</p>}
    </>
  )
}
