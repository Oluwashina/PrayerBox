import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Eyebrow({ children, className, tone = 'light' }: { children: ReactNode; className?: string; tone?: 'light' | 'dark' }) {
  return (
    <p className={cn('eyebrow flex items-center gap-3', tone === 'light' ? 'text-ink-500' : 'text-white/60', className)}>
      <span aria-hidden className="h-px w-6 bg-brand-500" />
      {children}
    </p>
  )
}

export function PageIntro({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex flex-col gap-8 pt-12 pb-10 sm:pt-20 md:flex-row md:items-end md:justify-between', className)}>
      <div className="max-w-3xl animate-fade-up">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="mt-5 text-[2.75rem] leading-[1.02] text-ink-900 sm:text-[4.25rem]">{title}</h1>
        {description && <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-ink-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}

export function SectionHeader({
  index,
  eyebrow,
  title,
  description,
  action,
  id,
  className,
}: {
  index?: string
  eyebrow?: string
  title: ReactNode
  description?: string
  action?: ReactNode
  id?: string
  className?: string
}) {
  return (
    <div className={cn('border-t border-ink-900/10 pt-6', className)}>
      {(index || eyebrow) && (
        <p className="eyebrow text-ink-500">
          {index && <span className="text-brand-600">{index}</span>}
          {index && eyebrow && <span className="mx-2 text-ink-400">—</span>}
          {eyebrow}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 id={id} className="text-[2.1rem] leading-[1.05] text-ink-900 sm:text-[2.75rem]">
            {title}
          </h2>
          {description && <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-500">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  )
}

/** Editorial detail list: label / value rows separated by hairlines. */
export function DetailList({ items, tone = 'light', className }: { items: Array<{ label: string; value: ReactNode }>; tone?: 'light' | 'dark'; className?: string }) {
  const dark = tone === 'dark'
  return (
    <dl className={cn('grid grid-cols-2 gap-x-6', className)}>
      {items.map((item) => (
        <div key={item.label} className={cn('border-t py-4', dark ? 'border-white/10' : 'border-ink-900/10')}>
          <dt className={cn('eyebrow', dark ? 'text-white/50' : 'text-ink-400')}>{item.label}</dt>
          <dd className={cn('mt-1.5 text-[0.9375rem]', dark ? 'text-white' : 'text-ink-900')}>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
