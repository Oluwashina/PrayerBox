import { Link } from 'react-router'
import { appConfig } from '@/config'
import { cn } from '@/lib/cn'

export function Logo({ tone = 'light', compact = false, className }: { tone?: 'light' | 'dark'; compact?: boolean; className?: string }) {
  const dark = tone === 'dark'
  return (
    <Link
      to="/"
      className={cn('group flex min-w-0 items-center gap-3 rounded-xl', className)}
      aria-label={`${appConfig.churchName} home`}
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-[0.8rem]',
          dark ? 'bg-white/[0.08] ring-1 ring-white/15' : 'bg-ink-900',
        )}
      >
        <img src={appConfig.logoSrc} alt="" className="size-7" />
      </span>
      {!compact && (
        <span className="flex min-w-0 flex-col">
          <span className={cn('truncate font-serif text-[1.2rem] leading-none', dark ? 'text-white' : 'text-ink-900')}>
            The New Church
          </span>
          <span className={cn('eyebrow mt-1 truncate text-[0.6rem]', dark ? 'text-white/55' : 'text-ink-500')}>
            Ibadan · Prayer Line
          </span>
        </span>
      )}
    </Link>
  )
}
