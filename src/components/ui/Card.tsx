import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-3xl border border-cream-200/70 bg-white shadow-soft', className)} {...rest} />
}
