import type { ReactNode } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

export function Spinner({ label = 'Loading', className }: { label?: string; className?: string }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-ink-500', className)}>
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="text-sm">{label}</span>
    </span>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-xl bg-ink-900/[0.06]', className)} />
}

export function SessionCardSkeleton() {
  return (
    <div className="flex items-center gap-5 border-b border-ink-900/10 py-6">
      <Skeleton className="h-14 w-12" />
      <div className="flex-1">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="mt-3 h-3.5 w-1/3" />
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  body?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-[1.25rem] border border-ink-900/[0.08] bg-white/50 px-6 py-12 text-center',
        className,
      )}
    >
      {icon && <div className="mb-4 text-ink-400 [&_svg]:size-7 [&_svg]:stroke-[1.5]">{icon}</div>}
      <p className="font-serif text-2xl text-ink-900">{title}</p>
      {body && <p className="mt-2 max-w-sm text-[0.9375rem] leading-relaxed text-ink-500">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({
  title = 'We could not load this',
  body,
  onRetry,
  className,
}: {
  title?: string
  body?: string | null
  onRetry?: () => void
  className?: string
}) {
  return (
    <div role="alert" className={cn('flex flex-col items-center rounded-[1.25rem] border border-danger/15 bg-danger-soft/60 px-6 py-10 text-center', className)}>
      <AlertTriangle className="size-6 stroke-[1.5] text-danger" aria-hidden />
      <p className="mt-3 font-semibold text-ink-900">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-ink-700">{body}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function InlineAlert({
  tone = 'warn',
  title,
  children,
  icon,
  className,
}: {
  tone?: 'warn' | 'danger' | 'info' | 'ok'
  title?: string
  children?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  const styles = {
    warn: 'bg-warn-soft text-ink-900 [&_svg]:text-warn',
    danger: 'bg-danger-soft text-ink-900 [&_svg]:text-danger',
    info: 'bg-ink-900/[0.035] text-ink-900 [&_svg]:text-plum-600',
    ok: 'bg-ok-soft text-ink-900 [&_svg]:text-ok',
  }[tone]
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-xl px-4 py-3.5', styles, className)}>
      {icon && <span className="mt-0.5 shrink-0 [&_svg]:size-5">{icon}</span>}
      <div className="text-sm leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'text-ink-700')}>{children}</div>}
      </div>
    </div>
  )
}
