import { Stethoscope } from 'lucide-react'

import { ModulePlaceholder } from '@/components/shared/ModulePlaceholder'

export function MedicosPage() {
  return (
    <ModulePlaceholder
      description="Administración de profesionales, especialidades, consultorios y disponibilidad."
      icon={Stethoscope}
      title="Médicos"
    />
  )
}
