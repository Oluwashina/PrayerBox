import { useSyncExternalStore } from 'react'
import { authService } from '@/services'

export function useAuth() {
  const { status, host } = useSyncExternalStore(authService.subscribe, authService.getSnapshot)
  return {
    host,
    isHost: status === 'host',
    loading: status === 'loading',
    signIn: authService.signIn,
    signOut: authService.signOut,
  }
}
