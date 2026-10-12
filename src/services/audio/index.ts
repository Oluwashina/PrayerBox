import { LiveKitAudioClient } from './livekitClient'
import type { AudioRoomClient } from './types'

export function createAudioRoomClient(): AudioRoomClient {
  return new LiveKitAudioClient()
}

export type * from './types'
