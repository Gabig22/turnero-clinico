import { UserRound } from 'lucide-react'

import { ModulePlaceholder } from '@/components/shared/ModulePlaceholder'

export function DoctorHomePage() {
  return (
    <ModulePlaceholder
      description="Placeholder del portal médico. Queda preparada la ruta para simular el rol doctor más adelante."
      icon={UserRound}
      title="Portal Médico"
    />
  )
}
