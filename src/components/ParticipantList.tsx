import { useState } from 'react'
import { Hand, Mic, MicOff, ShieldCheck, UserX, Volume2 } from 'lucide-react'
import type { Participant, SessionMode } from '@/domain/types'
import { moderationService } from '@/services'
import { initials } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Button } from './ui/Button'
import { Dialog } from './ui/Dialog'

const order: Record<Participant['role'], number> = { host: 0, speaker: 1, listener: 2 }

function sortParticipants<T extends Participant>(list: T[]) {
  return [...list].sort(
    (a, b) =>
      order[a.role] - order[b.role] ||
      Number(b.handRaised) - Number(a.handRaised) ||
      a.joinedAt.localeCompare(b.joinedAt),
  )
}

interface ParticipantListProps {
  sessionId: string
  participants: Array<Participant & { isSpeaking?: boolean }>
  mode: SessionMode
  currentParticipantId?: string
  canModerate?: boolean
  tone?: 'light' | 'dark'
  /** Called after a moderation action succeeds, e.g. to refresh a polled roster. */
  onChanged?: () => void
}

export function ParticipantList({
  sessionId,
  participants,
  mode,
  currentParticipantId,
  canModerate = false,
  tone = 'light',
  onChanged,
}: ParticipantListProps) {
  const [removing, setRemoving] = useState<Participant | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const dark = tone === 'dark'

  const act = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id)
    setActionError(null)
    try {
      await fn()
      onChanged?.()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'That did not work. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  const sorted = sortParticipants(participants)
  const raised = sorted.filter((p) => p.handRaised).length

  return (
    <>
      {actionError && (
        <p role="alert" className={cn('mb-3 text-sm font-medium', dark ? 'text-[#ffb4ae]' : 'text-danger')}>
          {actionError}
        </p>
      )}
      {canModerate && mode === 'interactive' && raised > 0 && (
        <p className={cn('mb-3 flex items-center gap-2 text-sm font-medium', dark ? 'text-brand-300' : 'text-plum-700')}>
          <Hand className="size-4" aria-hidden />
          {raised} {raised === 1 ? 'person would' : 'people would'} like to pray aloud
        </p>
      )}
      <ul className="flex flex-col gap-1.5">
        {sorted.map((p) => {
          const isYou = p.id === currentParticipantId
          const speaking = p.canSpeak && !p.isMuted
          return (
            <li
              key={p.id}
              className={cn(
                'flex flex-wrap items-center gap-3 rounded-2xl px-3 py-2.5',
                dark ? 'bg-white/[0.04]' : 'bg-cream-50',
                p.handRaised && (dark ? 'ring-1 ring-brand-300/40' : 'ring-1 ring-plum-200'),
              )}
            >
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                  p.role === 'host'
                    ? 'bg-brand-400 text-ink-900'
                    : dark
                      ? 'bg-white/10 text-white'
                      : 'bg-plum-100 text-plum-800',
                  p.isSpeaking && 'ring-2 ring-brand-300 ring-offset-2 ring-offset-transparent',
                )}
                aria-hidden
              >
                {initials(p.displayName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('truncate font-medium', dark ? 'text-white' : 'text-ink-900')}>
                  {p.displayName}
                  {isYou && <span className={cn('font-normal', dark ? 'text-white/60' : 'text-ink-500')}> (you)</span>}
                </p>
                <p className={cn('flex items-center gap-1 text-xs', dark ? 'text-white/60' : 'text-ink-500')}>
                  {p.isSpeaking ? (
                    'Speaking'
                  ) : p.role === 'host' ? (
                    <>
                      <ShieldCheck className="size-3.5" aria-hidden /> Host
                    </>
                  ) : p.canSpeak ? (
                    'Can speak'
                  ) : p.handRaised ? (
                    'Asked to speak'
                  ) : (
                    'Listening'
                  )}
                </p>
              </div>

              <span className={cn('flex items-center', dark ? 'text-white/60' : 'text-ink-400')}>
                {p.handRaised && (
                  <Hand className={cn('mr-2 size-4', dark ? 'text-brand-300' : 'text-plum-600')} aria-label="Hand raised" />
                )}
                {p.canSpeak ? (
                  speaking ? (
                    <Mic className={cn('size-4', dark ? 'text-brand-300' : 'text-plum-600')} aria-label="Microphone on" />
                  ) : (
                    <MicOff className="size-4" aria-label="Muted" />
                  )
                ) : (
                  <Volume2 className="size-4" aria-label="Listening" />
                )}
              </span>

              {canModerate && p.role !== 'host' && (
                <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
                  {mode === 'interactive' &&
                    (p.canSpeak ? (
                      <Button
                        size="sm"
                        variant={dark ? 'onDark' : 'secondary'}
                        disabled={busyId === p.id}
                        onClick={() => act(p.id, () => moderationService.setCanSpeak(sessionId, p.id, false))}
                      >
                        Stop speaking
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant={p.handRaised ? 'brand' : dark ? 'onDark' : 'secondary'}
                        disabled={busyId === p.id}
                        onClick={() => act(p.id, () => moderationService.setCanSpeak(sessionId, p.id, true))}
                      >
                        Allow to speak
                      </Button>
                    ))}
                  {speaking && (
                    <Button
                      size="sm"
                      variant={dark ? 'onDark' : 'secondary'}
                      disabled={busyId === p.id}
                      onClick={() => act(p.id, () => moderationService.muteParticipant(sessionId, p.id))}
                    >
                      Mute
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={dark ? 'onDarkGhost' : 'ghost'}
                    className={dark ? '' : 'text-danger hover:bg-danger-soft'}
                    icon={<UserX className="size-4" aria-hidden />}
                    onClick={() => setRemoving(p)}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing?.displayName ?? ''}?`}
        description="They will be disconnected from this prayer session."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoving(null)}>
              Keep them
            </Button>
            <Button
              variant="danger"
              loading={busyId === removing?.id}
              onClick={async () => {
                if (!removing) return
                await act(removing.id, () => moderationService.remove(sessionId, removing.id))
                setRemoving(null)
              }}
            >
              Remove from session
            </Button>
          </>
        }
      >
        <p className="text-ink-700">
          Use this only for disruptive behaviour. They will not be able to rejoin this session from the same browser
          tab.
        </p>
      </Dialog>
    </>
  )
}
