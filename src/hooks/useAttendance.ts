import { useCallback, useEffect, useState } from 'react'
import type { Attendee } from '@/domain/types'
import { sessionService } from '@/services'

function message(error: unknown) {
  return error instanceof Error ? error.message : 'Could not load attendance.'
}

/** Host only. Who entered a session's prayer room. */
export function useAttendance(sessionId: string | undefined, enabled: boolean) {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!sessionId) return
    try {
      setAttendees(await sessionService.attendance(sessionId))
      setError(null)
    } catch (e) {
      setError(message(e))
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (enabled) void load()
  }, [enabled, load])

  return { attendees, loading: enabled && loading, error, reload: load }
}

/** Host only. Attendee count per session id; empty until loaded or on error. */
export function useAttendanceCounts(enabled: boolean) {
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const load = () =>
      sessionService
        .attendanceCounts()
        .then((c) => !cancelled && setCounts(c))
        .catch(() => {})
    void load()
    const unsubscribe = sessionService.subscribe(() => void load())
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [enabled])

  return counts
}
