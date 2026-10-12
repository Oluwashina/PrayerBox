import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'brand' | 'secondary' | 'ghost' | 'danger' | 'onDark' | 'onDarkGhost'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary: 'bg-plum-800 text-white shadow-soft hover:bg-plum-700 active:bg-plum-900',
  brand: 'bg-brand-400 text-ink-900 shadow-soft hover:bg-brand-300 active:bg-brand-500',
  secondary: 'border border-cream-200 bg-white text-ink-900 hover:border-plum-200 hover:bg-plum-50',
  ghost: 'text-plum-800 hover:bg-plum-50',
  danger: 'bg-danger text-white hover:bg-danger/90',
  onDark: 'bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15',
  onDarkGhost: 'text-white/80 hover:bg-white/10 hover:text-white',
}

const sizes: Record<Size, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-5 text-[0.95rem]',
  lg: 'h-14 px-7 text-base',
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
        tone === 'light' ? 'text-ink-700 hover:bg-plum-50 hover:text-plum-800' : 'text-white/80 hover:bg-white/10 hover:text-white',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
