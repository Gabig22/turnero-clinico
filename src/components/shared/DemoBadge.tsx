import { APP_MODE } from '@/app/config'
import { Badge } from '@/components/ui/badge'
import { useDemoRole } from '@/hooks/useDemoRole'

const roleLabels = {
  admin_general: 'Administrador',
  supervisor: 'Supervisor',
  doctor: 'Médico',
  public: 'Público',
}

export function DemoBadge() {
  const { role } = useDemoRole()
  const appModeLabel = APP_MODE === 'mock' ? 'demo' : APP_MODE

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="info">Modo {appModeLabel}</Badge>
      <Badge variant="muted">Rol: {roleLabels[role]}</Badge>
    </div>
  )
}
