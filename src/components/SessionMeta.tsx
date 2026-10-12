import { CalendarDays, Clock, Radio, UsersRound } from 'lucide-react'
import type { PrayerSession } from '@/domain/types'
import { modeLabel } from '@/domain/session'
import { formatDateTime, formatDuration } from '@/lib/format'
import { cn } from '@/lib/cn'

export function SessionMeta({
  session,
  showMode = true,
  className,
}: {
  session: PrayerSession
  showMode?: boolean
  className?: string
}) {
  return (
    <ul className={cn('flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-500', className)}>
      <li className="flex items-center gap-1.5">
        <CalendarDays className="size-4" aria-hidden />
        {formatDateTime(session.scheduledStart)}
      </li>
      <li className="flex items-center gap-1.5">
        <Clock className="size-4" aria-hidden />
        {formatDuration(session.durationMinutes)}
      </li>
      {showMode && (
        <li className="flex items-center gap-1.5">
          {session.mode === 'broadcast' ? (
            <Radio className="size-4" aria-hidden />
          ) : (
            <UsersRound className="size-4" aria-hidden />
          )}
          {modeLabel(session.mode)}
        </li>
      )}
    </ul>
  )
}

export function PrayerFocus({ focus, tone = 'light' }: { focus: string; tone?: 'light' | 'dark' }) {
  return (
    <p className={cn('text-sm', tone === 'light' ? 'text-ink-700' : 'text-white/80')}>
      <span className={cn('font-semibold', tone === 'light' ? 'text-plum-700' : 'text-brand-300')}>Praying for </span>
      {focus.charAt(0).toLowerCase() + focus.slice(1)}
    </p>
  )
}
