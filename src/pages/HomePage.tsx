import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import type { PrayerSession } from '@/domain/types'
import { groupSessions } from '@/domain/session'
import { useAuth } from '@/hooks/useAuth'
import { useNow } from '@/hooks/useNow'
import { useSessions } from '@/hooks/useSessions'
import { formatDay, formatRelativeStart, formatTime } from '@/lib/format'
import { LiveSessionCard } from '@/components/LiveSessionCard'
import { SessionCard } from '@/components/SessionCard'
import { Eyebrow, SectionHeader } from '@/components/layout/PageChrome'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState, ErrorState, SessionCardSkeleton, Skeleton } from '@/components/ui/States'

export function HomePage() {
  const { isHost } = useAuth()
  const { sessions, loading, error, reload } = useSessions()
  const { live, upcoming } = groupSessions(sessions)
  const current = live[0]
  const next = upcoming[0]

  return (
    <div className="flex flex-col gap-24 sm:gap-32">
      {/* Hero */}
      <section className="relative -mx-5 mt-0 overflow-hidden bg-plum-950 text-white sm:mx-0 sm:mt-6 sm:rounded-[2rem]">
        <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] size-[36rem] rounded-full bg-plum-600/35 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-30%] left-[-10%] size-[30rem] rounded-full bg-brand-400/[0.09] blur-[110px]" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgb(255_255_255)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255)_1px,transparent_1px)] [background-size:64px_64px]"
        />

        <div className="relative grid gap-12 px-5 pt-14 pb-10 sm:px-12 sm:pt-20 sm:pb-12 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:gap-16 lg:px-16 lg:pt-24 lg:pb-16">
          <div className="animate-fade-up">
            <Eyebrow tone="dark">The New Church Ibadan</Eyebrow>
            <h1 className="mt-7 text-[3.2rem] leading-[0.95] sm:text-[4.75rem] lg:text-[5.75rem]">
              Pray together, <em className="text-brand-300">wherever</em> you are.
            </h1>
            <p className="mt-7 max-w-md text-[1.0625rem] leading-relaxed text-white/65">
              Live audio prayer with our prayer team. Open the link, add your name, and you are in the room. No app, no
              account.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              {current ? (
                <ButtonLink to={`/s/${current.id}`} variant="brand" size="lg">
                  Join live prayer <ArrowUpRight className="size-4" aria-hidden />
                </ButtonLink>
              ) : (
                <ButtonLink to="/sessions" variant="brand" size="lg">
                  See the schedule <ArrowRight className="size-4" aria-hidden />
                </ButtonLink>
              )}
              {isHost ? (
                <ButtonLink to="/host?new=1" variant="onDark" size="lg">
                  Host a session
                </ButtonLink>
              ) : (
                <a href="#how" className="inline-flex h-13 items-center px-3 text-[0.9375rem] font-medium text-white/70 hover:text-white">
                  How it works
                </a>
              )}
            </div>
          </div>

          <div className="animate-fade-up [animation-delay:120ms]">
            {loading ? (
              <Skeleton className="h-80 rounded-[1.5rem] bg-white/[0.06]" />
            ) : current ? (
              <LiveSessionCard session={current} glass />
            ) : next ? (
              <NextGathering session={next} />
            ) : (
              <div className="rounded-[1.5rem] bg-white/[0.05] p-8 ring-1 ring-white/12">
                <p className="eyebrow text-white/50">Next gathering</p>
                <p className="mt-6 font-serif text-[2rem] leading-tight text-white/85">The next time of prayer will be announced soon.</p>
              </div>
            )}
          </div>
        </div>

        <ul className="relative grid grid-cols-3 border-t border-white/10 text-center text-[0.75rem] text-white/55 sm:text-sm">
          {['No app to install', 'Free for everyone', 'Any phone or laptop'].map((item, i) => (
            <li key={item} className={i > 0 ? 'border-l border-white/10 px-2 py-5' : 'px-2 py-5'}>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Schedule */}
      <section aria-labelledby="upcoming-heading">
        <SectionHeader
          index="01"
          eyebrow="Schedule"
          id="upcoming-heading"
          title={
            <>
              Upcoming <em className="text-plum-600">gatherings</em>
            </>
          }
          action={
            <Link to="/sessions" className="group inline-flex items-center gap-2 text-sm font-medium text-ink-900">
              Full schedule
              <span className="flex size-9 items-center justify-center rounded-full border border-ink-900/15 transition-colors group-hover:bg-ink-900 group-hover:text-white">
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          }
        />
        <div className="mt-6">
          {loading ? (
            <>
              <SessionCardSkeleton />
              <SessionCardSkeleton />
            </>
          ) : error ? (
            <ErrorState title="We could not load prayer sessions" body={error} onRetry={reload} />
          ) : upcoming.length === 0 ? (
            <EmptyState title="Nothing scheduled yet" body="New times of prayer will appear here as soon as they are announced." />
          ) : (
            upcoming.slice(0, 4).map((s) => <SessionCard key={s.id} session={s} />)
          )}
        </div>
      </section>

      {/* How it works */}
      <section id="how" aria-labelledby="how-heading" className="scroll-mt-24">
        <SectionHeader index="02" eyebrow="How it works" id="how-heading" title="Three steps into the room." />
        <ol className="mt-12 grid gap-px overflow-hidden rounded-[1.5rem] bg-ink-900/10 ring-1 ring-ink-900/10 md:grid-cols-3">
          {[
            { n: 'I', title: 'Open the link', body: 'Tap the prayer link shared on WhatsApp, or choose a session from the schedule.' },
            { n: 'II', title: 'Add your name', body: 'Just your first name, so others know who is praying with them.' },
            { n: 'III', title: 'Listen and pray', body: 'Your microphone stays off unless the host invites you to pray aloud.' },
          ].map((step) => (
            <li key={step.n} className="flex flex-col bg-cream-50 p-7 sm:p-9">
              <span className="font-serif text-5xl text-brand-600 italic">{step.n}</span>
              <p className="mt-10 font-serif text-[1.75rem] leading-tight text-ink-900">{step.title}</p>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-500">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Scripture */}
      <section className="mx-auto max-w-4xl py-4 text-center">
        <p className="font-serif text-[2.25rem] leading-[1.15] text-ink-900 sm:text-[3.5rem]">
          “Do not be anxious about anything, but in every situation, by <em className="text-plum-600">prayer</em> and
          petition, present your requests to God.”
        </p>
        <p className="eyebrow mt-8 text-ink-500">Philippians 4:6</p>
      </section>
    </div>
  )
}

function NextGathering({ session }: { session: PrayerSession }) {
  const now = useNow(30000)
  return (
    <Link
      to={`/s/${session.id}`}
      className="group block rounded-[1.5rem] bg-white/[0.05] p-6 ring-1 ring-white/12 backdrop-blur-sm transition-colors hover:bg-white/[0.08] sm:p-8"
    >
      <div className="flex items-center justify-between">
        <p className="eyebrow text-white/55">Next gathering</p>
        <p className="eyebrow text-brand-300">{formatRelativeStart(session.scheduledStart, now)}</p>
      </div>
      <div className="mt-8 flex items-end gap-5">
        <span className="font-serif text-[5.5rem] leading-[0.8] text-white">{new Date(session.scheduledStart).getDate()}</span>
        <div className="pb-1 text-sm text-white/60">
          <p className="text-white">{formatDay(session.scheduledStart)}</p>
          <p className="mt-0.5 tabular-nums">{formatTime(session.scheduledStart)}</p>
        </div>
      </div>
      <h2 className="mt-8 text-[2rem] leading-[1.05] text-white">{session.title}</h2>
      <p className="mt-2 text-[0.9375rem] text-white/60">Led by {session.hostName}</p>
      <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 text-sm">
        <span className="text-white/60">View details</span>
        <span className="flex size-10 items-center justify-center rounded-full border border-white/20 transition-colors group-hover:border-brand-300 group-hover:bg-brand-300 group-hover:text-ink-900">
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </div>
    </Link>
  )
}
