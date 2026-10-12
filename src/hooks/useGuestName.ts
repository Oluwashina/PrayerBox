import { useCallback, useState } from 'react'

const KEY = 'prayerbox.displayName'

export function readGuestName() {
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function useGuestName() {
  const [name, setNameState] = useState(readGuestName)
  const save = useCallback((value: string) => {
    const trimmed = value.trim()
    setNameState(trimmed)
    try {
      localStorage.setItem(KEY, trimmed)
    } catch {
      // Storage unavailable: the name still works for this visit.
    }
  }, [])
  return [name, save] as const
}
