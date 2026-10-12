export type SessionStatus = 'scheduled' | 'live' | 'ended' | 'cancelled'

/**
 * broadcast: only the host speaks, everyone else listens.
 * interactive: the host can approve participants to speak.
 */
export type SessionMode = 'broadcast' | 'interactive'

export interface PrayerSession {
  id: string
  title: string
  description: string
  prayerFocus: string
  hostName: string
  /** ISO timestamp */
  scheduledStart: string
  durationMinutes: number
  mode: SessionMode
  status: SessionStatus
  startedAt?: string
  endedAt?: string
  createdAt: string
  updatedAt: string
}

export type SessionDraft = Pick<
  PrayerSession,
  'title' | 'description' | 'prayerFocus' | 'hostName' | 'scheduledStart' | 'durationMinutes' | 'mode'
>

export type ParticipantRole = 'host' | 'speaker' | 'listener'

export interface Participant {
  id: string
  displayName: string
  role: ParticipantRole
  /** Granted by the host. Hosts can always speak. */
  canSpeak: boolean
  /** Muted by the participant or by the host. */
  isMuted: boolean
  handRaised: boolean
  joinedAt: string
}

export interface HostUser {
  id: string
  name: string
  email: string
}
