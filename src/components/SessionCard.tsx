import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import type { PrayerSession } from '@/domain/types'
import { modeLabel } from '@/domain/session'
import { formatDuration, formatTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import { StatusBadge } from './ui/Badge'

export function DateMark({ iso, muted = false, className }: { iso: string; muted?: boolean; className?: string }) {
  const date = new Date(iso)
  return (
    <div className={cn('flex w-12 shrink-0 flex-col items-start sm:w-16', muted ? 'text-ink-400' : 'text-ink-900', className)}>
      <span className="eyebrow text-[0.6rem] text-brand-600">{date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
      <span className="mt-1 font-serif text-[2.6rem] leading-none sm:text-5xl">{date.getDate()}</span>
      <span className="eyebrow mt-1 text-[0.6rem] text-ink-500">{date.toLocaleDateString(undefined, { month: 'short' })}</span>
    </div>
  )
}

/** Editorial schedule row used in session lists. */
export function SessionCard({
  session,
  to,
  className,
  actions,
}: {
  session: PrayerSession
  to?: string
  className?: string
  actions?: ReactNode
}) {
  const muted = session.status === 'ended' || session.status === 'cancelled'
  const body = (
    <>
      <DateMark iso={session.scheduledStart} muted={muted} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.8125rem] text-ink-500">
          <span className="tabular-nums">{formatTime(session.scheduledStart)}</span>
          <span aria-hidden className="text-ink-400">·</span>
          <span>{formatDuration(session.durationMinutes)}</span>
          <span aria-hidden className="hidden text-ink-400 sm:inline">·</span>
          <span className="hidden sm:inline">{modeLabel(session.mode)}</span>
          {session.status !== 'scheduled' && <StatusBadge status={session.status} />}
        </div>
        <h3
          className={cn(
            'mt-2 text-[1.6rem] leading-[1.1] transition-colors sm:text-[2rem]',
            muted ? 'text-ink-500' : 'text-ink-900 group-hover:text-plum-700',
          )}
        >
          {session.title}
        </h3>
        <p className="mt-1.5 line-clamp-1 text-[0.9375rem] text-ink-500">
          For {session.prayerFocus.charAt(0).toLowerCase() + session.prayerFocus.slice(1)} · {session.hostName}
        </p>
      </div>
    </>
  )

  return (
    <div className={cn('group border-b border-ink-900/10', className)}>
      <div className="flex flex-col gap-4 py-7 sm:flex-row sm:items-center sm:gap-8">
        <Link to={to ?? `/s/${session.id}`} className="flex min-w-0 flex-1 items-start gap-5 sm:gap-8">
          {body}
          <span className="mt-2 hidden size-11 shrink-0 items-center justify-center self-center rounded-full border border-ink-900/12 text-ink-900 transition-colors group-hover:border-ink-900 group-hover:bg-ink-900 group-hover:text-white sm:flex">
            <ArrowUpRight className="size-[1.1rem]" aria-hidden />
          </span>
        </Link>
        {actions && <div className="flex flex-wrap gap-2 pl-[4.25rem] sm:pl-0">{actions}</div>}
      </div>
    </div>
  )
}
