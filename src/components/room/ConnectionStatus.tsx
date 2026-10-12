import { AlertTriangle, CheckCircle2, Loader2, WifiOff } from 'lucide-react'
import type { AudioConnectionState } from '@/services/audio'
import { cn } from '@/lib/cn'

export type DisplayConnectionState = AudioConnectionState | 'offline'

const copy: Record<DisplayConnectionState, { label: string; tone: 'ok' | 'wait' | 'warn' | 'bad' }> = {
  idle: { label: 'Preparing audio…', tone: 'wait' },
  connecting: { label: 'Connecting to audio…', tone: 'wait' },
  connected: { label: 'Connected', tone: 'ok' },
  reconnecting: { label: 'Reconnecting…', tone: 'wait' },
  offline: { label: 'Offline, waiting for internet', tone: 'warn' },
  disconnected: { label: 'Disconnected', tone: 'bad' },
  failed: { label: 'Could not connect to audio', tone: 'bad' },
}

export function ConnectionStatus({ state }: { state: DisplayConnectionState }) {
  const { label, tone } = copy[state]
  const Icon = tone === 'ok' ? CheckCircle2 : tone === 'wait' ? Loader2 : state === 'offline' ? WifiOff : AlertTriangle
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium',
        tone === 'ok' && 'bg-ok/20 text-[#9be3b9]',
        tone === 'wait' && 'bg-white/10 text-white/80',
        tone === 'warn' && 'bg-brand-400/15 text-brand-200',
        tone === 'bad' && 'bg-danger/25 text-[#ffb4ae]',
      )}
    >
      <Icon className={cn('size-4', tone === 'wait' && 'animate-spin')} aria-hidden />
      {label}
    </span>
  )
}
