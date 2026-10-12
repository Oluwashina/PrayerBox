import { Compass } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/States'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl pt-10">
      <EmptyState
        icon={<Compass className="size-8" />}
        title="This page could not be found"
        body="The link may be incomplete. Head back to see current prayer sessions."
        action={<ButtonLink to="/">Go to home page</ButtonLink>}
      />
    </div>
  )
}
