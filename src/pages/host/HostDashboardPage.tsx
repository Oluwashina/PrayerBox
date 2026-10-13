import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { CalendarPlus, CircleStop, Pencil, Play, Plus, Share2, XCircle } from 'lucide-react'
import type { PrayerSession } from '@/domain/types'
import { groupSessions, modeLabel } from '@/domain/session'
import { useAuth } from '@/hooks/useAuth'
import { useNow } from '@/hooks/useNow'
import { useRoomParticipants } from '@/hooks/useRoomParticipants'
import { useSessions } from '@/hooks/useSessions'
import { sessionService } from '@/services'
import { formatElapsed } from '@/lib/format'
import { cn } from '@/lib/cn'
import { SessionEditorDialog } from '@/components/host/SessionEditorDialog'
import { PageIntro } from '@/components/layout/PageChrome'
import { SessionCard } from '@/components/SessionCard'
import { ShareSession } from '@/components/ShareSession'
import { LiveDot } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState, ErrorState, SessionCardSkeleton } from '@/components/ui/States'

type Tab = 'upcoming' | 'past'

type PendingAction =
  | { kind: 'edit'; session: PrayerSession }
  | { kind: 'share'; session: PrayerSession }
  | { kind: 'cancel'; session: PrayerSession }
  | { kind: 'end'; session: PrayerSession }
  | { kind: 'start'; session: PrayerSession }
  | null

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export function HostDashboardPage() {
  const { host } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const creating = params.get('new') === '1'
  const setCreating = (open: boolean) => setParams(open ? { new: '1' } : {}, { replace: true })

  const { sessions, loading, error, reload } = useSessions()
  const { live, upcoming, past } = groupSessions(sessions)
  const [tab, setTab] = useState<Tab>('upcoming')
  const [action, setAction] = useState<PendingAction>(null)
  const close = () => setAction(null)
  const firstName = host?.name.split(' ')[0] ?? ''

  return (
    <div>
      <PageIntro
        eyebrow="Host console"
        title={
          <>
            {greeting()}, <em className="text-plum-600">{firstName}.</em>
          </>
        }
        description="Schedule times of prayer, go live when you are ready, and share the link with the church."
        action={
          <Button size="lg" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
            New session
          </Button>
        }
      />

      <dl className="grid grid-cols-3 border-y border-ink-900/10">
        {[
          { label: 'Live now', value: live.length, accent: live.length > 0 },
          { label: 'Upcoming', value: upcoming.length },
          { label: 'Completed', value: past.filter((s) => s.status === 'ended').length },
        ].map((stat, i) => (
          <div key={stat.label} className={cn('py-6 sm:py-8', i > 0 && 'border-l border-ink-900/10 pl-5 sm:pl-8')}>
            <dt className="eyebrow text-ink-500">{stat.label}</dt>
            <dd className={cn('mt-3 font-serif text-[2.75rem] leading-none tabular-nums sm:text-6xl', stat.accent ? 'text-live' : 'text-ink-900')}>
              {loading ? '–' : stat.value}
            </dd>
          </div>
        ))}
      </dl>

      {error ? (
        <ErrorState className="mt-12" title="We could not load your sessions" body={error} onRetry={reload} />
      ) : (
        <>
          {live.length > 0 && (
            <section className="mt-12 flex flex-col gap-4" aria-label="Live now">
              {live.map((s) => (
                <LiveHostPanel
                  key={s.id}
                  session={s}
                  onShare={() => setAction({ kind: 'share', session: s })}
                  onEnd={() => setAction({ kind: 'end', session: s })}
                />
              ))}
            </section>
          )}

          <section className="mt-14" aria-label="Sessions">
            <div role="tablist" aria-label="Session lists" className="flex gap-8 border-b border-ink-900/10">
              {(
                [
                  ['upcoming', 'Upcoming', upcoming.length],
                  ['past', 'Past', past.length],
                ] as const
              ).map(([key, label, count]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={cn(
                    '-mb-px flex items-baseline gap-2 border-b py-4 font-serif text-[1.6rem] leading-none transition-colors',
                    tab === key ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-400 hover:text-ink-700',
                  )}
                >
                  {label}
                  <span className="font-sans text-xs tabular-nums text-ink-400">{count}</span>
                </button>
              ))}
            </div>

            <div role="tabpanel">
              {loading ? (
                <>
                  <SessionCardSkeleton />
                  <SessionCardSkeleton />
                </>
              ) : tab === 'upcoming' ? (
                upcoming.length === 0 ? (
                  <EmptyState
                    className="mt-8"
                    icon={<CalendarPlus />}
                    title="No upcoming sessions"
                    body="Schedule a time of prayer and share the link with your church."
                    action={<Button onClick={() => setCreating(true)}>Schedule a session</Button>}
                  />
                ) : (
                  upcoming.map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      to={`/host/sessions/${s.id}`}
                      actions={
                        <>
                          <Button size="sm" variant="brand" icon={<Play className="size-3.5" />} onClick={() => setAction({ kind: 'start', session: s })}>
                            Start
                          </Button>
                          <Button size="sm" variant="secondary" icon={<Share2 className="size-3.5" />} onClick={() => setAction({ kind: 'share', session: s })}>
                            Share
                          </Button>
                          <Button size="sm" variant="secondary" icon={<Pencil className="size-3.5" />} onClick={() => setAction({ kind: 'edit', session: s })}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-danger hover:bg-danger-soft"
                            icon={<XCircle className="size-3.5" />}
                            onClick={() => setAction({ kind: 'cancel', session: s })}
                          >
                            Cancel
                          </Button>
                        </>
                      }
                    />
                  ))
                )
              ) : past.length === 0 ? (
                <EmptyState className="mt-8" title="No past sessions yet" />
              ) : (
                past.map((s) => <SessionCard key={s.id} session={s} to={`/host/sessions/${s.id}`} />)
              )}
            </div>
          </section>
        </>
      )}

      <SessionEditorDialog open={creating} onClose={() => setCreating(false)} />
      <SessionEditorDialog
        open={action?.kind === 'edit'}
        onClose={close}
        session={action?.kind === 'edit' ? action.session : undefined}
      />

      <Dialog open={action?.kind === 'share'} onClose={close} title="Share this session" size="sm">
        {action?.kind === 'share' && <ShareSession session={action.session} layout="stack" />}
      </Dialog>

      <ConfirmDialog
        open={action?.kind === 'start'}
        onClose={close}
        tone="primary"
        title="Start this prayer session now?"
        body={
          <p>
            <strong>{action?.session.title}</strong> will go live and anyone with the link can join. You will be taken to
            the prayer room.
          </p>
        }
        cancelLabel="Not yet"
        confirmLabel="Start and open room"
        onConfirm={async () => {
          if (!action) return
          await sessionService.start(action.session.id)
          navigate(`/s/${action.session.id}/room`)
        }}
      />
      <ConfirmDialog
        open={action?.kind === 'cancel'}
        onClose={close}
        title="Cancel this session?"
        body={<p>People who open the link will see that “{action?.session.title}” was cancelled.</p>}
        cancelLabel="Keep session"
        confirmLabel="Cancel session"
        onConfirm={async () => action && sessionService.cancel(action.session.id)}
      />
      <ConfirmDialog
        open={action?.kind === 'end'}
        onClose={close}
        title="End this prayer session?"
        body={<p>Everyone in the room will be disconnected.</p>}
        cancelLabel="Keep praying"
        confirmLabel="End for everyone"
        onConfirm={async () => action && sessionService.end(action.session.id)}
      />
    </div>
  )
}

function LiveHostPanel({ session, onShare, onEnd }: { session: PrayerSession; onShare: () => void; onEnd: () => void }) {
  const now = useNow()
  const { participants, loading } = useRoomParticipants(session.id, true, 8000)
  const raised = participants.filter((p) => p.handRaised).length
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-plum-950 text-white">
      <div aria-hidden className="pointer-events-none absolute -top-24 right-0 size-80 rounded-full bg-plum-600/40 blur-[90px]" />
      <div className="relative flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow inline-flex items-center gap-2.5">
            <LiveDot /> Live · {modeLabel(session.mode)}
            {session.startedAt && <span className="font-mono tracking-normal text-white/50">{formatElapsed(session.startedAt, now)}</span>}
          </p>
          <h2 className="mt-5 text-[2.25rem] leading-[1.02] sm:text-5xl">{session.title}</h2>
          <div className="mt-6 flex gap-8">
            <div>
              <p className="eyebrow text-white/45">In the room</p>
              <p className="mt-2 font-serif text-4xl leading-none tabular-nums">{loading ? '–' : participants.length}</p>
            </div>
            <div className="border-l border-white/10 pl-8">
              <p className="eyebrow text-white/45">Asking to speak</p>
              <p className={cn('mt-2 font-serif text-4xl leading-none tabular-nums', raised > 0 && 'text-brand-300')}>
                {loading ? '–' : raised}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to={`/s/${session.id}/room`} variant="brand">
            Open prayer room
          </ButtonLink>
          <ButtonLink to={`/host/sessions/${session.id}`} variant="onDark">
            Manage
          </ButtonLink>
          <Button variant="onDark" icon={<Share2 className="size-4" />} onClick={onShare}>
            Share
          </Button>
          <Button variant="onDarkGhost" icon={<CircleStop className="size-4" />} onClick={onEnd}>
            End
          </Button>
        </div>
      </div>
    </div>
  )
}
