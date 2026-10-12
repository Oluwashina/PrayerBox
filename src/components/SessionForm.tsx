import { useState, type FormEvent } from 'react'
import { Radio, UsersRound } from 'lucide-react'
import type { SessionDraft, SessionMode } from '@/domain/types'
import { modeDescription, modeLabel } from '@/domain/session'
import { fromLocalInputValue, toLocalInputValue } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Field, Input, Select, Textarea } from './ui/Field'

type Errors = Partial<Record<keyof SessionDraft, string>>

function defaultStart() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(19, 0, 0, 0)
  return d.toISOString()
}

export function emptyDraft(hostName = ''): SessionDraft {
  return {
    title: '',
    description: '',
    prayerFocus: '',
    hostName,
    scheduledStart: defaultStart(),
    durationMinutes: 45,
    mode: 'broadcast',
  }
}

function validate(draft: SessionDraft, isNew: boolean): Errors {
  const errors: Errors = {}
  if (!draft.title.trim()) errors.title = 'Give the session a title.'
  if (!draft.prayerFocus.trim()) errors.prayerFocus = 'Add a prayer focus so people know what to pray for.'
  if (!draft.hostName.trim()) errors.hostName = 'Who is leading this session?'
  if (Number.isNaN(new Date(draft.scheduledStart).getTime())) errors.scheduledStart = 'Choose a date and time.'
  else if (isNew && new Date(draft.scheduledStart).getTime() < Date.now() - 5 * 60000)
    errors.scheduledStart = 'Choose a time in the future.'
  return errors
}

const durations = [15, 30, 45, 60, 90, 120, 180]

interface SessionFormProps {
  id: string
  initial: SessionDraft
  isNew: boolean
  onSubmit: (draft: SessionDraft) => void
}

/** Rendered inside a dialog; the submit button lives in the dialog footer via `form={id}`. */
export function SessionForm({ id, initial, isNew, onSubmit }: SessionFormProps) {
  const [draft, setDraft] = useState(initial)
  const [errors, setErrors] = useState<Errors>({})

  const set = <K extends keyof SessionDraft>(key: K, value: SessionDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validate(draft, isNew)
    setErrors(found)
    if (Object.keys(found).length === 0) {
      onSubmit({ ...draft, title: draft.title.trim(), prayerFocus: draft.prayerFocus.trim(), hostName: draft.hostName.trim() })
    }
  }

  return (
    <form id={id} onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Field label="Title" error={errors.title}>
        {(p) => (
          <Input {...p} value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="Evening Prayer Watch" maxLength={80} />
        )}
      </Field>

      <Field label="Prayer focus" error={errors.prayerFocus} hint="Shown as “Praying for …” on the session page.">
        {(p) => (
          <Input
            {...p}
            value={draft.prayerFocus}
            onChange={(e) => set('prayerFocus', e.target.value)}
            placeholder="Healing and comfort for the sick"
            maxLength={120}
          />
        )}
      </Field>

      <Field label="Description" hint="Optional. A sentence or two to welcome people.">
        {(p) => (
          <Textarea {...p} value={draft.description} onChange={(e) => set('description', e.target.value)} maxLength={400} />
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Date and time" error={errors.scheduledStart}>
          {(p) => (
            <Input
              {...p}
              type="datetime-local"
              value={toLocalInputValue(draft.scheduledStart)}
              onChange={(e) => e.target.value && set('scheduledStart', fromLocalInputValue(e.target.value))}
            />
          )}
        </Field>
        <Field label="Duration">
          {(p) => (
            <Select {...p} value={draft.durationMinutes} onChange={(e) => set('durationMinutes', Number(e.target.value))}>
              {durations.map((m) => (
                <option key={m} value={m}>
                  {m < 60 ? `${m} minutes` : `${m / 60} hour${m === 60 ? '' : 's'}`}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <Field label="Led by" error={errors.hostName}>
        {(p) => <Input {...p} value={draft.hostName} onChange={(e) => set('hostName', e.target.value)} placeholder="Pastor Ruth" />}
      </Field>

      <ModePicker value={draft.mode} onChange={(m) => set('mode', m)} />
    </form>
  )
}

export function ModePicker({ value, onChange }: { value: SessionMode; onChange: (mode: SessionMode) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-ink-700">Session mode</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {(['broadcast', 'interactive'] as const).map((mode) => {
          const Icon = mode === 'broadcast' ? Radio : UsersRound
          const selected = value === mode
          return (
            <label
              key={mode}
              className={cn(
                'flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-plum-100',
                selected ? 'border-plum-400 bg-plum-50' : 'border-cream-200 bg-white hover:border-plum-200',
              )}
            >
              <input
                type="radio"
                name="mode"
                value={mode}
                checked={selected}
                onChange={() => onChange(mode)}
                className="sr-only"
              />
              <Icon className={cn('mt-0.5 size-5 shrink-0', selected ? 'text-plum-700' : 'text-ink-400')} aria-hidden />
              <span>
                <span className="block font-semibold text-ink-900">{modeLabel(mode)}</span>
                <span className="mt-0.5 block text-sm text-ink-500">{modeDescription(mode)}</span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
