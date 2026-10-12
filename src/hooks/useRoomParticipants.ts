import { useCallback, useEffect, useState } from 'react'
import type { Participant } from '@/domain/types'
import { moderationService } from '@/services'

/** Host-only live roster from the LiveKit server, polled while `enabled`. */
export function useRoomParticipants(sessionId: string | undefined, enabled: boolean, intervalMs = 4000) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!sessionId) return
    try {
      setParticipants(await moderationService.listParticipants(sessionId))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load participants.')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (!enabled) {
      setParticipants([])
      return
    }
    void refresh()
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, intervalMs)
    return () => clearInterval(id)
  }, [enabled, refresh, intervalMs])

  return { participants, error, loading: enabled && loading, refresh }
}
