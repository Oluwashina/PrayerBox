import type { PrayerSession } from './types'

export function sortByStartAsc(a: PrayerSession, b: PrayerSession) {
  return new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
}

export function sortByStartDesc(a: PrayerSession, b: PrayerSession) {
  return -sortByStartAsc(a, b)
}

export function groupSessions(sessions: PrayerSession[]) {
  return {
    live: sessions.filter((s) => s.status === 'live').sort(sortByStartAsc),
    upcoming: sessions.filter((s) => s.status === 'scheduled').sort(sortByStartAsc),
    past: sessions.filter((s) => s.status === 'ended' || s.status === 'cancelled').sort(sortByStartDesc),
  }
}

export function sessionShareUrl(sessionId: string) {
  return `${window.location.origin}/s/${sessionId}`
}

export function modeLabel(mode: PrayerSession['mode']) {
  return mode === 'broadcast' ? 'Broadcast' : 'Interactive prayer'
}

export function modeDescription(mode: PrayerSession['mode']) {
  return mode === 'broadcast'
    ? 'The host leads in prayer while everyone listens.'
    : 'The host can invite participants to pray aloud.'
}
