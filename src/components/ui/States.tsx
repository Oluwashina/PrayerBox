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
  return <div aria-hidden className={cn('animate-pulse rounded-2xl bg-cream-100', className)} />
}

export function SessionCardSkeleton() {
  return (
    <div className="rounded-3xl border border-cream-200/70 bg-white p-5 shadow-soft">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-6 w-3/4" />
      <Skeleton className="mt-3 h-4 w-1/2" />
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
        'flex flex-col items-center rounded-3xl border border-dashed border-cream-300 bg-cream-50 px-6 py-10 text-center',
        className,
      )}
    >
      {icon && <div className="mb-3 text-plum-400">{icon}</div>}
      <p className="font-serif text-xl text-ink-900">{title}</p>
      {body && <p className="mt-2 max-w-sm text-ink-500">{body}</p>}
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
    <div role="alert" className={cn('flex flex-col items-center rounded-3xl bg-danger-soft px-6 py-8 text-center', className)}>
      <AlertTriangle className="size-7 text-danger" aria-hidden />
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
    info: 'bg-plum-50 text-ink-900 [&_svg]:text-plum-600',
    ok: 'bg-ok-soft text-ink-900 [&_svg]:text-ok',
  }[tone]
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-2xl px-4 py-3', styles, className)}>
      {icon && <span className="mt-0.5 shrink-0 [&_svg]:size-5">{icon}</span>}
      <div className="text-sm leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'text-ink-700')}>{children}</div>}
      </div>
    </div>
  )
}
