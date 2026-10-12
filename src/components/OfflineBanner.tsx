import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div role="status" className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-ink-900 px-4 py-2.5 text-sm text-white">
      <WifiOff className="size-4 text-brand-400" aria-hidden />
      You are offline. We will reconnect when your internet is back.
    </div>
  )
}
