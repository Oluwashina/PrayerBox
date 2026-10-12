const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
const shortDayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function formatDay(iso: string, short = false) {
  const date = new Date(iso)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (isSameDay(date, today)) return 'Today'
  if (isSameDay(date, tomorrow)) return 'Tomorrow'
  if (isSameDay(date, yesterday)) return 'Yesterday'
  return (short ? shortDayFmt : dayFmt).format(date)
}

export function formatTime(iso: string) {
  return timeFmt.format(new Date(iso))
}

export function formatDateTime(iso: string, short = false) {
  return `${formatDay(iso, short)} · ${formatTime(iso)}`
}

export function formatRelativeStart(iso: string, now = Date.now()) {
  const diffMin = Math.round((new Date(iso).getTime() - now) / 60000)
  if (diffMin <= 0) return 'Starting soon'
  if (diffMin < 60) return `Starts in ${diffMin} min`
  const hours = Math.round(diffMin / 60)
  if (hours < 24) return `Starts in ${hours} hour${hours === 1 ? '' : 's'}`
  const days = Math.round(hours / 24)
  return `Starts in ${days} day${days === 1 ? '' : 's'}`
}

export function formatElapsed(fromIso: string, now = Date.now()) {
  const totalSec = Math.max(0, Math.floor((now - new Date(fromIso).getTime()) / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} hr ${m} min` : `${h} hr`
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/** Value for <input type="datetime-local"> in local time. */
export function toLocalInputValue(iso: string) {
  const d = new Date(iso)
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 16)
}

export function fromLocalInputValue(value: string) {
  return new Date(value).toISOString()
}
