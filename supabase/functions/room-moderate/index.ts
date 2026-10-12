import { TrackSource } from 'npm:livekit-server-sdk@2.19.1'
import { adminClient, isNotFound, loadSession, roomService } from '../_shared/clients.ts'
import { HttpError, requireSessionId, requireString, serve } from '../_shared/http.ts'
import { GUEST_PREFIX, HOST_PREFIX, isBanned, requireGuest, requireHost } from '../_shared/identity.ts'
import { permissionFor } from '../_shared/permissions.ts'

type Action = 'list' | 'allow-speak' | 'revoke-speak' | 'mute' | 'remove' | 'hand'

function requireGuestTarget(value: unknown) {
  const identity = requireString(value, 'identity')
  if (identity.startsWith(HOST_PREFIX)) throw new HttpError(400, 'bad-target', 'Hosts cannot be moderated.')
  if (!identity.startsWith(GUEST_PREFIX)) throw new HttpError(400, 'bad-target', 'Unknown participant.')
  return identity
}

async function ignoreMissing<T>(promise: Promise<T>) {
  try {
    return await promise
  } catch (error) {
    if (isNotFound(error)) return undefined
    throw error
  }
}

serve(async (req, body) => {
  const sessionId = requireSessionId(body.sessionId)
  const action = body.action as Action
  const session = await loadSession(sessionId)
  const rooms = roomService()

  // A guest raising or lowering their own hand. Authorized by their signed guest identity.
  if (action === 'hand') {
    const guest = await requireGuest(body.guest)
    if (session.status !== 'live') throw new HttpError(409, 'not-live', 'This session is not live.')
    if (session.mode !== 'interactive') {
      throw new HttpError(409, 'broadcast-mode', 'The host is leading this session in broadcast mode.')
    }
    if (await isBanned(sessionId, guest.identity)) throw new HttpError(403, 'removed', 'You were removed from this session.')
    await rooms.updateParticipant(sessionId, guest.identity, {
      attributes: { handRaised: body.raised === true ? 'true' : '' },
    })
    return { ok: true }
  }

  const host = await requireHost(req)

  if (action === 'list') {
    if (session.status !== 'live') return { participants: [] }
    const participants = (await ignoreMissing(rooms.listParticipants(sessionId))) ?? []
    return {
      participants: participants.map((p) => {
        const mic = p.tracks.find((t) => t.source === TrackSource.MICROPHONE)
        return {
          identity: p.identity,
          name: p.name || 'Guest',
          isHost: p.identity.startsWith(HOST_PREFIX),
          canSpeak: Boolean(p.permission?.canPublish),
          isMuted: !mic || mic.muted,
          handRaised: p.attributes?.handRaised === 'true',
          joinedAt: new Date(Number(p.joinedAtMs || p.joinedAt * 1000n)).toISOString(),
        }
      }),
    }
  }

  if (session.status !== 'live') throw new HttpError(409, 'not-live', 'This session is not live.')
  const identity = requireGuestTarget(body.identity)
  const db = adminClient()

  switch (action) {
    case 'allow-speak': {
      if (session.mode !== 'interactive') {
        throw new HttpError(409, 'broadcast-mode', 'Switch to interactive mode to let participants speak.')
      }
      const { error } = await db
        .from('session_speakers')
        .upsert({ session_id: sessionId, identity, granted_by: host.userId })
      if (error) throw error
      await ignoreMissing(
        rooms.updateParticipant(sessionId, identity, { permission: permissionFor(true), attributes: { handRaised: '' } }),
      )
      return { ok: true }
    }
    case 'revoke-speak': {
      const { error } = await db.from('session_speakers').delete().eq('session_id', sessionId).eq('identity', identity)
      if (error) throw error
      // Revoking canPublish makes LiveKit unpublish the participant's microphone.
      await ignoreMissing(rooms.updateParticipant(sessionId, identity, { permission: permissionFor(false) }))
      return { ok: true }
    }
    case 'mute': {
      const participant = await ignoreMissing(rooms.getParticipant(sessionId, identity))
      const mic = participant?.tracks.find((t) => t.source === TrackSource.MICROPHONE)
      if (mic && !mic.muted) await ignoreMissing(rooms.mutePublishedTrack(sessionId, identity, mic.sid, true))
      return { ok: true }
    }
    case 'remove': {
      const { error } = await db
        .from('session_bans')
        .upsert({ session_id: sessionId, identity, banned_by: host.userId })
      if (error) throw error
      await db.from('session_speakers').delete().eq('session_id', sessionId).eq('identity', identity)
      await ignoreMissing(rooms.removeParticipant(sessionId, identity))
      return { ok: true }
    }
    default:
      throw new HttpError(400, 'bad-request', 'Unknown action.')
  }
})
