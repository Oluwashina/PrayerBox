import { HttpError } from './http.ts'

function required(name: string, ...fallbacks: string[]) {
  for (const key of [name, ...fallbacks]) {
    const value = Deno.env.get(key)?.trim()
    if (value) return value
  }
  throw new HttpError(500, 'server-misconfigured', `Server is missing the ${name} secret.`)
}

export function livekitEnv() {
  const url = required('LIVEKIT_URL').replace(/\/+$/, '')
  if (!/^(wss?|https?):\/\/[^/\s]+/.test(url)) {
    throw new HttpError(
      500,
      'server-misconfigured',
      'The LIVEKIT_URL secret must look like wss://your-project.livekit.cloud. Update it with "supabase secrets set".',
    )
  }
  return {
    /** wss:// URL returned to clients */
    wsUrl: url.replace(/^http/, 'ws'),
    /** https:// URL for the server API */
    apiUrl: url.replace(/^ws/, 'http'),
    apiKey: required('LIVEKIT_API_KEY'),
    apiSecret: required('LIVEKIT_API_SECRET'),
  }
}

export function supabaseEnv() {
  return {
    url: required('SUPABASE_URL'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  }
}
