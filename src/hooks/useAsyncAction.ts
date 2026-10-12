import { useCallback, useState } from 'react'

export function useAsyncAction<A extends unknown[], R>(action: (...args: A) => Promise<R>) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(
    async (...args: A): Promise<R | undefined> => {
      setPending(true)
      setError(null)
      try {
        return await action(...args)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
        return undefined
      } finally {
        setPending(false)
      }
    },
    [action],
  )

  return { run, pending, error, clearError: () => setError(null) }
}
