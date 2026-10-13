import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { Eyebrow } from '@/components/layout/PageChrome'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { InlineAlert, Spinner } from '@/components/ui/States'

export function HostSignInPage() {
  const { host, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/host'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const { run, pending, error } = useAsyncAction(signIn)

  if (loading) {
    return (
      <div className="flex justify-center pt-24">
        <Spinner />
      </div>
    )
  }
  if (host) return <Navigate to={from} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setFieldError('Enter the email address you use for the prayer team.')
    if (!password) return setFieldError('Enter your password.')
    setFieldError(undefined)
    if (await run(email.trim(), password)) navigate(from, { replace: true })
  }

  return (
    <div className="pt-8 sm:pt-12">
      <div className="grid overflow-hidden rounded-[2rem] border border-ink-900/[0.08] bg-white lg:min-h-[38rem] lg:grid-cols-[1.1fr_1fr]">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-plum-950 p-12 text-white lg:flex">
          <div aria-hidden className="pointer-events-none absolute -top-32 -left-24 size-96 rounded-full bg-plum-600/40 blur-[100px]" />
          <div aria-hidden className="pointer-events-none absolute -right-20 bottom-0 size-80 rounded-full bg-brand-400/10 blur-[90px]" />
          <div className="relative">
            <Eyebrow tone="dark">Prayer team</Eyebrow>
            <p className="mt-8 font-serif text-[3.75rem] leading-[0.98]">
              Lead your church in <em className="text-brand-300">prayer.</em>
            </p>
          </div>
          <ul className="relative divide-y divide-white/10 border-y border-white/10 text-[0.9375rem] text-white/70">
            {['Schedule and share sessions', 'Go live with one tap', 'Invite people to pray aloud'].map((t, i) => (
              <li key={t} className="flex items-center gap-5 py-4">
                <span className="eyebrow text-brand-300">0{i + 1}</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-center px-6 py-12 sm:px-12 sm:py-16">
          <div className="w-full max-w-sm">
            <Eyebrow className="lg:hidden">Prayer team</Eyebrow>
            <h1 className="mt-5 text-[2.75rem] leading-none text-ink-900 lg:mt-0">Welcome back.</h1>
            <p className="mt-3 text-[0.9375rem] text-ink-500">Sign in to the host console. Listeners never need an account.</p>

            {(fieldError || error) && (
              <InlineAlert tone="danger" className="mt-6">
                {fieldError ?? error}
              </InlineAlert>
            )}

            <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-5">
              <Field label="Email">
                {(p) => (
                  <Input
                    {...p}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@church.org"
                  />
                )}
              </Field>
              <Field label="Password">
                {(p) => (
                  <Input
                    {...p}
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                )}
              </Field>
              <Button type="submit" size="lg" fullWidth loading={pending} className="mt-2">
                Sign in <ArrowRight className="size-4" aria-hidden />
              </Button>
            </form>
            <p className="mt-8 border-t border-ink-900/[0.08] pt-6 text-[0.8125rem] leading-relaxed text-ink-500">
              Host accounts are created by a church administrator. Ask them if you need access.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
