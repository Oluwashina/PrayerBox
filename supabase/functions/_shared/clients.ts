import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { RoomServiceClient } from 'npm:livekit-server-sdk@2.19.1'
import { livekitEnv, supabaseEnv } from './env.ts'
import { HttpError } from './http.ts'

let admin: SupabaseClient | undefined
let rooms: RoomServiceClient | undefined

/** Service-role client. Bypasses RLS, so every caller must be authorized first. */
export function adminClient() {
  if (!admin) {
    const { url, serviceRoleKey } = supabaseEnv()
    admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  }
  return admin
}

export function roomService() {
  if (!rooms) {
    const { apiUrl, apiKey, apiSecret } = livekitEnv()
    rooms = new RoomServiceClient(apiUrl, apiKey, apiSecret)
  }
  return rooms
}

export interface SessionRow {
  id: string
  status: 'scheduled' | 'live' | 'ended' | 'cancelled'
  mode: 'broadcast' | 'interactive'
}

export async function loadSession(sessionId: string): Promise<SessionRow> {
  const { data, error } = await adminClient()
    .from('prayer_sessions')
    .select('id, status, mode')
    .eq('id', sessionId)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new HttpError(404, 'not-found', 'This prayer session could not be found.')
  return data as SessionRow
}

/** LiveKit returns 404 / "not found" when a participant or room has already gone. */
export function isNotFound(error: unknown) {
  const e = error as { status?: number; code?: string; message?: string }
  return e?.status === 404 || e?.code === 'not_found' || /not.?found/i.test(e?.message ?? '')
}
