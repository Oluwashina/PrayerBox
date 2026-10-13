import type { RealtimeChannel } from '@supabase/supabase-js'
import type { PrayerSession, SessionDraft } from '@/domain/types'
import { supabase } from '@/lib/supabase'
import { callFunction, friendlyDbError } from '../api'
import type { SessionService } from '../sessionService'

interface SessionRow {
  id: string
  title: string
  description: string
  prayer_focus: string
  host_name: string
  scheduled_start: string
  duration_minutes: number
  mode: PrayerSession['mode']
  status: PrayerSession['status']
  started_at: string | null
  ended_at: string | null
  created_at: string
  updated_at: string
}

interface AttendanceRow {
  identity: string
  display_name: string
  is_host: boolean
  first_joined_at: string
  last_joined_at: string
  join_count: number
}

const COLUMNS =
  'id, title, description, prayer_focus, host_name, scheduled_start, duration_minutes, mode, status, started_at, ended_at, created_at, updated_at'

function fromRow(row: SessionRow): PrayerSession {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    prayerFocus: row.prayer_focus,
    hostName: row.host_name,
    scheduledStart: row.scheduled_start,
    durationMinutes: row.duration_minutes,
    mode: row.mode,
    status: row.status,
    startedAt: row.started_at ?? undefined,
    endedAt: row.ended_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toRow(draft: Partial<SessionDraft>) {
  const row: Record<string, unknown> = {}
  if (draft.title !== undefined) row.title = draft.title
  if (draft.description !== undefined) row.description = draft.description
  if (draft.prayerFocus !== undefined) row.prayer_focus = draft.prayerFocus
  if (draft.hostName !== undefined) row.host_name = draft.hostName
  if (draft.scheduledStart !== undefined) row.scheduled_start = draft.scheduledStart
  if (draft.durationMinutes !== undefined) row.duration_minutes = draft.durationMinutes
  if (draft.mode !== undefined) row.mode = draft.mode
  return row
}

const listeners = new Set<() => void>()
let channel: RealtimeChannel | undefined

function emit() {
  listeners.forEach((l) => l())
}

function ensureChannel() {
  if (channel) return
  channel = supabase()
    .channel('prayer-sessions')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'prayer_sessions' }, emit)
    // Refetch after (re)subscribing so changes missed while offline are picked up.
    .subscribe((status) => status === 'SUBSCRIBED' && emit())
}

async function control(id: string, action: string, extra: Record<string, unknown> = {}) {
  const { session } = await callFunction<{ session: SessionRow }>('session-control', { sessionId: id, action, ...extra })
  emit()
  return fromRow(session)
}

export const supabaseSessionService: SessionService = {
  async list() {
    const { data, error } = await supabase()
      .from('prayer_sessions')
      .select(COLUMNS)
      .order('scheduled_start', { ascending: true })
      .limit(200)
    if (error) throw friendlyDbError(error)
    return (data as SessionRow[]).map(fromRow)
  },

  async get(id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null
    const { data, error } = await supabase().from('prayer_sessions').select(COLUMNS).eq('id', id).maybeSingle()
    if (error) throw friendlyDbError(error)
    return data ? fromRow(data as SessionRow) : null
  },

  async create(draft) {
    const { data, error } = await supabase().from('prayer_sessions').insert(toRow(draft)).select(COLUMNS).single()
    if (error) throw friendlyDbError(error)
    emit()
    return fromRow(data as SessionRow)
  },

  async update(id, patch) {
    const { data, error } = await supabase().from('prayer_sessions').update(toRow(patch)).eq('id', id).select(COLUMNS).single()
    if (error) throw friendlyDbError(error)
    emit()
    return fromRow(data as SessionRow)
  },

  async cancel(id) {
    const { data, error } = await supabase()
      .from('prayer_sessions')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select(COLUMNS)
      .single()
    if (error) throw friendlyDbError(error)
    emit()
    return fromRow(data as SessionRow)
  },

  async attendance(id) {
    const { data, error } = await supabase()
      .from('session_attendance')
      .select('identity, display_name, is_host, first_joined_at, last_joined_at, join_count')
      .eq('session_id', id)
      .order('first_joined_at', { ascending: true })
    if (error) throw friendlyDbError(error)
    return (data as AttendanceRow[]).map((row) => ({
      id: row.identity,
      displayName: row.display_name,
      isHost: row.is_host,
      firstJoinedAt: row.first_joined_at,
      lastJoinedAt: row.last_joined_at,
      visits: row.join_count,
    }))
  },

  async attendanceCounts() {
    const { data, error } = await supabase().rpc('session_attendance_counts')
    if (error) throw friendlyDbError(error)
    return Object.fromEntries((data as { session_id: string; attendees: number }[]).map((r) => [r.session_id, r.attendees]))
  },

  setMode: (id, mode) => control(id, 'set-mode', { mode }),
  start: (id) => control(id, 'start'),
  end: (id) => control(id, 'end'),

  subscribe(listener) {
    listeners.add(listener)
    ensureChannel()
    return () => {
      listeners.delete(listener)
    }
  },
}
