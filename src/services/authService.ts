import type { HostUser } from '@/domain/types'

export interface AuthSnapshot {
  /** 'loading' until the stored session (if any) has been checked. */
  status: 'loading' | 'signed-out' | 'host'
  host: HostUser | null
}

/**
 * Host/administrator identity. Listeners never sign in. Host status is
 * confirmed against the server-side `hosts` table, and every privileged
 * action is re-checked by RLS or the Edge Functions.
 */
export interface AuthService {
  getSnapshot(): AuthSnapshot
  signIn(email: string, password: string): Promise<HostUser>
  signOut(): Promise<void>
  subscribe(listener: () => void): () => void
}
