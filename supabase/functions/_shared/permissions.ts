import { TrackSource } from 'npm:livekit-server-sdk@2.19.1'

/**
 * LiveKit permissions per role. Publishing is limited to the microphone, and
 * nobody can change their own name/attributes (hand raises go through the server).
 */
export function permissionFor(canSpeak: boolean) {
  return {
    canSubscribe: true,
    canPublish: canSpeak,
    canPublishSources: canSpeak ? [TrackSource.MICROPHONE] : [],
    canPublishData: false,
    canUpdateMetadata: false,
  }
}
