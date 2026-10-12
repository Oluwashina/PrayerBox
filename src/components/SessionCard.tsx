import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import type { PrayerSession } from '@/domain/types'
import { formatDay, formatTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import { StatusBadge } from './ui/Badge'
import { PrayerFocus } from './SessionMeta'

/** Compact row used for upcoming and past session lists. */
export function SessionCard({ session, to, className }: { session: PrayerSession; to?: string; className?: string }) {
  const date = new Date(session.scheduledStart)
  const muted = session.status === 'ended' || session.status === 'cancelled'
  return (
    <Link
      to={to ?? `/s/${session.id}`}
      className={cn(
        'group flex items-center gap-4 rounded-3xl border border-cream-200/70 bg-white p-4 shadow-soft transition-colors hover:border-plum-200 sm:p-5',
        className,
      )}
    >
      <div
        className={cn(
          'flex w-16 shrink-0 flex-col items-center rounded-2xl py-2.5',
          muted ? 'bg-cream-100 text-ink-500' : 'bg-plum-50 text-plum-800',
        )}
      >
        <span className="text-[0.7rem] font-semibold tracking-widest uppercase">
          {date.toLocaleDateString(undefined, { month: 'short' })}
        </span>
        <span className="font-serif text-2xl leading-none font-medium">{date.getDate()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-ink-500">
            {formatDay(session.scheduledStart, true)} · {formatTime(session.scheduledStart)}
          </span>
          {session.status !== 'scheduled' && <StatusBadge status={session.status} />}
        </div>
        <h3 className={cn('mt-1 truncate text-lg font-medium', muted ? 'text-ink-700' : 'text-ink-900')}>
          {session.title}
        </h3>
        <div className="mt-0.5 line-clamp-1">
          <PrayerFocus focus={session.prayerFocus} />
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  )
}
