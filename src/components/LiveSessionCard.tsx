import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import type { PrayerSession } from '@/domain/types'
import { modeLabel } from '@/domain/session'
import { useNow } from '@/hooks/useNow'
import { formatElapsed } from '@/lib/format'
import { cn } from '@/lib/cn'
import { LiveDot } from './ui/Badge'
import { Waveform } from './Waveform'

/** Dark feature panel for a session that is live right now. */
export function LiveSessionCard({ session, glass = false, className }: { session: PrayerSession; glass?: boolean; className?: string }) {
  const now = useNow()
  return (
    <Link
      to={`/s/${session.id}`}
      aria-labelledby={`live-${session.id}`}
      className={cn(
        'group relative block overflow-hidden rounded-[1.5rem] p-6 text-white ring-1 transition-transform duration-300 hover:-translate-y-0.5 sm:p-8',
        glass ? 'bg-white/[0.05] ring-white/12 backdrop-blur-sm' : 'bg-plum-950 ring-white/10',
        className,
      )}
    >
      {!glass && (
        <>
          <div aria-hidden className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full bg-brand-400/15 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-16 size-72 rounded-full bg-plum-500/30 blur-3xl" />
        </>
      )}

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow inline-flex items-center gap-2.5 text-white">
            <LiveDot /> Live now
          </span>
          {session.startedAt && (
            <span className="font-mono text-xs text-white/55 tabular-nums">{formatElapsed(session.startedAt, now)}</span>
          )}
        </div>

        <h2 id={`live-${session.id}`} className="mt-8 text-[2.25rem] leading-[1.02] sm:text-[2.75rem]">
          {session.title}
        </h2>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-white/70">
          For {session.prayerFocus.charAt(0).toLowerCase() + session.prayerFocus.slice(1)}
        </p>

        <Waveform tone="dark" className="mt-8 h-9 justify-start" bars={40} />

        <div className="mt-8 flex items-end justify-between gap-4 border-t border-white/10 pt-5">
          <div className="text-[0.8125rem] text-white/55">
            <p>Led by <span className="text-white">{session.hostName}</span></p>
            <p className="mt-0.5">{modeLabel(session.mode)}</p>
          </div>
          <span className="inline-flex h-12 items-center gap-2 rounded-full bg-brand-400 pr-4 pl-5 text-sm font-medium text-ink-900 transition-colors group-hover:bg-brand-300">
            Join the prayer <ArrowUpRight className="size-4" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  )
}
