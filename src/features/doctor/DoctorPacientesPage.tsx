import { UsersRound } from 'lucide-react'

import { ModulePlaceholder } from '@/components/shared/ModulePlaceholder'

export function DoctorPacientesPage() {
  return (
    <ModulePlaceholder
      description="Pacientes asociados al médico según historial de turnos, pendiente para una fase posterior."
      icon={UsersRound}
      title="Mis Pacientes"
    />
  )
}
