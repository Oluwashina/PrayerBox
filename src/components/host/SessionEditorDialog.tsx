import type { PrayerSession, SessionDraft } from '@/domain/types'
import { sessionService } from '@/services'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { InlineAlert } from '../ui/States'
import { useToast } from '../ui/Toast'
import { emptyDraft, SessionForm } from '../SessionForm'

interface Props {
  open: boolean
  onClose: () => void
  /** Omit to create a new session. */
  session?: PrayerSession
  onSaved?: (session: PrayerSession) => void
}

export function SessionEditorDialog({ open, onClose, session, onSaved }: Props) {
  const { host } = useAuth()
  const toast = useToast()
  const save = useAsyncAction(async (draft: SessionDraft) =>
    session ? sessionService.update(session.id, draft) : sessionService.create(draft),
  )
  const formId = session ? `edit-${session.id}` : 'new-session'

  const initial: SessionDraft = session
    ? {
        title: session.title,
        description: session.description,
        prayerFocus: session.prayerFocus,
        hostName: session.hostName,
        scheduledStart: session.scheduledStart,
        durationMinutes: session.durationMinutes,
        mode: session.mode,
      }
    : emptyDraft(host?.name)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={session ? 'Edit prayer session' : 'Schedule a prayer session'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={save.pending}>
            {session ? 'Save changes' : 'Schedule session'}
          </Button>
        </>
      }
    >
      {save.error && (
        <InlineAlert tone="danger" className="mb-5" title="Could not save">
          {save.error}
        </InlineAlert>
      )}
      {open && (
        <SessionForm
          key={session?.id ?? 'new'}
          id={formId}
          initial={initial}
          isNew={!session}
          onSubmit={async (draft) => {
            const saved = await save.run(draft)
            if (saved) {
              toast(session ? 'Session updated' : 'Session scheduled')
              onSaved?.(saved)
              onClose()
            }
          }}
        />
      )}
    </Dialog>
  )
}
