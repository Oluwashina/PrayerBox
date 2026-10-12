import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowLeft, Headphones, Pencil, Play, SearchX, CircleStop, UsersRound, XCircle } from 'lucide-react'
import { useRoomParticipants } from '@/hooks/useRoomParticipants'
import { useSession } from '@/hooks/useSessions'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { sessionService } from '@/services'
import { formatDateTime } from '@/lib/format'
import { SessionEditorDialog } from '@/components/host/SessionEditorDialog'
import { ParticipantList } from '@/components/ParticipantList'
import { ModePicker } from '@/components/SessionForm'
import { PrayerFocus, SessionMeta } from '@/components/SessionMeta'
import { ShareSession } from '@/components/ShareSession'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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

  if (loading) return <Skeleton className="mt-8 h-[30rem] rounded-[2rem]" />
  if (error) return <ErrorState className="mt-8" body={error} onRetry={reload} />
  if (notFound || !session) {
    return (
      <EmptyState
        className="mt-8"
        icon={<SearchX className="size-8" />}
        title="Session not found"
        action={<ButtonLink to="/host">Back to dashboard</ButtonLink>}
      />
    )
  }

  const isLive = session.status === 'live'
  const isOver = session.status === 'ended' || session.status === 'cancelled'

  return (
    <div className="pt-2 sm:pt-6">
      <ButtonLink to="/host" variant="ghost" size="sm" className="-ml-3 mb-4">
        <ArrowLeft className="size-4" aria-hidden /> Dashboard
      </ButtonLink>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-6">
          <Card className="rounded-[2rem] p-6 sm:p-8">
            <StatusBadge status={session.status} />
            <h1 className="mt-4 text-3xl font-medium sm:text-4xl">{session.title}</h1>
            <div className="mt-3">
              <PrayerFocus focus={session.prayerFocus} />
            </div>
            {session.description && <p className="mt-4 leading-relaxed text-ink-700">{session.description}</p>}
            <SessionMeta session={session} className="mt-5" />
            <p className="mt-3 text-sm text-ink-500">Led by {session.hostName}</p>
            {session.endedAt && <p className="mt-1 text-sm text-ink-500">Ended {formatDateTime(session.endedAt)}</p>}

            {!isOver && (
              <div className="mt-7 flex flex-wrap gap-3">
                {isLive ? (
                  <>
                    <ButtonLink to={`/s/${session.id}/room`} variant="brand" size="lg" icon={<Headphones className="size-5" />}>
                      Open prayer room
                    </ButtonLink>
                    <Button variant="secondary" size="lg" icon={<CircleStop className="size-5" />} onClick={() => setConfirm('end')}>
                      End session
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="primary" size="lg" icon={<Play className="size-5" />} onClick={() => setConfirm('start')}>
                      Start broadcast
                    </Button>
                    <Button variant="secondary" size="lg" icon={<Pencil className="size-5" />} onClick={() => setEditing(true)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="lg"
                      className="text-danger hover:bg-danger-soft"
                      icon={<XCircle className="size-5" />}
                      onClick={() => setConfirm('cancel')}
                    >
                      Cancel session
                    </Button>
                  </>
                )}
              </div>
            )}
          </Card>

          {!isOver && (
            <Card className="rounded-[2rem] p-6 sm:p-8">
              <ModePicker value={session.mode} onChange={(m) => void modeAction.run(m)} />
              {isLive && (
                <p className="mt-3 text-sm text-ink-500">
                  Changing mode takes effect immediately. Switching to broadcast mutes everyone except the host.
                </p>
              )}
              {modeAction.error && (
                <InlineAlert tone="danger" className="mt-4">
                  {modeAction.error}
                </InlineAlert>
              )}
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {!isOver && (
            <Card className="rounded-[2rem] p-6">
              <h2 className="font-sans text-base font-semibold">Share the link</h2>
              <p className="mt-1 text-sm text-ink-500">Anyone with the link can listen. No account needed.</p>
              <ShareSession session={session} layout="stack" className="mt-4" />
            </Card>
          )}

          <Card className="rounded-[2rem] p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-base font-semibold">Participants</h2>
              <span className="flex items-center gap-2 text-sm text-ink-500">
                {isLive && !roster.loading ? `${participants.length} connected` : null}
              </span>
            </div>
            <div className="mt-4">
              {isLive && roster.error && <InlineAlert tone="danger" className="mb-3">{roster.error}</InlineAlert>}
              {isLive ? (
                roster.loading ? (
                  <Skeleton className="h-24 rounded-2xl" />
                ) : participants.length === 0 ? (
                  <EmptyState icon={<UsersRound className="size-7" />} title="No one has joined yet" body="Share the link to invite people." />
                ) : (
                  <ParticipantList sessionId={session.id} participants={participants} mode={session.mode} canModerate onChanged={roster.refresh} />
                )
              ) : (
                <p className="text-sm text-ink-500">
                  {isOver ? 'This session is no longer live.' : 'People who join will appear here once the session is live.'}
                </p>
              )}
            </div>
          </Card>
        </div>
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
