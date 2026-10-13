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

const origin = () => (typeof window !== 'undefined' ? window.location.origin : '')

/** Stable public link for “we’re live now” shares. */
export function livePrayerUrl() {
  return `${origin()}/live`
}

export function sessionShareUrl(sessionId: string) {
  return `${origin()}/s/${sessionId}`
}

/** Link hosts should share: /live when live, otherwise the session join page. */
export function publicShareUrl(session: PrayerSession) {
  return session.status === 'live' ? livePrayerUrl() : sessionShareUrl(session.id)
}

export function modeLabel(mode: PrayerSession['mode']) {
  return mode === 'broadcast' ? 'Broadcast' : 'Interactive prayer'
}

export function modeDescription(mode: PrayerSession['mode']) {
  return mode === 'broadcast'
    ? 'The host leads in prayer while everyone listens.'
    : 'The host can invite participants to pray aloud.'
}
