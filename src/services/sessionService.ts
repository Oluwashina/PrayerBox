import type { PrayerSession, SessionDraft, SessionMode } from '@/domain/types'

/**
 * Session metadata and scheduling. Independent of the audio transport: it
 * reads and writes the church backend (Supabase), never LiveKit directly.
 */
export interface SessionService {
  list(): Promise<PrayerSession[]>
  get(id: string): Promise<PrayerSession | null>
  create(draft: SessionDraft): Promise<PrayerSession>
  update(id: string, patch: Partial<SessionDraft>): Promise<PrayerSession>
  setMode(id: string, mode: SessionMode): Promise<PrayerSession>
  start(id: string): Promise<PrayerSession>
  end(id: string): Promise<PrayerSession>
  cancel(id: string): Promise<PrayerSession>
  /** Notifies when any session changes (e.g. a host starts a broadcast). */
  subscribe(listener: () => void): () => void
}
