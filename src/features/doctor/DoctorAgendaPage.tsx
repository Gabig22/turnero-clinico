import { ClipboardList } from 'lucide-react'

import { ModulePlaceholder } from '@/components/shared/ModulePlaceholder'

export function DoctorAgendaPage() {
  return (
    <ModulePlaceholder
      description="Vista de agenda personal del médico, pendiente para una fase posterior."
      icon={ClipboardList}
      title="Mi Agenda"
    />
  )
}
