import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { ArrowUpRight, LogOut, X } from 'lucide-react'
import { appConfig } from '@/config'
import { groupSessions } from '@/domain/session'
import { useAuth } from '@/hooks/useAuth'
import { useSessions } from '@/hooks/useSessions'
import { cn } from '@/lib/cn'
import { Logo } from '../Logo'
import { OfflineBanner } from '../OfflineBanner'
import { LiveDot } from '../ui/Badge'

const desktopLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative py-2 text-sm font-medium transition-colors',
    isActive ? 'text-ink-900' : 'text-ink-500 hover:text-ink-900',
    isActive && 'after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-ink-900',
  )

export function AppLayout() {
  const { host, signOut } = useAuth()
  const { sessions } = useSessions()
  const live = groupSessions(sessions).live[0]
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => setMenuOpen(false), [location.pathname])
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const links = [
    { to: '/', label: 'Home', end: true },
    { to: '/sessions', label: 'Sessions' },
    host ? { to: '/host', label: 'Host console' } : { to: '/host/sign-in', label: 'Host sign in' },
  ]

  return (
    <div className="flex min-h-dvh flex-col">
      <OfflineBanner />
      <header className="sticky top-0 z-30 border-b border-ink-900/[0.08] bg-cream-50/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-5 sm:h-[4.5rem] sm:gap-4 sm:px-8">
          <div className="min-w-0 flex-1 md:flex-none">
            <Logo />
          </div>

          <nav className="hidden flex-1 items-center justify-end gap-8 md:flex" aria-label="Main">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={desktopLink}>
                {l.label}
              </NavLink>
            ))}
            {host && (
              <button
                type="button"
                onClick={() => void signOut()}
                className="text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
              >
                Sign out
              </button>
            )}
            {live && <LivePill id={live.id} />}
          </nav>

          <div className="flex h-11 shrink-0 items-center gap-2 md:hidden">
            {live && <LivePill id={live.id} compact />}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="flex size-11 items-center justify-center rounded-full border border-ink-900/12 bg-white/70"
            >
              <span aria-hidden className="flex w-4 flex-col gap-[5px]">
                <span className="h-px w-full bg-ink-900" />
                <span className="h-px w-2/3 bg-ink-900" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-plum-950 text-white md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div aria-hidden className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full bg-brand-400/10 blur-3xl" />
          <div className="relative flex h-16 items-center justify-between px-5">
            <Logo tone="dark" />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="flex size-11 items-center justify-center rounded-full border border-white/15"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <nav className="relative flex flex-1 flex-col px-5 pt-10" aria-label="Main">
            {links.map((l, i) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-baseline gap-4 border-b border-white/10 py-5 font-serif text-[2.4rem] leading-none transition-colors',
                    isActive ? 'text-white' : 'text-white/60',
                  )
                }
              >
                <span className="eyebrow w-6 font-sans text-brand-300">0{i + 1}</span>
                {l.label}
              </NavLink>
            ))}
            {host && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  void signOut()
                }}
                className="mt-8 inline-flex items-center gap-2 self-start text-sm text-white/60"
              >
                <LogOut className="size-4" aria-hidden /> Sign out {host.name}
              </button>
            )}
          </nav>
          <div className="relative px-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
            {live ? (
              <Link
                to={`/s/${live.id}`}
                className="flex h-14 items-center justify-between rounded-full bg-brand-400 px-6 font-medium text-ink-900"
              >
                <span className="flex items-center gap-3">
                  <LiveDot /> Join live prayer
                </span>
                <ArrowUpRight className="size-5" aria-hidden />
              </Link>
            ) : (
              <p className="font-serif text-xl leading-snug text-white/50 italic">
                “For where two or three gather in my name, there am I with them.”
              </p>
            )}
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 sm:px-8">
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  )
}

function LivePill({ id, compact = false }: { id: string; compact?: boolean }) {
  return (
    <Link
      to={`/s/${id}`}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-ink-900 font-medium leading-none text-white transition-colors hover:bg-plum-900',
        compact ? 'h-11 px-3.5 text-[0.8125rem]' : 'h-9 pr-4 pl-3 text-[0.8125rem]',
      )}
    >
      <LiveDot className="size-1.5 shrink-0" />
      <span className="whitespace-nowrap">{compact ? 'Live' : 'Live now'}</span>
    </Link>
  )
}

function SiteFooter() {
  return (
    <footer className="mt-24 bg-plum-950 text-white">
      <div className="mx-auto max-w-7xl px-5 pt-16 pb-10 sm:px-8">
        <div className="flex flex-col gap-10 border-b border-white/10 pb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md">
            <Logo tone="dark" />
            <p className="mt-6 font-serif text-[1.75rem] leading-snug text-white/85 italic">
              “For where two or three gather in my name, there am I with them.”
            </p>
            <p className="eyebrow mt-3 text-brand-300">Matthew 18:20</p>
          </div>
          <nav className="flex gap-8 text-sm text-white/60" aria-label="Footer">
            <Link to="/" className="hover:text-white">
              Home
            </Link>
            <Link to="/sessions" className="hover:text-white">
              Sessions
            </Link>
            <Link to="/host" className="hover:text-white">
              Prayer team
            </Link>
          </nav>
        </div>
        <p className="mt-8 text-xs text-white/40">
          © {new Date().getFullYear()} {appConfig.churchName}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
