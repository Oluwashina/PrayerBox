import type { ReactNode } from 'react'
import type { SessionStatus } from '@/domain/types'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'plum' | 'live' | 'ok' | 'warn' | 'danger' | 'brand'

const tones: Record<Tone, string> = {
  neutral: 'bg-cream-100 text-ink-700',
  plum: 'bg-plum-50 text-plum-800',
  live: 'bg-live-soft text-live',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  brand: 'bg-brand-100 text-ink-900',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function LiveDot({ className }: { className?: string }) {
  return <span aria-hidden className={cn('size-2 rounded-full bg-live animate-pulse-dot', className)} />
}

export function StatusBadge({ status, className }: { status: SessionStatus; className?: string }) {
  switch (status) {
    case 'live':
      return (
        <Badge tone="live" className={className}>
          <LiveDot /> LIVE NOW
        </Badge>
      )
    case 'scheduled':
      return (
        <Badge tone="plum" className={className}>
          Upcoming
        </Badge>
      )
    case 'ended':
      return (
        <Badge tone="neutral" className={className}>
          Ended
        </Badge>
      )
    case 'cancelled':
      return (
        <Badge tone="danger" className={className}>
          Cancelled
        </Badge>
      )
  }
}
