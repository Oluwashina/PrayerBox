import { HttpError } from './http.ts'

function required(name: string, ...fallbacks: string[]) {
  for (const key of [name, ...fallbacks]) {
    const value = Deno.env.get(key)
    if (value) return value
  }
  throw new HttpError(500, 'server-misconfigured', `Server is missing the ${name} secret.`)
}

export function livekitEnv() {
  const url = required('LIVEKIT_URL')
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
