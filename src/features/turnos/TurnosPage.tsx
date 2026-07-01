import { CalendarClock } from 'lucide-react'

import { ModulePlaceholder } from '@/components/shared/ModulePlaceholder'

export function TurnosPage() {
  return (
    <ModulePlaceholder
      description="Listado, filtros y acciones principales para gestionar turnos clínicos."
      icon={CalendarClock}
      title="Turnos"
    />
  )
}
