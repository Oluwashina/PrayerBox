import { useEffect, useMemo, useRef } from 'react'
import { cn } from '@/lib/cn'

interface WaveformProps {
  /** Returns a 0..1 level. When omitted or inactive, a calm resting shape is shown. */
  getLevel?: () => number
  active?: boolean
  bars?: number
  tone?: 'light' | 'dark'
  className?: string
}

export function Waveform({ getLevel, active = false, bars = 28, tone = 'light', className }: WaveformProps) {
  const refs = useRef<Array<HTMLSpanElement | null>>([])

  // A gentle bell-shaped profile so the bars look like a voice, not noise.
  const profile = useMemo(
    () =>
      Array.from({ length: bars }, (_, i) => {
        const x = (i / (bars - 1)) * 2 - 1
        return 0.35 + 0.65 * Math.exp(-x * x * 2.2) * (0.75 + 0.25 * Math.sin(i * 1.7))
      }),
    [bars],
  )

  useEffect(() => {
    if (!active || !getLevel) {
      refs.current.forEach((el, i) => {
        if (el) el.style.transform = `scaleY(${0.08 + profile[i] * 0.1})`
      })
      return
    }
    let frame = 0
    let smoothed = 0
    const tick = (t: number) => {
      const level = getLevel()
      smoothed = smoothed * 0.7 + level * 0.3
      refs.current.forEach((el, i) => {
        if (!el) return
        const wobble = 0.75 + 0.25 * Math.sin(t / 140 + i * 0.9)
        const scale = 0.08 + Math.min(1, smoothed * profile[i] * wobble * 1.6)
        el.style.transform = `scaleY(${scale.toFixed(3)})`
      })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, getLevel, profile])

  return (
    <div aria-hidden className={cn('flex h-16 items-center justify-center gap-[3px]', className)}>
      {profile.map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          className={cn(
            'h-full w-[3px] origin-center rounded-full transition-transform duration-75 sm:w-1',
            tone === 'dark' ? (active ? 'bg-brand-300' : 'bg-white/25') : active ? 'bg-plum-600' : 'bg-plum-200',
          )}
          style={{ transform: 'scaleY(0.1)' }}
        />
      ))}
    </div>
  )
}
