import { adminClient, isNotFound, loadSession, roomService } from '../_shared/clients.ts'
import { HttpError, requireSessionId, serve } from '../_shared/http.ts'
import { HOST_PREFIX, requireHost } from '../_shared/identity.ts'
import { permissionFor } from '../_shared/permissions.ts'

type Action = 'start' | 'end' | 'set-mode'

async function updateSession(sessionId: string, patch: Record<string, unknown>) {
  const { data, error } = await adminClient()
    .from('prayer_sessions')
    .update(patch)
    .eq('id', sessionId)
    .select('*')
    .single()
  if (error) {
    // Raised by the prayer_sessions_guard trigger for invalid transitions.
    if (error.code === 'P0001') throw new HttpError(409, 'invalid-transition', error.message)
    throw error
  }
  return data
}

serve(async (req, body) => {
  await requireHost(req)
  const sessionId = requireSessionId(body.sessionId)
  const action = body.action as Action
  const session = await loadSession(sessionId)
  const rooms = roomService()

  switch (action) {
    case 'start': {
      if (session.status !== 'scheduled') throw new HttpError(409, 'invalid-transition', 'Only scheduled sessions can be started.')
      await rooms.createRoom({ name: sessionId, emptyTimeout: 10 * 60, departureTimeout: 30, maxParticipants: 500 })
      return { session: await updateSession(sessionId, { status: 'live' }) }
    }
    case 'end': {
      if (session.status !== 'live') throw new HttpError(409, 'invalid-transition', 'Only live sessions can be ended.')
      const updated = await updateSession(sessionId, { status: 'ended' })
      // Deleting the room disconnects everyone immediately.
      try {
        await rooms.deleteRoom(sessionId)
      } catch (error) {
        if (!isNotFound(error)) throw error
      }
      await adminClient().from('session_speakers').delete().eq('session_id', sessionId)
      return { session: updated }
    }
    case 'set-mode': {
      const mode = body.mode
      if (mode !== 'broadcast' && mode !== 'interactive') throw new HttpError(400, 'bad-request', 'Unknown mode.')
      if (session.status !== 'scheduled' && session.status !== 'live') {
        throw new HttpError(409, 'invalid-transition', 'Finished sessions cannot be changed.')
      }
      const updated = await updateSession(sessionId, { mode })
      if (mode === 'broadcast') {
        await adminClient().from('session_speakers').delete().eq('session_id', sessionId)
        if (session.status === 'live') {
          let participants: Awaited<ReturnType<typeof rooms.listParticipants>> = []
          try {
            participants = await rooms.listParticipants(sessionId)
          } catch (error) {
            if (!isNotFound(error)) throw error
          }
          await Promise.all(
            participants
              .filter((p) => !p.identity.startsWith(HOST_PREFIX) && (p.permission?.canPublish || p.attributes?.handRaised))
              .map((p) =>
                rooms.updateParticipant(sessionId, p.identity, { permission: permissionFor(false), attributes: { handRaised: '' } }),
              ),
          )
        }
      }
      return { session: updated }
    }
    default:
      throw new HttpError(400, 'bad-request', 'Unknown action.')
  }
})
