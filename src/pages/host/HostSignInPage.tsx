import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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
      <div className="flex justify-center pt-16">
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
    <div className="mx-auto max-w-md pt-6 sm:pt-12">
      <Card className="rounded-[2rem] p-6 sm:p-9">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-plum-50 text-plum-700">
          <ShieldCheck className="size-6" aria-hidden />
        </span>
        <h1 className="mt-5 text-3xl font-medium">Host sign in</h1>
        <p className="mt-2 text-ink-500">For the prayer team only. Listeners never need an account.</p>

        {(fieldError || error) && (
          <InlineAlert tone="danger" className="mt-6">
            {fieldError ?? error}
          </InlineAlert>
        )}

        <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-5">
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
          <Button type="submit" size="lg" fullWidth loading={pending}>
            Sign in
          </Button>
        </form>
        <p className="mt-6 text-sm text-ink-500">
          Host accounts are created by a church administrator. Ask them if you need access.
        </p>
      </Card>
    </div>
  )
}
