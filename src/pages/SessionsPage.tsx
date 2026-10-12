import { CalendarDays, History } from 'lucide-react'
import { groupSessions } from '@/domain/session'
import { useSessions } from '@/hooks/useSessions'
import { SessionCard } from '@/components/SessionCard'
import { EmptyState, ErrorState, SessionCardSkeleton } from '@/components/ui/States'

export function SessionsPage() {
  const { sessions, loading, error, reload } = useSessions()
  const { live, upcoming, past } = groupSessions(sessions)

  return (
    <div className="pt-6 sm:pt-10">
      <h1 className="text-4xl font-medium sm:text-5xl">Prayer sessions</h1>
      <p className="mt-3 text-ink-500">Upcoming times to pray together, and sessions from the past few weeks.</p>

      {error ? (
        <ErrorState className="mt-10" title="We could not load prayer sessions" body={error} onRetry={reload} />
      ) : (
        <div className="mt-10 flex flex-col gap-12">
          {(loading || live.length > 0 || upcoming.length > 0) && (
            <section aria-labelledby="upcoming">
              <h2 id="upcoming" className="text-2xl font-medium">
                Live and upcoming
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                {loading ? (
                  <>
                    <SessionCardSkeleton />
                    <SessionCardSkeleton />
                    <SessionCardSkeleton />
                  </>
                ) : (
                  [...live, ...upcoming].map((s) => <SessionCard key={s.id} session={s} />)
                )}
              </div>
            </section>
          )}
          {!loading && live.length === 0 && upcoming.length === 0 && (
            <EmptyState icon={<CalendarDays className="size-8" />} title="Nothing scheduled yet" body="Check back soon." />
          )}

          {!loading && (
            <section aria-labelledby="previous">
              <h2 id="previous" className="text-2xl font-medium">
                Previous sessions
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                {past.length === 0 ? (
                  <EmptyState icon={<History className="size-8" />} title="No previous sessions yet" />
                ) : (
                  past.map((s) => <SessionCard key={s.id} session={s} />)
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
