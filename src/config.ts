export const appConfig = {
  churchName: 'The New Church Ibadan',
  productName: 'PrayerBox',
  logoSrc: '/brand/icon-yellow.png',
  logoDarkSrc: '/brand/icon-black.png',
  logoLightSrc: '/brand/icon-white.png',
  /** Public Supabase project URL. */
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  /** Public (anon / publishable) key. Safe in the browser; access is enforced by RLS and Edge Functions. */
  supabaseKey: (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as
    | string
    | undefined,
} as const

export const missingConfig = [
  !appConfig.supabaseUrl && 'VITE_SUPABASE_URL',
  !appConfig.supabaseKey && 'VITE_SUPABASE_PUBLISHABLE_KEY',
].filter(Boolean) as string[]

export const isBackendConfigured = missingConfig.length === 0
