import { AccessToken, TrackSource } from 'npm:livekit-server-sdk@2.19.1'
import { loadSession } from '../_shared/clients.ts'
import { livekitEnv } from '../_shared/env.ts'
import { HttpError, requireSessionId, serve } from '../_shared/http.ts'
import { getHost, hasSpeakerGrant, isBanned, issueGuestCredential, verifyGuestCredential } from '../_shared/identity.ts'

const statusMessages: Record<string, string> = {
  scheduled: 'This prayer session has not started yet.',
  ended: 'This prayer session has ended.',
  cancelled: 'This prayer session was cancelled.',
}

function cleanName(value: unknown) {
  const name = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
  if (name.length < 2 || name.length > 40) {
    throw new HttpError(400, 'bad-name', 'Please enter a name between 2 and 40 characters.')
  }
  return name
}

serve(async (req, body) => {
  const sessionId = requireSessionId(body.sessionId)
  const session = await loadSession(sessionId)
  if (session.status !== 'live') {
    throw new HttpError(409, `session-${session.status}`, statusMessages[session.status] ?? 'This session is not live.')
  }

  const host = await getHost(req)
  let identity: string
  let name: string
  let canSpeak: boolean
  let guest = null

  if (host) {
    identity = host.identity
    name = host.displayName
    canSpeak = true
  } else {
    name = cleanName(body.displayName)
    guest = (await verifyGuestCredential(body.guest)) ?? (await issueGuestCredential())
    identity = guest.identity
    if (await isBanned(sessionId, identity)) {
      throw new HttpError(403, 'removed', 'The host removed you from this prayer session.')
    }
    canSpeak = session.mode === 'interactive' && (await hasSpeakerGrant(sessionId, identity))
  }

  const { wsUrl, apiKey, apiSecret } = livekitEnv()
  // Short TTL: the token is only used to join. LiveKit refreshes it for connected clients.
  const at = new AccessToken(apiKey, apiSecret, { identity, name, ttl: '10m' })
  at.addGrant({
    roomJoin: true,
    room: sessionId,
    canSubscribe: true,
    canPublish: canSpeak,
    canPublishSources: canSpeak ? [TrackSource.MICROPHONE] : [],
    canPublishData: false,
    canUpdateOwnMetadata: false,
  })

  return {
    token: await at.toJwt(),
    serverUrl: wsUrl,
    identity,
    role: host ? 'host' : canSpeak ? 'speaker' : 'listener',
    guest,
  }
})
