import type { LucideIcon } from 'lucide-react'
import { ClipboardList } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

type EmptyStateProps = {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon = ClipboardList,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center',
        className,
      )}
    >
      <div className="mb-4 rounded-full bg-card p-3 text-primary shadow-sm">
        <Icon aria-hidden="true" className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
