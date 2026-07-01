import { UsersRound } from 'lucide-react'

import { ModulePlaceholder } from '@/components/shared/ModulePlaceholder'

export function PacientesPage() {
  return (
    <ModulePlaceholder
      description="Registro de pacientes, obra social, datos de contacto y estado."
      icon={UsersRound}
      title="Pacientes"
    />
  )
}
