import { useQuery } from '@tanstack/react-query'
import { CalendarPlus, ClipboardList, Stethoscope, UserRoundCheck, UsersRound } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { mockApi } from '@/services/mock'

export function DashboardPage() {
  const { data } = useQuery({
    queryKey: ['mock-snapshot'],
    queryFn: mockApi.getSnapshot,
  })

  const medicosActivos = data?.medicos.filter((medico) => medico.activo).length ?? 0
  const pacientesActivos = data?.pacientes.filter((paciente) => paciente.activo).length ?? 0
  const turnosHoy = data?.turnos.length ?? 0
  const turnosFinalizados =
    data?.turnos.filter((turno) => turno.estado === 'finalizado').length ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button disabled variant="outline">
              Reiniciar demo
            </Button>
            <Button disabled>
              <CalendarPlus aria-hidden="true" className="h-4 w-4" />
              Nuevo turno
            </Button>
          </>
        }
        description="Resumen operativo del día. En esta fase queda montada la estructura visual y técnica para construir el MVP."
        title="Panel de Control"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Stethoscope} label="Médicos activos" value={medicosActivos} />
        <MetricCard icon={UsersRound} label="Pacientes activos" value={pacientesActivos} />
        <MetricCard icon={ClipboardList} label="Turnos de hoy" value={turnosHoy} />
        <MetricCard icon={UserRoundCheck} label="Finalizados" value={turnosFinalizados} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Médicos del día</CardTitle>
          <CardDescription>
            Las cards reales de médicos, filtros y acciones se incorporarán en la siguiente fase.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge estado="pendiente" />
            <StatusBadge estado="en_atencion" />
            <StatusBadge estado="finalizado" />
            <StatusBadge estado="cancelado" />
            <StatusBadge estado="pospuesto" />
          </div>
          <EmptyState
            description="Base lista para conectar DoctorCard, filtros y creación de turnos sobre el mock local."
            title="Módulo en preparación"
          />
        </CardContent>
      </Card>
    </div>
  )
}

type MetricCardProps = {
  label: string
  value: number
  icon: typeof Stethoscope
}

function MetricCard({ label, value, icon: Icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
        </div>
        <div className="rounded-lg bg-primary-soft p-3 text-primary">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}
