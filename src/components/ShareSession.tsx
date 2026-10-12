import { Copy, MessageCircle, Share2 } from 'lucide-react'
import type { PrayerSession } from '@/domain/types'
import { sessionShareUrl } from '@/domain/session'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Button } from './ui/Button'
import { useToast } from './ui/Toast'

function shareText(session: PrayerSession) {
  const when = session.status === 'live' ? 'Live now' : formatDateTime(session.scheduledStart)
  return `Join us in prayer: ${session.title} (${when}). Praying for ${session.prayerFocus.toLowerCase()}. Tap to listen, no app needed:`
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    el.remove()
    return ok
  }
}

export function ShareSession({
  session,
  layout = 'row',
  tone = 'light',
  className,
}: {
  session: PrayerSession
  layout?: 'row' | 'stack'
  tone?: 'light' | 'dark'
  className?: string
}) {
  const toast = useToast()
  const url = sessionShareUrl(session.id)
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${shareText(session)} ${url}`)}`
  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator

  const copy = async () => {
    const ok = await copyToClipboard(url)
    toast(ok ? 'Link copied' : 'Could not copy. Press and hold the link to copy it.')
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title: session.title, text: shareText(session), url })
    } catch {
      // User dismissed the share sheet.
    }
  }

  const variant = tone === 'light' ? 'secondary' : 'onDark'

  return (
    <div className={cn('flex gap-3', layout === 'stack' ? 'flex-col' : 'flex-col sm:flex-row sm:flex-wrap', className)}>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1f8f4e] px-5 text-[0.95rem] font-semibold text-white hover:bg-[#1a7a43]"
      >
        <MessageCircle className="size-5" aria-hidden />
        Share on WhatsApp
      </a>
      <Button variant={variant} icon={<Copy className="size-5" aria-hidden />} onClick={copy}>
        Copy link
      </Button>
      {canNativeShare && (
        <Button variant={variant} icon={<Share2 className="size-5" aria-hidden />} onClick={nativeShare}>
          More options
        </Button>
      )}
    </div>
  )
}
