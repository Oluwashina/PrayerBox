import type { PrayerSession } from '@/domain/types'
import { groupSessions } from '@/domain/session'
import { useSessions } from '@/hooks/useSessions'
import { LiveSessionCard } from '@/components/LiveSessionCard'
import { SessionCard } from '@/components/SessionCard'
import { PageIntro, SectionHeader } from '@/components/layout/PageChrome'
import { EmptyState, ErrorState, SessionCardSkeleton } from '@/components/ui/States'

const monthFmt = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })

function byMonth(sessions: PrayerSession[]) {
  const groups = new Map<string, PrayerSession[]>()
  for (const s of sessions) {
    const key = monthFmt.format(new Date(s.scheduledStart))
    groups.set(key, [...(groups.get(key) ?? []), s])
  }
  return [...groups.entries()]
}

export function SessionsPage() {
  const { sessions, loading, error, reload } = useSessions()
  const { live, upcoming, past } = groupSessions(sessions)
  const recentPast = past.slice(0, 3)

  return (
    <div>
      <PageIntro
        eyebrow="Schedule"
        title={
          <>
            Times of <em className="text-plum-600">prayer</em>
          </>
        }
        description="Join live or see what is coming up. Everyone is welcome. We only ask for your name when you enter."
      />

      {error ? (
        <ErrorState title="We could not load prayer sessions" body={error} onRetry={reload} />
      ) : (
        <div className="flex flex-col gap-20">
          {live.length > 0 && (
            <section aria-label="Live now" className="grid gap-4 lg:grid-cols-2">
              {live.map((s) => (
                <LiveSessionCard key={s.id} session={s} />
              ))}
            </section>
          )}

          <section aria-labelledby="upcoming-sessions">
            <SectionHeader index="01" eyebrow="Upcoming" id="upcoming-sessions" title="On the calendar" />
            <div className="mt-6">
              {loading ? (
                <>
                  <SessionCardSkeleton />
                  <SessionCardSkeleton />
                  <SessionCardSkeleton />
                </>
              ) : upcoming.length === 0 ? (
                <EmptyState title="Nothing scheduled yet" body="Check back soon for the next time of prayer." />
              ) : (
                byMonth(upcoming).map(([month, items]) => (
                  <div key={month} className="mt-4 first:mt-0">
                    <p className="eyebrow pt-6 text-brand-600">{month}</p>
                    {items.map((s) => (
                      <SessionCard key={s.id} session={s} />
                    ))}
                  </div>
                ))
              )}
            </div>
          </section>

          {!loading && recentPast.length > 0 && (
            <section aria-labelledby="previous-sessions">
              <SectionHeader index="02" eyebrow="Archive" id="previous-sessions" title="Recent sessions" />
              <div className="mt-6">
                {recentPast.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
