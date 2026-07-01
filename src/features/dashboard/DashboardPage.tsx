import {
  CalendarPlus,
  ClipboardList,
  Play,
  RotateCcw,
  Stethoscope,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboard, useResetDemoData } from '@/hooks/useDashboard'
import { useSiguienteTurno } from '@/hooks/useTurnos'
import type { Medico, TurnoDetallado, TurnoEstado } from '@/types'

const statusLabels: Record<TurnoEstado, string> = {
  pendiente: 'Pendientes',
  en_atencion: 'En atención',
  finalizado: 'Finalizados',
  cancelado: 'Cancelados',
  pospuesto: 'Pospuestos',
}

export function DashboardPage() {
  const dashboardQuery = useDashboard()
  const siguienteTurno = useSiguienteTurno()
  const resetDemoData = useResetDemoData()
  const dashboard = dashboardQuery.data

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button
              disabled={resetDemoData.isPending}
              onClick={() => resetDemoData.mutate()}
              variant="outline"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Reiniciar demo
            </Button>
            <Link className={buttonVariants()} to="/turnos">
              <CalendarPlus aria-hidden="true" className="h-4 w-4" />
              Nuevo turno
            </Link>
          </>
        }
        description="Resumen operativo del día con datos persistidos en localStorage."
        title="Panel de Control"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard icon={Stethoscope} label="Médicos activos" value={dashboard?.medicosActivos ?? 0} />
        <MetricCard
          icon={UsersRound}
          label="Pacientes hoy"
          value={dashboard?.pacientesConTurnoHoy ?? 0}
        />
        <MetricCard icon={ClipboardList} label="Turnos del día" value={dashboard?.turnosDelDia ?? 0} />
        <MetricCard icon={ClipboardList} label="Pendientes" value={dashboard?.pendientes ?? 0} />
        <MetricCard icon={UserRoundCheck} label="En atención" value={dashboard?.enAtencion ?? 0} />
        <MetricCard icon={UserRoundCheck} label="Finalizados" value={dashboard?.finalizados ?? 0} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Médicos del día</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Agenda resumida de hoy y llamado rápido del siguiente paciente.
          </p>
        </div>

        {dashboardQuery.isLoading ? (
          <EmptyState title="Cargando agenda del día" />
        ) : dashboard?.medicos.length ? (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {dashboard.medicos.map(({ medico, turnos }) => (
              <DoctorCard
                isCalling={siguienteTurno.isPending}
                key={medico.id}
                medico={medico}
                onCallNext={() => siguienteTurno.mutate(medico.id)}
                turnos={turnos}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            description="Revisá el seed demo o reiniciá los datos para volver a cargar médicos."
            title="No hay médicos disponibles para hoy"
          />
        )}
      </section>
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

type DoctorCardProps = {
  medico: Medico
  turnos: TurnoDetallado[]
  isCalling: boolean
  onCallNext: () => void
}

function DoctorCard({ medico, turnos, isCalling, onCallNext }: DoctorCardProps) {
  const counters = {
    pendiente: turnos.filter((turno) => turno.estado === 'pendiente').length,
    en_atencion: turnos.filter((turno) => turno.estado === 'en_atencion').length,
    finalizado: turnos.filter((turno) => turno.estado === 'finalizado').length,
  }
  const hasPending = counters.pendiente > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{medico.nombre}</CardTitle>
            <CardDescription>
              {medico.especialidad} · Consultorio {medico.consultorio}
            </CardDescription>
          </div>
          <span className="rounded-full border border-success/20 bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
            Activo
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          {(['pendiente', 'en_atencion', 'finalizado'] as const).map((estado) => (
            <div className="rounded-md border border-border bg-muted/40 p-3" key={estado}>
              <p className="text-lg font-semibold text-foreground">{counters[estado]}</p>
              <p className="mt-1 text-xs text-muted-foreground">{statusLabels[estado]}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {turnos.slice(0, 5).map((turno) => (
            <div
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
              key={turno.id}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {turno.hora} ·{' '}
                  {turno.paciente
                    ? `${turno.paciente.apellido}, ${turno.paciente.nombre}`
                    : 'Paciente sin datos'}
                </p>
                <p className="truncate text-xs text-muted-foreground">{turno.obra_social}</p>
              </div>
              <StatusBadge estado={turno.estado} />
            </div>
          ))}

          {!turnos.length ? (
            <div className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Sin turnos cargados para hoy.
            </div>
          ) : null}
        </div>

        <Button disabled={isCalling || !hasPending} onClick={onCallNext} variant="outline">
          <Play aria-hidden="true" className="h-4 w-4" />
          Llamar siguiente
        </Button>
      </CardContent>
    </Card>
  )
}
