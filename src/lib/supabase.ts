import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { appConfig, isBackendConfigured } from '@/config'

let client: SupabaseClient | undefined

/** The app renders a setup screen instead of calling this when the backend is not configured. */
export function supabase(): SupabaseClient {
  if (!isBackendConfigured) throw new Error('Supabase is not configured.')
  client ??= createClient(appConfig.supabaseUrl!, appConfig.supabaseKey!, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  return client
}
