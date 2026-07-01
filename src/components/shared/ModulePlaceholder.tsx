import type { LucideIcon } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'

type ModulePlaceholderProps = {
  title: string
  description: string
  emptyTitle?: string
  emptyDescription?: string
  icon?: LucideIcon
}

export function ModulePlaceholder({
  title,
  description,
  emptyTitle = 'Módulo en preparación',
  emptyDescription = 'La base visual y técnica ya está lista. La funcionalidad específica se sumará en la siguiente fase del MVP.',
  icon,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader description={description} title={title} />
      <Card>
        <CardContent className="pt-5">
          <EmptyState description={emptyDescription} icon={icon} title={emptyTitle} />
        </CardContent>
      </Card>
    </div>
  )
}
