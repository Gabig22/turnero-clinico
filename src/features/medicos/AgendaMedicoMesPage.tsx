import { CalendarDays } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { ModulePlaceholder } from '@/components/shared/ModulePlaceholder'

export function AgendaMedicoMesPage() {
  const { medicoId } = useParams()

  return (
    <ModulePlaceholder
      description={`Vista mensual preparada para integrar calendario más adelante. Médico demo: ${medicoId ?? 'sin definir'}.`}
      icon={CalendarDays}
      title="Agenda mensual"
    />
  )
}
