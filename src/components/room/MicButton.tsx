import { Loader2, Mic, MicOff } from 'lucide-react'
import type { MicrophoneState } from '@/services/audio'
import { cn } from '@/lib/cn'

export function MicButton({ microphone, onToggle }: { microphone: MicrophoneState; onToggle: () => void }) {
  const on = microphone.status === 'on'
  const requesting = microphone.status === 'requesting'
  const label = requesting ? 'Starting microphone' : on ? 'Mute microphone' : 'Unmute microphone'
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        disabled={requesting}
        aria-pressed={on}
        aria-label={label}
        className={cn(
          'relative flex size-20 items-center justify-center rounded-full transition-colors focus-visible:outline-brand-300 sm:size-[5.5rem]',
          on
            ? 'bg-brand-400 text-ink-900 shadow-[0_0_0_8px_rgb(255_197_51/0.18)] hover:bg-brand-300'
            : 'bg-white text-plum-900 hover:bg-cream-100',
        )}
      >
        {requesting ? (
          <Loader2 className="size-8 animate-spin" aria-hidden />
        ) : on ? (
          <Mic className="size-8" aria-hidden />
        ) : (
          <MicOff className="size-8" aria-hidden />
        )}
      </button>
      <span className="text-sm font-semibold text-white">{requesting ? 'Allow access…' : on ? 'Mic on' : 'Muted'}</span>
    </div>
  )
}
