import { Settings } from 'lucide-react'

import { ModulePlaceholder } from '@/components/shared/ModulePlaceholder'

export function ConfiguracionPage() {
  return (
    <ModulePlaceholder
      description="Parámetros del demo, obras sociales, turnero y reinicio de datos."
      icon={Settings}
      title="Configuración"
    />
  )
}
