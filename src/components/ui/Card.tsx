import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-[1.25rem] border border-ink-900/[0.08] bg-white', className)} {...rest} />
}
