import { Badge } from '@/components/ui/badge'
import type { TurnoEstado } from '@/types'

const statusConfig: Record<
  TurnoEstado,
  {
    label: string
    variant: 'default' | 'muted' | 'success' | 'warning' | 'info' | 'destructive'
  }
> = {
  pendiente: {
    label: 'Pendiente',
    variant: 'warning',
  },
  en_atencion: {
    label: 'En curso',
    variant: 'info',
  },
  finalizado: {
    label: 'Finalizado',
    variant: 'success',
  },
  cancelado: {
    label: 'Cancelado',
    variant: 'destructive',
  },
  pospuesto: {
    label: 'Pospuesto',
    variant: 'muted',
  },
}

type StatusBadgeProps = {
  estado: TurnoEstado
}

export function StatusBadge({ estado }: StatusBadgeProps) {
  const config = statusConfig[estado]

  return <Badge variant={config.variant}>{config.label}</Badge>
}
