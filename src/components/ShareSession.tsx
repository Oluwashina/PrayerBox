import { Copy, MessageCircle, Share2 } from 'lucide-react'
import type { PrayerSession } from '@/domain/types'
import { publicShareUrl } from '@/domain/session'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Button } from './ui/Button'
import { useToast } from './ui/Toast'

function shareMessage(session: PrayerSession, url: string) {
  if (session.status === 'live') {
    return `We're live now. Join us in prayer: ${session.title}. Tap to listen (no app needed): ${url}`
  }
  const when = formatDateTime(session.scheduledStart)
  return `Join us in prayer: ${session.title} (${when}). Praying for ${session.prayerFocus.toLowerCase()}. Tap to listen, no app needed: ${url}`
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
  const url = publicShareUrl(session)
  const message = shareMessage(session, url)
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message)}`
  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator

  const copy = async () => {
    const ok = await copyToClipboard(message)
    toast(ok ? 'Message copied' : 'Could not copy. Press and hold the text to copy it.')
  }

  const copyUrlOnly = async () => {
    const ok = await copyToClipboard(url)
    toast(ok ? 'Link copied' : 'Could not copy. Press and hold the link to copy it.')
  }

  const nativeShare = async () => {
    try {
      await navigator.share({
        title: session.status === 'live' ? 'Live prayer' : session.title,
        text: message,
        url,
      })
    } catch {
      // User dismissed the share sheet.
    }
  }

  const variant = tone === 'light' ? 'secondary' : 'onDark'

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <p className={cn('rounded-xl px-4 py-3 text-[0.8125rem] leading-relaxed', tone === 'light' ? 'bg-ink-900/[0.04] text-ink-600' : 'bg-white/[0.06] text-white/70')}>
        {message}
      </p>
      <div className={cn('flex gap-3', layout === 'stack' ? 'flex-col' : 'flex-col sm:flex-row sm:flex-wrap')}>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1d7f47] px-5 text-sm font-medium text-white transition-colors hover:bg-[#186b3c]"
        >
          <MessageCircle className="size-4" aria-hidden />
          Share on WhatsApp
        </a>
        <Button variant={variant} icon={<Copy className="size-4" aria-hidden />} onClick={copy}>
          Copy message
        </Button>
        <Button variant={variant} icon={<Copy className="size-4" aria-hidden />} onClick={copyUrlOnly}>
          Copy link only
        </Button>
        {canNativeShare && (
          <Button variant={variant} icon={<Share2 className="size-4" aria-hidden />} onClick={nativeShare}>
            More options
          </Button>
        )}
      </div>
      {session.status === 'live' && (
        <p className={cn('text-[0.75rem] leading-relaxed', tone === 'light' ? 'text-ink-400' : 'text-white/45')}>
          This link stays the same every time you go live: <span className="font-medium tabular-nums">{url.replace(/^https?:\/\//, '')}</span>
        </p>
      )}
    </div>
  )
}
