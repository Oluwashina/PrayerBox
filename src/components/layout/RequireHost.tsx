import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '../ui/States'

/** Client-side guard for UX only. RLS and the Edge Functions enforce host permissions on every request. */
export function RequireHost() {
  const { isHost, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <div className="flex justify-center pt-16">
        <Spinner label="Checking your host access…" />
      </div>
    )
  }
  if (!isHost) return <Navigate to="/host/sign-in" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}
