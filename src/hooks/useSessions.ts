import { useCallback, useEffect, useState } from 'react'
import type { PrayerSession } from '@/domain/types'
import { sessionService } from '@/services'

interface AsyncState<T> {
  data: T
  loading: boolean
  error: string | null
}

function message(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

export function useSessions() {
  const [state, setState] = useState<AsyncState<PrayerSession[]>>({ data: [], loading: true, error: null })

  const load = useCallback(async (silent = false) => {
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await sessionService.list()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error: message(error) }))
    }
  }, [])

  useEffect(() => {
    void load()
    return sessionService.subscribe(() => void load(true))
  }, [load])

  return { sessions: state.data, loading: state.loading, error: state.error, reload: () => load() }
}

export function useSession(id: string | undefined) {
  const [state, setState] = useState<AsyncState<PrayerSession | null>>({ data: null, loading: true, error: null })

  const load = useCallback(
    async (silent = false) => {
      if (!id) return
      if (!silent) setState((s) => ({ ...s, loading: true, error: null }))
      try {
        const data = await sessionService.get(id)
        setState({ data, loading: false, error: null })
      } catch (error) {
        setState((s) => ({ ...s, loading: false, error: message(error) }))
      }
    },
    [id],
  )

  useEffect(() => {
    void load()
    return sessionService.subscribe(() => void load(true))
  }, [load])

  return {
    session: state.data,
    loading: state.loading,
    error: state.error,
    notFound: !state.loading && !state.error && !state.data,
    reload: () => load(),
  }
}
