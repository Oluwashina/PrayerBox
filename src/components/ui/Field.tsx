import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const control =
  'w-full rounded-2xl border border-cream-200 bg-white px-4 text-base text-ink-900 placeholder:text-ink-400 transition-colors focus:border-plum-400 focus:outline-none focus:ring-4 focus:ring-plum-100 aria-invalid:border-danger aria-invalid:focus:ring-danger-soft'

interface FieldProps {
  label: string
  hint?: ReactNode
  error?: string
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode
  className?: string
}

export function Field({ label, hint, error, children, className }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink-700">
        {label}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && !error && (
        <p id={hintId} className="text-sm text-ink-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={cn(control, 'h-13', className)} {...rest} />
})

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'min-h-28 py-3 leading-relaxed', className)} {...rest} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(control, 'h-13 appearance-none bg-[length:1.1rem] bg-[right_1rem_center] bg-no-repeat pr-10', className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b6473' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...rest}
    >
      {children}
    </select>
  )
}
