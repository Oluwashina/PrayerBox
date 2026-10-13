import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { IconButton } from './Button'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  tone?: 'light' | 'dark'
}

/** Native <dialog>: focus trapping, Esc and backdrop handling come for free. Bottom sheet on mobile. */
export function Dialog({ open, onClose, title, description, children, footer, size = 'md', tone = 'light' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="dialog-title"
      className={cn(
        'm-0 mt-auto w-full max-w-none rounded-t-[1.75rem] p-0 shadow-lift backdrop:bg-plum-950/55 backdrop:backdrop-blur-sm sm:m-auto sm:rounded-[1.5rem]',
        size === 'sm' && 'sm:max-w-md',
        size === 'md' && 'sm:max-w-lg',
        size === 'lg' && 'sm:max-w-2xl',
        tone === 'light' ? 'bg-cream-50 text-ink-900' : 'bg-plum-900 text-white',
      )}
    >
      {open && (
        <div className="flex max-h-[88dvh] flex-col">
          <div className="flex items-start gap-4 px-6 pt-7 pb-2 sm:px-8">
            <div className="flex-1">
              <h2 id="dialog-title" className="text-[1.75rem] leading-tight">
                {title}
              </h2>
              {description && (
                <p className={cn('mt-1 text-sm', tone === 'light' ? 'text-ink-500' : 'text-white/70')}>{description}</p>
              )}
            </div>
            <IconButton label="Close" tone={tone} onClick={onClose} className="-mt-1 -mr-2">
              <X className="size-5" />
            </IconButton>
          </div>
          <div className="overflow-y-auto px-6 py-4 sm:px-8">{children}</div>
          {footer && (
            <div
              className={cn(
                'flex flex-col-reverse gap-3 border-t px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-8',
                tone === 'light' ? 'border-ink-900/10' : 'border-white/10',
              )}
            >
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  )
}
