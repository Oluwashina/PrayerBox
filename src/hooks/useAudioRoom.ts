import { useEffect, useState, useSyncExternalStore } from 'react'
import { createAudioRoomClient, type JoinAudioRoomOptions } from '@/services/audio'

/**
 * Owns one audio client for the lifetime of the room screen. Connects once
 * the options are known and disconnects on unmount.
 */
export function useAudioRoom(options: JoinAudioRoomOptions | null) {
  const [client] = useState(createAudioRoomClient)
  const snapshot = useSyncExternalStore(client.subscribe, client.getSnapshot)

  const sessionId = options?.sessionId
  const displayName = options?.displayName
  useEffect(() => {
    if (!sessionId || displayName === undefined) return
    void client.connect({ sessionId, displayName })
    return () => {
      void client.disconnect()
    }
  }, [client, sessionId, displayName])

  return { client, snapshot }
}
