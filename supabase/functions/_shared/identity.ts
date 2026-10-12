import { adminClient } from './clients.ts'
import { livekitEnv } from './env.ts'
import { HttpError } from './http.ts'

export const HOST_PREFIX = 'host_'
export const GUEST_PREFIX = 'guest_'

export interface HostCaller {
  userId: string
  displayName: string
  identity: string
}

/** Returns the calling host, or null if the request has no valid host session. */
export async function getHost(req: Request): Promise<HostCaller | null> {
  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!jwt) return null
  const { data, error } = await adminClient().auth.getUser(jwt)
  if (error || !data.user) return null
  const { data: host, error: hostError } = await adminClient()
    .from('hosts')
    .select('user_id, display_name')
    .eq('user_id', data.user.id)
    .maybeSingle()
  if (hostError) throw hostError
  if (!host) return null
  return { userId: host.user_id, displayName: host.display_name, identity: `${HOST_PREFIX}${host.user_id}` }
}

export async function requireHost(req: Request): Promise<HostCaller> {
  const host = await getHost(req)
  if (!host) throw new HttpError(403, 'not-host', 'Only prayer hosts can do this. Please sign in as a host.')
  return host
}

// Guests have no account. The server assigns their identity and signs it, so a
// guest cannot take over someone else's identity (and their speaking permission).

let keyPromise: Promise<CryptoKey> | undefined
function signingKey() {
  if (!keyPromise) {
    const secret = Deno.env.get('GUEST_SIGNING_SECRET') ?? `guest-identity:${livekitEnv().apiSecret}`
    keyPromise = crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
      'sign',
      'verify',
    ])
  }
  return keyPromise
}

function toBase64Url(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function fromBase64Url(value: string) {
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

export interface GuestCredential {
  identity: string
  signature: string
}

export async function issueGuestCredential(): Promise<GuestCredential> {
  const identity = `${GUEST_PREFIX}${crypto.randomUUID()}`
  const signature = toBase64Url(await crypto.subtle.sign('HMAC', await signingKey(), new TextEncoder().encode(identity)))
  return { identity, signature }
}

export async function verifyGuestCredential(value: unknown): Promise<GuestCredential | null> {
  const cred = value as Partial<GuestCredential> | null
  if (!cred || typeof cred.identity !== 'string' || typeof cred.signature !== 'string') return null
  if (!cred.identity.startsWith(GUEST_PREFIX) || cred.identity.length > 80) return null
  try {
    const ok = await crypto.subtle.verify(
      'HMAC',
      await signingKey(),
      fromBase64Url(cred.signature),
      new TextEncoder().encode(cred.identity),
    )
    return ok ? { identity: cred.identity, signature: cred.signature } : null
  } catch {
    return null
  }
}

export async function requireGuest(value: unknown): Promise<GuestCredential> {
  const guest = await verifyGuestCredential(value)
  if (!guest) throw new HttpError(401, 'bad-guest', 'Your session has expired. Please rejoin the prayer room.')
  return guest
}

export async function isBanned(sessionId: string, identity: string) {
  const { data, error } = await adminClient()
    .from('session_bans')
    .select('identity')
    .eq('session_id', sessionId)
    .eq('identity', identity)
    .maybeSingle()
  if (error) throw error
  return Boolean(data)
}

export async function hasSpeakerGrant(sessionId: string, identity: string) {
  const { data, error } = await adminClient()
    .from('session_speakers')
    .select('identity')
    .eq('session_id', sessionId)
    .eq('identity', identity)
    .maybeSingle()
  if (error) throw error
  return Boolean(data)
}
