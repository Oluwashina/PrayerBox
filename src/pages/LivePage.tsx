import { Link, Navigate } from 'react-router'
import { Radio } from 'lucide-react'
import { groupSessions } from '@/domain/session'
import { useSessions } from '@/hooks/useSessions'
import { formatDay, formatTime } from '@/lib/format'
import { Eyebrow } from '@/components/layout/PageChrome'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'

/** Public entry for “join us now”. Redirects to the active session when one is live. */
export function LivePage() {
  const { sessions, loading, error, reload } = useSessions()
  const { live, upcoming } = groupSessions(sessions)
  const current = live[0]
  const next = upcoming[0]

  if (loading) {
    return (
      <div className="mx-auto max-w-lg pt-16 pb-24">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-8 h-16 w-full" />
        <Skeleton className="mt-6 h-32 rounded-[1.5rem]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg pt-16">
        <ErrorState title="We could not check if prayer is live" body={error} onRetry={reload} />
      </div>
    )
  }

  if (current) {
    return <Navigate to={`/s/${current.id}`} replace />
  }

  return (
    <div className="mx-auto max-w-lg pt-14 pb-24 sm:pt-20">
      <Eyebrow>Live prayer</Eyebrow>
      <h1 className="mt-6 text-[2.75rem] leading-[1.02] text-ink-900 sm:text-[3.5rem]">We are not live yet.</h1>
      <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-500">
        When the prayer team goes live, this link will take you straight into the room. Check the schedule for what is
        coming up.
      </p>

      {next ? (
        <div className="mt-10 rounded-[1.5rem] border border-ink-900/[0.08] bg-white p-6">
          <p className="eyebrow text-ink-500">Next on the calendar</p>
          <p className="mt-4 font-serif text-[1.75rem] leading-tight text-ink-900">{next.title}</p>
          <p className="mt-2 text-[0.9375rem] text-ink-500">
            {formatDay(next.scheduledStart)} · {formatTime(next.scheduledStart)}
          </p>
          <ButtonLink to={`/s/${next.id}`} variant="secondary" className="mt-6" fullWidth>
            View session details
          </ButtonLink>
        </div>
      ) : (
        <EmptyState
          className="mt-10"
          icon={<Radio />}
          title="Nothing scheduled yet"
          body="New times of prayer will be posted here when they are announced."
        />
      )}

      <p className="mt-10 text-center text-sm text-ink-500">
        <Link to="/sessions" className="font-medium text-ink-900 underline-offset-2 hover:underline">
          See full schedule
        </Link>
      </p>
    </div>
  )
}
