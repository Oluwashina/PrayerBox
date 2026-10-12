import { Link } from 'react-router'
import { appConfig } from '@/config'
import { cn } from '@/lib/cn'

export function Logo({ tone = 'light', compact = false }: { tone?: 'light' | 'dark'; compact?: boolean }) {
  return (
    <Link to="/" className="group flex min-w-0 items-center gap-3 rounded-xl" aria-label={`${appConfig.churchName} home`}>
      <span
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-2xl',
          tone === 'light' ? 'bg-ink-900' : 'bg-white/10 ring-1 ring-white/15',
        )}
      >
        <img src={appConfig.logoSrc} alt="" className="size-8" />
      </span>
      {!compact && (
        <span className="flex min-w-0 flex-col leading-tight">
          <span
            className={cn(
              'truncate font-serif text-base font-medium sm:text-lg',
              tone === 'light' ? 'text-ink-900' : 'text-white',
            )}
          >
            {appConfig.churchName}
          </span>
          <span className={cn('text-xs font-medium tracking-wide', tone === 'light' ? 'text-ink-500' : 'text-white/60')}>
            Prayer Line
          </span>
        </span>
      )}
    </Link>
  )
}
