import type { Participant } from '@/domain/types'
import { callFunction } from './api'

/**
 * Host moderation. Every call is authorized by the room-moderate Edge Function,
 * which applies the change through the LiveKit server API, so permissions are
 * enforced by the media server and not just hidden in the UI.
 */
export interface ModerationService {
  listParticipants(sessionId: string): Promise<Participant[]>
  setCanSpeak(sessionId: string, identity: string, canSpeak: boolean): Promise<void>
  muteParticipant(sessionId: string, identity: string): Promise<void>
  remove(sessionId: string, identity: string): Promise<void>
}

interface ServerParticipant {
  identity: string
  name: string
  isHost: boolean
  canSpeak: boolean
  isMuted: boolean
  handRaised: boolean
  joinedAt: string
}

export const moderationService: ModerationService = {
  async listParticipants(sessionId) {
    const { participants } = await callFunction<{ participants: ServerParticipant[] }>('room-moderate', {
      sessionId,
      action: 'list',
    })
    return participants.map((p) => ({
      id: p.identity,
      displayName: p.name,
      role: p.isHost ? 'host' : p.canSpeak ? 'speaker' : 'listener',
      canSpeak: p.isHost || p.canSpeak,
      isMuted: p.isMuted,
      handRaised: p.handRaised,
      joinedAt: p.joinedAt,
    }))
  },

  async setCanSpeak(sessionId, identity, canSpeak) {
    await callFunction('room-moderate', { sessionId, identity, action: canSpeak ? 'allow-speak' : 'revoke-speak' })
  },

  async muteParticipant(sessionId, identity) {
    await callFunction('room-moderate', { sessionId, identity, action: 'mute' })
  },

  async remove(sessionId, identity) {
    await callFunction('room-moderate', { sessionId, identity, action: 'remove' })
  },
}
