import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'

const ToastContext = createContext<(message: string) => void>(() => undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const show = useCallback((text: string) => {
    setMessage(text)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMessage(null), 2600)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-4"
      >
        {message && (
          <div className="flex items-center gap-2 rounded-full bg-ink-900 px-5 py-3 text-sm font-medium text-white shadow-lift">
            <Check className="size-4 text-brand-400" aria-hidden />
            {message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
