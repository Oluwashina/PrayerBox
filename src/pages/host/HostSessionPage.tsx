import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowLeft, ArrowRight, CircleStop, Pencil, Play, SearchX, XCircle } from 'lucide-react'
import { modeLabel } from '@/domain/session'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { useAttendance } from '@/hooks/useAttendance'
import { useRoomParticipants } from '@/hooks/useRoomParticipants'
import { useSession } from '@/hooks/useSessions'
import { sessionService } from '@/services'
import { formatDateTime, formatDay, formatDuration, formatTime } from '@/lib/format'
import { SessionEditorDialog } from '@/components/host/SessionEditorDialog'
import { DetailList } from '@/components/layout/PageChrome'
import { ParticipantList } from '@/components/ParticipantList'
import { ModePicker } from '@/components/SessionForm'
import { ShareSession } from '@/components/ShareSession'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState, ErrorState, InlineAlert, Skeleton } from '@/components/ui/States'

export function HostSessionPage() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()
  const { session, loading, error, notFound, reload } = useSession(sessionId)
  const roster = useRoomParticipants(sessionId, session?.status === 'live')
  const participants = roster.participants
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState<'start' | 'end' | 'cancel' | null>(null)
  const modeAction = useAsyncAction((mode: 'broadcast' | 'interactive') => sessionService.setMode(sessionId, mode))

  if (loading) {
    return (
      <div className="pt-14">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-6 h-20 w-3/4" />
        <Skeleton className="mt-10 h-64 rounded-[1.5rem]" />
      </div>
    )
  }
  if (error) return <ErrorState className="mt-14" body={error} onRetry={reload} />
  if (notFound || !session) {
    return (
      <EmptyState
        className="mt-14"
        icon={<SearchX />}
        title="Session not found"
        action={<ButtonLink to="/host">Back to console</ButtonLink>}
      />
    )
  }

  const isLive = session.status === 'live'
  const isOver = session.status === 'ended' || session.status === 'cancelled'

  return (
    <div className="pt-8 sm:pt-12">
      <ButtonLink to="/host" variant="ghost" size="sm" className="-ml-3">
        <ArrowLeft className="size-4" aria-hidden /> Host console
      </ButtonLink>

      <div className="mt-8 grid gap-14 lg:grid-cols-[1fr_400px] lg:gap-20">
        <div>
          <StatusBadge status={session.status} />
          <h1 className="mt-6 text-[3rem] leading-[0.98] text-ink-900 sm:text-[4.25rem]">{session.title}</h1>
          <p className="mt-5 max-w-xl font-serif text-[1.5rem] leading-snug text-ink-700 italic">
            For {session.prayerFocus.charAt(0).toLowerCase() + session.prayerFocus.slice(1)}.
          </p>
          {session.description && <p className="mt-5 max-w-xl leading-relaxed text-ink-500">{session.description}</p>}

          {!isOver && (
            <div className="mt-10 flex flex-wrap gap-3">
              {isLive ? (
                <>
                  <ButtonLink to={`/s/${session.id}/room`} variant="brand" size="lg">
                    Open prayer room <ArrowRight className="size-4" aria-hidden />
                  </ButtonLink>
                  <Button variant="secondary" size="lg" icon={<CircleStop className="size-4" />} onClick={() => setConfirm('end')}>
                    End session
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="primary" size="lg" icon={<Play className="size-4" />} onClick={() => setConfirm('start')}>
                    Start session
                  </Button>
                  <Button variant="secondary" size="lg" icon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="text-danger hover:bg-danger-soft"
                    icon={<XCircle className="size-4" />}
                    onClick={() => setConfirm('cancel')}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          )}

          <DetailList
            className="mt-14 max-w-xl"
            items={[
              { label: 'Date', value: formatDay(session.scheduledStart) },
              { label: 'Time', value: formatTime(session.scheduledStart) },
              { label: 'Duration', value: formatDuration(session.durationMinutes) },
              { label: 'Format', value: modeLabel(session.mode) },
              { label: 'Led by', value: session.hostName },
              { label: session.endedAt ? 'Ended' : 'Status', value: session.endedAt ? formatDateTime(session.endedAt, true) : isLive ? 'Live' : 'Scheduled' },
            ]}
          />

          {!isOver && (
            <section className="mt-14 max-w-xl border-t border-ink-900/10 pt-8">
              <ModePicker value={session.mode} onChange={(m) => void modeAction.run(m)} />
              {isLive && (
                <p className="mt-4 text-[0.8125rem] text-ink-500">
                  Changes take effect immediately. Switching to broadcast mutes everyone except the host.
                </p>
              )}
              {modeAction.error && (
                <InlineAlert tone="danger" className="mt-4">
                  {modeAction.error}
                </InlineAlert>
              )}
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-10">
          {!isOver && (
            <section>
              <p className="eyebrow text-ink-500">Share the link</p>
              <p className="mt-3 text-[0.9375rem] text-ink-500">Anyone with the link can listen. No account needed.</p>
              <ShareSession session={session} layout="stack" className="mt-5" />
            </section>
          )}

          {session.status === 'ended' ? (
            <AttendanceCard sessionId={session.id} />
          ) : (
            <section className="rounded-[1.5rem] border border-ink-900/[0.08] bg-white p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[1.75rem] leading-none">Participants</h2>
                {isLive && !roster.loading && <span className="text-[0.8125rem] tabular-nums text-ink-500">{participants.length} connected</span>}
              </div>
              <div className="mt-5">
                {isLive && roster.error && (
                  <InlineAlert tone="danger" className="mb-3">
                    {roster.error}
                  </InlineAlert>
                )}
                {isLive ? (
                  roster.loading ? (
                    <Skeleton className="h-24" />
                  ) : participants.length === 0 ? (
                    <p className="text-[0.9375rem] text-ink-500">No one has joined yet. Share the link to invite people.</p>
                  ) : (
                    <ParticipantList sessionId={session.id} participants={participants} mode={session.mode} canModerate onChanged={roster.refresh} />
                  )
                ) : (
                  <p className="text-[0.9375rem] text-ink-500">
                    {isOver ? 'This session was cancelled.' : 'People who join will appear here once the session is live.'}
                  </p>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>

      <SessionEditorDialog open={editing} onClose={() => setEditing(false)} session={session} />
      <ConfirmDialog
        open={confirm === 'start'}
        onClose={() => setConfirm(null)}
        tone="primary"
        title="Start this prayer session now?"
        body={<p>The session will go live and you will be taken to the prayer room.</p>}
        cancelLabel="Not yet"
        confirmLabel="Start and open room"
        onConfirm={async () => {
          await sessionService.start(session.id)
          navigate(`/s/${session.id}/room`)
        }}
      />
      <ConfirmDialog
        open={confirm === 'end'}
        onClose={() => setConfirm(null)}
        title="End this prayer session?"
        body={<p>Everyone in the room will be disconnected.</p>}
        cancelLabel="Keep praying"
        confirmLabel="End for everyone"
        onConfirm={() => sessionService.end(session.id)}
      />
      <ConfirmDialog
        open={confirm === 'cancel'}
        onClose={() => setConfirm(null)}
        title="Cancel this session?"
        body={<p>People who open the link will see that it was cancelled.</p>}
        cancelLabel="Keep session"
        confirmLabel="Cancel session"
        onConfirm={() => sessionService.cancel(session.id)}
      />
    </div>
  )
}

function AttendanceCard({ sessionId }: { sessionId: string }) {
  const { attendees, loading, error, reload } = useAttendance(sessionId, true)

  return (
    <section className="rounded-[1.5rem] border border-ink-900/[0.08] bg-white p-6" aria-labelledby="attendance-heading">
      <p className="eyebrow text-ink-500">Attendance</p>
      <h2 id="attendance-heading" className="mt-3 text-[1.75rem] leading-none">
        {loading ? 'Who prayed' : `${attendees.length} ${attendees.length === 1 ? 'person' : 'people'} joined`}
      </h2>
      <div className="mt-5">
        {error ? (
          <InlineAlert tone="danger" title="Could not load attendance">
            {error}{' '}
            <button type="button" className="font-medium underline" onClick={() => void reload()}>
              Try again
            </button>
          </InlineAlert>
        ) : loading ? (
          <Skeleton className="h-24" />
        ) : attendees.length === 0 ? (
          <p className="text-[0.9375rem] text-ink-500">No attendance was recorded for this session.</p>
        ) : (
          <ul className="divide-y divide-ink-900/[0.07]">
            {attendees.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink-900/[0.05] text-[0.8125rem] font-semibold text-ink-700"
                >
                  {a.displayName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9375rem] font-medium text-ink-900">
                    {a.displayName}
                    {a.isHost && <span className="eyebrow ml-2 text-[0.6rem] text-plum-600">Host</span>}
                  </p>
                  <p className="text-[0.8125rem] text-ink-500 tabular-nums">
                    Joined {formatTime(a.firstJoinedAt)}
                    {a.visits > 1 && ` · rejoined ${a.visits - 1}×`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
