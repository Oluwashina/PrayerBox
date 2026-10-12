import { Headphones } from 'lucide-react'
import type { PrayerSession } from '@/domain/types'
import { useNow } from '@/hooks/useNow'
import { formatElapsed } from '@/lib/format'
import { ButtonLink } from './ui/Button'
import { LiveDot } from './ui/Badge'
import { Waveform } from './Waveform'

/** The prominent card shown on the home page while a session is live. */
export function LiveSessionCard({ session }: { session: PrayerSession }) {
  const now = useNow()
  return (
    <section
      aria-labelledby={`live-${session.id}`}
      className="relative overflow-hidden rounded-[2rem] bg-plum-900 p-6 text-white shadow-lift sm:p-9"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-brand-400/20 blur-3xl"
      />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 size-72 rounded-full bg-plum-500/40 blur-3xl" />

      <div className="relative">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-semibold tracking-wide">
            <LiveDot /> LIVE NOW
          </span>
          {session.startedAt && (
            <span className="text-white/70 tabular-nums">Started {formatElapsed(session.startedAt, now)} ago</span>
          )}
        </div>

        <h2 id={`live-${session.id}`} className="mt-5 text-3xl font-medium sm:text-4xl">
          {session.title}
        </h2>
        <p className="mt-3 max-w-xl text-white/80">
          <span className="font-semibold text-brand-300">Praying for </span>
          {session.prayerFocus.charAt(0).toLowerCase() + session.prayerFocus.slice(1)}
        </p>
        <p className="mt-1 text-sm text-white/60">Led by {session.hostName}</p>

        <Waveform tone="dark" className="my-6 h-10 justify-start" bars={36} />

        <ButtonLink to={`/s/${session.id}`} variant="brand" size="lg" icon={<Headphones className="size-5" />}>
          Join Live Prayer
        </ButtonLink>
      </div>
    </section>
  )
}
