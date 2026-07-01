import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none',
  {
    variants: {
      variant: {
        default: 'border-primary/20 bg-primary-soft text-primary',
        muted: 'border-border bg-muted text-muted-foreground',
        success: 'border-success/20 bg-success-soft text-success',
        warning: 'border-warning/20 bg-warning-soft text-warning',
        info: 'border-info/20 bg-info-soft text-info',
        destructive: 'border-destructive/20 bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
