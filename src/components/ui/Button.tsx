import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'brand' | 'secondary' | 'ghost' | 'danger' | 'onDark' | 'onDarkGhost'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-[-0.005em] transition-[background-color,border-color,color,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45'

const variants: Record<Variant, string> = {
  primary: 'bg-ink-900 text-white hover:bg-plum-900 active:bg-plum-950',
  brand: 'bg-brand-400 text-ink-900 hover:bg-brand-300 active:bg-brand-500',
  secondary: 'border border-ink-900/15 bg-white/60 text-ink-900 hover:border-ink-900/35 hover:bg-white',
  ghost: 'text-ink-900 hover:bg-ink-900/[0.05]',
  danger: 'bg-danger text-white hover:bg-danger/90',
  onDark: 'border border-white/20 text-white hover:border-white/40 hover:bg-white/[0.06]',
  onDarkGhost: 'text-white/75 hover:bg-white/[0.08] hover:text-white',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[0.8125rem]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-[0.9375rem]',
}

interface CommonProps {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  fullWidth?: boolean
}

export function buttonClasses({ variant = 'primary', size = 'md', fullWidth }: CommonProps = {}) {
  return cn(base, variants[variant], sizes[size], fullWidth && 'w-full')
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, icon, fullWidth, loading, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClasses({ variant, size, fullWidth }), className)}
      {...rest}
    >
      {loading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
})

type ButtonLinkProps = CommonProps & LinkProps

export function ButtonLink({ variant, size, icon, fullWidth, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={cn(buttonClasses({ variant, size, fullWidth }), className)} {...rest}>
      {icon}
      {children}
    </Link>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  tone?: 'light' | 'dark'
}

export function IconButton({ label, tone = 'light', className, children, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40',
        tone === 'light' ? 'text-ink-700 hover:bg-ink-900/[0.05] hover:text-ink-900' : 'text-white/80 hover:bg-white/10 hover:text-white',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
