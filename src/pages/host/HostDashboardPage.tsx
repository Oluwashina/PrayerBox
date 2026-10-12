import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { CalendarDays, CalendarPlus, History, Pencil, Play, Plus, Share2, CircleStop, UsersRound, XCircle } from 'lucide-react'
import type { PrayerSession } from '@/domain/types'
import { groupSessions, modeLabel } from '@/domain/session'
import { useAuth } from '@/hooks/useAuth'
import { useRoomParticipants } from '@/hooks/useRoomParticipants'
import { useSessions } from '@/hooks/useSessions'
import { sessionService } from '@/services'
import { formatDateTime, formatRelativeStart } from '@/lib/format'
import { cn } from '@/lib/cn'
import { SessionEditorDialog } from '@/components/host/SessionEditorDialog'
import { ShareSession } from '@/components/ShareSession'
import { Badge, LiveDot, StatusBadge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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

  return (
    <div className="pt-4 sm:pt-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-plum-600">Welcome, {host?.name}</p>
          <h1 className="mt-1 text-4xl font-medium sm:text-5xl">Host dashboard</h1>
        </div>
        <Button size="lg" icon={<Plus className="size-5" />} onClick={() => setCreating(true)}>
          New prayer session
        </Button>
      </div>

      {error ? (
        <ErrorState className="mt-10" title="We could not load your sessions" body={error} onRetry={reload} />
      ) : (
        <>
          {live.length > 0 && (
            <section className="mt-10" aria-labelledby="live-now">
              <h2 id="live-now" className="sr-only">
                Live now
              </h2>
              <div className="flex flex-col gap-4">
                {live.map((s) => (
                  <LiveHostCard key={s.id} session={s} onShare={() => setAction({ kind: 'share', session: s })} onEnd={() => setAction({ kind: 'end', session: s })} />
                ))}
              </div>
            </section>
          )}

          <section className="mt-10" aria-label="Sessions">
            <div role="tablist" aria-label="Session lists" className="inline-flex rounded-full bg-cream-100 p-1">
              {(
                [
                  ['upcoming', `Upcoming (${upcoming.length})`, CalendarDays],
                  ['past', `Past (${past.length})`, History],
                ] as const
              ).map(([key, label, Icon]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={cn(
                    'flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors',
                    tab === key ? 'bg-white text-plum-800 shadow-soft' : 'text-ink-500 hover:text-ink-900',
                  )}
                >
                  <Icon className="size-4" aria-hidden /> {label}
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3" role="tabpanel">
              {loading ? (
                <>
                  <SessionCardSkeleton />
                  <SessionCardSkeleton />
                </>
              ) : tab === 'upcoming' ? (
                upcoming.length === 0 ? (
                  <EmptyState
                    icon={<CalendarPlus className="size-8" />}
                    title="No upcoming sessions"
                    body="Schedule a time of prayer and share the link with your church."
                    action={<Button onClick={() => setCreating(true)}>Schedule a session</Button>}
                  />
                ) : (
                  upcoming.map((s) => (
                    <HostSessionRow key={s.id} session={s}>
                      <Button size="sm" variant="brand" icon={<Play className="size-4" />} onClick={() => setAction({ kind: 'start', session: s })}>
                        Start
                      </Button>
                      <Button size="sm" variant="secondary" icon={<Share2 className="size-4" />} onClick={() => setAction({ kind: 'share', session: s })}>
                        Share
                      </Button>
                      <Button size="sm" variant="secondary" icon={<Pencil className="size-4" />} onClick={() => setAction({ kind: 'edit', session: s })}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-danger hover:bg-danger-soft"
                        icon={<XCircle className="size-4" />}
                        onClick={() => setAction({ kind: 'cancel', session: s })}
                      >
                        Cancel
                      </Button>
                    </HostSessionRow>
                  ))
                )
              ) : past.length === 0 ? (
                <EmptyState icon={<History className="size-8" />} title="No past sessions yet" />
              ) : (
                past.map((s) => <HostSessionRow key={s.id} session={s} />)
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

      <Dialog open={action?.kind === 'share'} onClose={close} title="Share this prayer session" size="sm">
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

function HostSessionRow({ session, children }: { session: PrayerSession; children?: ReactNode }) {
  return (
    <Card className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
      <Link to={`/host/sessions/${session.id}`} className="group min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-500">
          <span className="font-medium">{formatDateTime(session.scheduledStart, true)}</span>
          {session.status === 'scheduled' ? (
            <span>· {formatRelativeStart(session.scheduledStart)}</span>
          ) : (
            <StatusBadge status={session.status} />
          )}
          <Badge tone="neutral">{modeLabel(session.mode)}</Badge>
        </div>
        <h3 className="mt-1.5 text-xl font-medium group-hover:text-plum-800">{session.title}</h3>
        <p className="mt-0.5 truncate text-sm text-ink-500">
          {session.prayerFocus} · {session.hostName}
        </p>
      </Link>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </Card>
  )
}

function LiveHostCard({ session, onShare, onEnd }: { session: PrayerSession; onShare: () => void; onEnd: () => void }) {
  const { participants, loading } = useRoomParticipants(session.id, true, 8000)
  const raised = participants.filter((p) => p.handRaised).length
  return (
    <div className="flex flex-col gap-5 rounded-[2rem] bg-plum-900 p-6 text-white shadow-lift sm:p-8 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
          <LiveDot /> LIVE NOW · {modeLabel(session.mode)}
        </span>
        <h2 className="mt-3 text-2xl font-medium sm:text-3xl">{session.title}</h2>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70">
          <span className="flex items-center gap-1.5">
            <UsersRound className="size-4" aria-hidden /> {loading ? '…' : participants.length} connected
          </span>
          {raised > 0 && <span className="text-brand-300">{raised} asking to speak</span>}
        </p>
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
  )
}
