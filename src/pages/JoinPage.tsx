import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { ArrowLeft, CalendarClock, Headphones, HeartHandshake, Info, Mic, SearchX, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useGuestName } from '@/hooks/useGuestName'
import { useNow } from '@/hooks/useNow'
import { useSession } from '@/hooks/useSessions'
import { formatRelativeStart } from '@/lib/format'
import { PrayerFocus, SessionMeta } from '@/components/SessionMeta'
import { ShareSession } from '@/components/ShareSession'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { EmptyState, ErrorState, InlineAlert, Skeleton } from '@/components/ui/States'

export function JoinPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const justLeft = (location.state as { left?: boolean } | null)?.left
  const { session, loading, error, notFound, reload } = useSession(sessionId)
  const { host } = useAuth()
  const [savedName, saveName] = useGuestName()
  const [name, setName] = useState(savedName)
  const [nameError, setNameError] = useState<string>()
  const now = useNow(30000)

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl pt-6">
        <Skeleton className="h-[28rem] rounded-[2rem]" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="mx-auto max-w-2xl pt-6">
        <ErrorState title="We could not load this prayer session" body={error} onRetry={reload} />
      </div>
    )
  }
  if (notFound || !session) {
    return (
      <div className="mx-auto max-w-2xl pt-6">
        <EmptyState
          icon={<SearchX className="size-8" />}
          title="We could not find this prayer session"
          body="The link may be incomplete or the session may have been removed. Ask the person who shared it for a new link."
          action={<ButtonLink to="/">See current sessions</ButtonLink>}
        />
      </div>
    )
  }

  const isLive = session.status === 'live'

  const join = (e: FormEvent) => {
    e.preventDefault()
    const displayName = host ? host.name : name.trim()
    if (!host && displayName.length < 2) {
      setNameError('Please enter your name so others know who is praying with them.')
      return
    }
    if (!host) saveName(displayName)
    navigate(`/s/${session.id}/room`)
  }

  return (
    <div className="mx-auto max-w-2xl pt-2 sm:pt-6">
      <ButtonLink to="/" variant="ghost" size="sm" className="-ml-3 mb-4">
        <ArrowLeft className="size-4" aria-hidden /> All prayer sessions
      </ButtonLink>

      <Card className="overflow-hidden rounded-[2rem]">
        <div className="bg-cream-100/60 p-6 sm:p-9">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={session.status} />
            {session.status === 'scheduled' && (
              <span className="text-sm font-medium text-ink-500">{formatRelativeStart(session.scheduledStart, now)}</span>
            )}
          </div>
          <h1 className="mt-4 text-3xl leading-tight font-medium sm:text-4xl">{session.title}</h1>
          <div className="mt-3">
            <PrayerFocus focus={session.prayerFocus} />
          </div>
          {session.description && <p className="mt-4 leading-relaxed text-ink-700">{session.description}</p>}
          <SessionMeta session={session} className="mt-5" />
          <p className="mt-3 text-sm text-ink-500">Led by {session.hostName}</p>
        </div>

        <div className="p-6 sm:p-9">
          {justLeft && isLive && (
            <InlineAlert tone="info" icon={<HeartHandshake />} className="mb-6" title="You left the prayer room">
              You can rejoin at any time while the session is live.
            </InlineAlert>
          )}

          {session.status === 'ended' && (
            <EmptyState
              icon={<HeartHandshake className="size-8" />}
              title="This prayer session has ended"
              body="Thank you for praying with us. See what is coming up next."
              action={<ButtonLink to="/sessions">Upcoming sessions</ButtonLink>}
            />
          )}

          {session.status === 'cancelled' && (
            <EmptyState
              icon={<CalendarClock className="size-8" />}
              title="This session was cancelled"
              body="We are sorry for any inconvenience. Please join us at another time of prayer."
              action={<ButtonLink to="/sessions">See other sessions</ButtonLink>}
            />
          )}

          {(isLive || session.status === 'scheduled') && (
            <form onSubmit={join} noValidate className="flex flex-col gap-5">
              {host ? (
                <InlineAlert tone="info" icon={<ShieldCheck />} title={`Joining as host: ${host.name}`}>
                  You can speak and manage participants in the room.
                </InlineAlert>
              ) : (
                <Field
                  label="Your name"
                  error={nameError}
                  hint="Only your name is needed. No account or app required."
                >
                  {(p) => (
                    <Input
                      {...p}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        setNameError(undefined)
                      }}
                      placeholder="e.g. Mary"
                      autoComplete="given-name"
                      enterKeyHint="go"
                      maxLength={40}
                    />
                  )}
                </Field>
              )}

              {session.mode === 'interactive' && !host && (
                <InlineAlert tone="info" icon={<Mic />} title="About your microphone">
                  You will join as a listener with your microphone off. If the host invites you to pray aloud, your
                  browser will ask permission to use your microphone. You can say no and keep listening.
                </InlineAlert>
              )}
              {host && (
                <InlineAlert tone="info" icon={<Mic />} title="Microphone permission">
                  Your browser will ask to use your microphone when you unmute.
                </InlineAlert>
              )}

              {isLive ? (
                <Button type="submit" size="lg" variant="primary" fullWidth icon={<Headphones className="size-5" />}>
                  Join Prayer Room
                </Button>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button type="button" size="lg" variant="secondary" fullWidth disabled>
                    The room opens when the host begins
                  </Button>
                  <p className="flex items-center justify-center gap-1.5 text-center text-sm text-ink-500">
                    <Info className="size-4" aria-hidden /> Keep this page open. It will update when prayer starts.
                  </p>
                </div>
              )}

              <p className="text-center text-sm text-ink-500">Tip: headphones help avoid echo for everyone.</p>
            </form>
          )}
        </div>
      </Card>

      {(isLive || session.status === 'scheduled') && (
        <section className="mt-8" aria-labelledby="invite">
          <h2 id="invite" className="text-xl font-medium">
            Invite someone to pray
          </h2>
          <ShareSession session={session} className="mt-4" />
        </section>
      )}
    </div>
  )
}
