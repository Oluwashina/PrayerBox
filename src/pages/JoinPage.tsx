import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { ArrowLeft, ArrowRight, Headphones, HeartHandshake, Mic, SearchX, ShieldCheck } from 'lucide-react'
import { modeLabel } from '@/domain/session'
import { useAuth } from '@/hooks/useAuth'
import { useGuestName } from '@/hooks/useGuestName'
import { useNow } from '@/hooks/useNow'
import { useSession } from '@/hooks/useSessions'
import { formatDay, formatDuration, formatRelativeStart, formatTime } from '@/lib/format'
import { DetailList } from '@/components/layout/PageChrome'
import { ShareSession } from '@/components/ShareSession'
import { LiveDot, StatusBadge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
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
      <div className="grid gap-12 pt-14 lg:grid-cols-[1fr_420px]">
        <div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-6 h-20 w-4/5" />
          <Skeleton className="mt-6 h-5 w-2/3" />
        </div>
        <Skeleton className="h-96 rounded-[1.5rem]" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="mx-auto max-w-xl pt-16">
        <ErrorState title="We could not load this prayer session" body={error} onRetry={reload} />
      </div>
    )
  }
  if (notFound || !session) {
    return (
      <div className="mx-auto max-w-xl pt-16">
        <EmptyState
          icon={<SearchX />}
          title="We could not find this session"
          body="The link may be incomplete or the session may have been removed. Ask the person who shared it for a new link."
          action={<ButtonLink to="/sessions">See the schedule</ButtonLink>}
        />
      </div>
    )
  }

  const isLive = session.status === 'live'
  const isOpen = isLive || session.status === 'scheduled'

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
    <div className="pt-8 sm:pt-12">
      <ButtonLink to="/sessions" variant="ghost" size="sm" className="-ml-3">
        <ArrowLeft className="size-4" aria-hidden /> Schedule
      </ButtonLink>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_420px] lg:gap-20">
        {/* Details */}
        <article className="animate-fade-up">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={session.status} />
            {session.status === 'scheduled' && (
              <span className="text-[0.8125rem] text-ink-500">{formatRelativeStart(session.scheduledStart, now)}</span>
            )}
          </div>
          <h1 className="mt-6 text-[3rem] leading-[0.98] text-ink-900 sm:text-[4.5rem]">{session.title}</h1>
          <p className="mt-6 max-w-xl font-serif text-[1.6rem] leading-snug text-ink-700 italic">
            For {session.prayerFocus.charAt(0).toLowerCase() + session.prayerFocus.slice(1)}.
          </p>
          {session.description && (
            <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-ink-500">{session.description}</p>
          )}

          <DetailList
            className="mt-12 max-w-xl"
            items={[
              { label: 'Date', value: formatDay(session.scheduledStart) },
              { label: 'Time', value: formatTime(session.scheduledStart) },
              { label: 'Duration', value: formatDuration(session.durationMinutes) },
              { label: 'Format', value: modeLabel(session.mode) },
              { label: 'Led by', value: session.hostName },
              { label: 'Open to', value: 'Everyone' },
            ]}
          />
        </article>

        {/* Join panel */}
        <aside className="lg:pt-2">
          <div className="lg:sticky lg:top-28">
            <div className="overflow-hidden rounded-[1.5rem] border border-ink-900/[0.08] bg-white shadow-lift">
              <div className="flex items-center justify-between border-b border-ink-900/[0.08] px-6 py-4 sm:px-8">
                {isLive ? (
                  <span className="eyebrow inline-flex items-center gap-2.5 text-ink-900">
                    <LiveDot /> In session now
                  </span>
                ) : isOpen ? (
                  <span className="eyebrow text-ink-500">Room opens at {formatTime(session.scheduledStart)}</span>
                ) : (
                  <span className="eyebrow text-ink-500">{session.status === 'ended' ? 'Concluded' : 'Cancelled'}</span>
                )}
                <Headphones className="size-4 text-ink-400" aria-hidden />
              </div>

              <div className="p-6 sm:p-8">
                {justLeft && isLive && (
                  <InlineAlert tone="info" icon={<HeartHandshake />} className="mb-6" title="You left the prayer room">
                    You can rejoin at any time while the session is live.
                  </InlineAlert>
                )}

                {session.status === 'ended' && (
                  <div>
                    <p className="font-serif text-[2rem] leading-tight">Amen. This prayer has ended.</p>
                    <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-500">
                      Thank you for praying with us. See what is coming up next.
                    </p>
                    <ButtonLink to="/sessions" className="mt-6" fullWidth>
                      Upcoming sessions
                    </ButtonLink>
                  </div>
                )}

                {session.status === 'cancelled' && (
                  <div>
                    <p className="font-serif text-[2rem] leading-tight">This session was cancelled.</p>
                    <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-500">
                      We are sorry for any inconvenience. Please join us at another time of prayer.
                    </p>
                    <ButtonLink to="/sessions" className="mt-6" fullWidth>
                      See other sessions
                    </ButtonLink>
                  </div>
                )}

                {isOpen && (
                  <form onSubmit={join} noValidate className="flex flex-col gap-5">
                    <p className="font-serif text-[2rem] leading-tight">{isLive ? 'Join the prayer' : 'Get ready to pray'}</p>
                    {host ? (
                      <InlineAlert tone="info" icon={<ShieldCheck />} title={`Joining as host · ${host.name}`}>
                        You can speak and manage participants in the room.
                      </InlineAlert>
                    ) : (
                      <Field label="Your name" error={nameError} hint="Only your name is needed. No account or app.">
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

                    {isLive ? (
                      <Button type="submit" size="lg" variant="primary" fullWidth>
                        Enter the prayer room <ArrowRight className="size-4" aria-hidden />
                      </Button>
                    ) : (
                      <div>
                        <Button type="button" size="lg" variant="secondary" fullWidth disabled>
                          Opens when the host begins
                        </Button>
                        <p className="mt-3 text-center text-[0.8125rem] text-ink-500">
                          Stay on this page. It will update as soon as the host starts the session.
                        </p>
                      </div>
                    )}

                    <ul className="mt-1 flex flex-col gap-3 border-t border-ink-900/[0.08] pt-5 text-[0.8125rem] leading-relaxed text-ink-500">
                      <li className="flex gap-3">
                        <Mic className="mt-0.5 size-4 shrink-0 text-ink-400" aria-hidden />
                        {host
                          ? 'Your browser will ask to use your microphone when you unmute.'
                          : session.mode === 'interactive'
                            ? 'You join with your microphone off. If the host invites you to pray aloud, your browser will ask first.'
                            : 'You join as a listener. Your microphone is never used.'}
                      </li>
                      <li className="flex gap-3">
                        <Headphones className="mt-0.5 size-4 shrink-0 text-ink-400" aria-hidden />
                        Headphones help avoid echo for everyone.
                      </li>
                    </ul>
                  </form>
                )}
              </div>
            </div>

            {isOpen && (
              <div className="mt-8">
                <p className="eyebrow text-ink-500">Invite someone to pray</p>
                <ShareSession session={session} layout="stack" className="mt-4" />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
