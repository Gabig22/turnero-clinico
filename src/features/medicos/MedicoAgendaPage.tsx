import { CalendarDays } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { ModulePlaceholder } from '@/components/shared/ModulePlaceholder'

export function MedicoAgendaPage() {
  const { id } = useParams()

  return (
    <ModulePlaceholder
      description={`Agenda individual del médico seleccionado. Identificador demo: ${id ?? 'sin definir'}.`}
      icon={CalendarDays}
      title="Agenda del médico"
    />
  )
}
