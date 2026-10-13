import { ArrowRight } from 'lucide-react'
import { Eyebrow } from '@/components/layout/PageChrome'
import { ButtonLink } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl py-24 text-center sm:py-32">
      <Eyebrow className="justify-center">Error 404</Eyebrow>
      <h1 className="mt-6 text-[3rem] leading-none sm:text-[4.5rem]">
        This page has <em className="text-plum-600">wandered.</em>
      </h1>
      <p className="mx-auto mt-6 max-w-md text-[1.0625rem] leading-relaxed text-ink-500">
        The link may be incomplete. Head back to see current times of prayer.
      </p>
      <ButtonLink to="/" size="lg" className="mt-10">
        Return home <ArrowRight className="size-4" aria-hidden />
      </ButtonLink>
    </div>
  )
}
