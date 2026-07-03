import { CalendarDays } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { AgendaMedicoPage } from '@/features/medicos/AgendaMedicoPage'
import { useDoctorDemo } from '@/hooks/useDoctorDemo'

export function DoctorAgendaPage() {
  const { selectedMedicoId, isLoading } = useDoctorDemo()

  if (isLoading) {
    return <EmptyState icon={CalendarDays} title="Cargando agenda médica" />
  }

  if (!selectedMedicoId) {
    return (
      <EmptyState
        description="Seleccioná un médico demo desde el portal médico para ver su agenda."
        icon={CalendarDays}
        title="No hay médico demo seleccionado"
      />
    )
  }

  return <AgendaMedicoPage context="doctor" medicoId={selectedMedicoId} />
}
