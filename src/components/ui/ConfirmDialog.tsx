import { useState, type ReactNode } from 'react'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { InlineAlert } from './States'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  body: ReactNode
  confirmLabel: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  onConfirm: () => Promise<unknown>
}

export function ConfirmDialog({ open, onClose, title, body, confirmLabel, cancelLabel = 'Go back', tone = 'danger', onConfirm }: Props) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    setPending(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={tone} loading={pending} onClick={confirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-ink-700">{body}</div>
      {error && (
        <InlineAlert tone="danger" className="mt-4">
          {error}
        </InlineAlert>
      )}
    </Dialog>
  )
}
