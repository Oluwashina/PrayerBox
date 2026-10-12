import { Outlet, NavLink } from 'react-router'
import { LayoutDashboard, LogOut } from 'lucide-react'
import { appConfig } from '@/config'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'
import { Logo } from '../Logo'
import { OfflineBanner } from '../OfflineBanner'
import { IconButton } from '../ui/Button'

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
    isActive ? 'bg-plum-50 text-plum-800' : 'text-ink-700 hover:text-plum-800',
  )

export function AppLayout() {
  const { host, signOut } = useAuth()
  return (
    <div className="flex min-h-dvh flex-col">
      <OfflineBanner />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-1" aria-label="Main">
          <NavLink to="/sessions" className={(s) => cn(navClass(s), 'hidden sm:inline-flex')}>
            Sessions
          </NavLink>
          {host ? (
            <>
              <NavLink to="/host" className={navClass}>
                <span className="flex items-center gap-1.5">
                  <LayoutDashboard className="size-4" aria-hidden /> Host
                </span>
              </NavLink>
              <IconButton label={`Sign out ${host.name}`} onClick={() => void signOut()}>
                <LogOut className="size-5" />
              </IconButton>
            </>
          ) : (
            <NavLink to="/host/sign-in" className={navClass}>
              Host sign in
            </NavLink>
          )}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 sm:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-cream-200/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            © {new Date().getFullYear()} {appConfig.churchName}
          </p>
          <p>“For where two or three gather in my name, there am I with them.” · Matthew 18:20</p>
        </div>
      </footer>
    </div>
  )
}
