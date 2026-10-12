import { ArrowRight, CalendarDays, Headphones, Link2, Plus, UserRound } from 'lucide-react'
import { groupSessions } from '@/domain/session'
import { useAuth } from '@/hooks/useAuth'
import { useSessions } from '@/hooks/useSessions'
import { formatDateTime, formatRelativeStart } from '@/lib/format'
import { LiveSessionCard } from '@/components/LiveSessionCard'
import { SessionCard } from '@/components/SessionCard'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, SessionCardSkeleton, Skeleton } from '@/components/ui/States'

export function HomePage() {
  const { isHost } = useAuth()
  const { sessions, loading, error, reload } = useSessions()
  const { live, upcoming } = groupSessions(sessions)
  const next = upcoming[0]

  return (
    <div className="flex flex-col gap-14 sm:gap-20">
      <section className="pt-6 sm:pt-12">
        <p className="text-sm font-semibold tracking-[0.2em] text-plum-600 uppercase">Prayer Line</p>
        <h1 className="mt-4 max-w-3xl text-[2.6rem] leading-[1.05] font-medium text-ink-900 sm:text-6xl">
          A Place to Pray Together.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
          Join our prayer team live from wherever you are. Tap a link, enter your name, and listen. No app or account
          needed.
        </p>
        {isHost && (
          <div className="mt-8">
            <ButtonLink to="/host?new=1" variant="primary" size="lg" icon={<Plus className="size-5" />}>
              Host a Prayer Session
            </ButtonLink>
          </div>
        )}
      </section>

      <section aria-label="Live prayer">
        {loading ? (
          <Skeleton className="h-80 rounded-[2rem]" />
        ) : error ? (
          <ErrorState title="We could not load prayer sessions" body={error} onRetry={reload} />
        ) : live.length > 0 ? (
          <div className="flex flex-col gap-5">
            {live.map((s) => (
              <LiveSessionCard key={s.id} session={s} />
            ))}
          </div>
        ) : (
          <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="font-serif text-2xl">No live prayer right now</p>
              <p className="mt-2 text-ink-500">
                {next
                  ? `Next: ${next.title}, ${formatDateTime(next.scheduledStart)}.`
                  : 'Check back soon for the next prayer session.'}
              </p>
            </div>
            {next && (
              <ButtonLink to={`/s/${next.id}`} variant="secondary" icon={<CalendarDays className="size-5" />}>
                {formatRelativeStart(next.scheduledStart)}
              </ButtonLink>
            )}
          </Card>
        )}
      </section>

      <section aria-labelledby="upcoming-heading">
        <div className="flex items-end justify-between gap-4">
          <h2 id="upcoming-heading" className="text-3xl font-medium">
            Upcoming prayer
          </h2>
          <ButtonLink to="/sessions" variant="ghost" size="sm">
            All sessions <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {loading ? (
            <>
              <SessionCardSkeleton />
              <SessionCardSkeleton />
            </>
          ) : error ? null : upcoming.length === 0 ? (
            <EmptyState
              className="md:col-span-2"
              icon={<CalendarDays className="size-8" />}
              title="Nothing scheduled yet"
              body="New prayer sessions will appear here as soon as they are scheduled."
            />
          ) : (
            upcoming.slice(0, 4).map((s) => <SessionCard key={s.id} session={s} />)
          )}
        </div>
      </section>

      <section aria-labelledby="how-heading" className="rounded-[2rem] bg-cream-100 p-6 sm:p-10">
        <h2 id="how-heading" className="text-3xl font-medium">
          How to join
        </h2>
        <p className="mt-2 text-ink-500">It takes less than a minute, on any phone or computer.</p>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Link2, title: 'Open the link', body: 'Tap the prayer link shared on WhatsApp, or choose a session above.' },
            { icon: UserRound, title: 'Enter your name', body: 'Just your first name is fine, so others know who is praying with them.' },
            { icon: Headphones, title: 'Listen and pray', body: 'Tap “Join Prayer Room”. Your microphone stays off unless the host invites you to speak.' },
          ].map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="flex gap-4 sm:flex-col">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-plum-700 shadow-soft">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold text-ink-900">
                  <span className="text-plum-500">{i + 1}.</span> {title}
                </p>
                <p className="mt-1 text-ink-500">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
