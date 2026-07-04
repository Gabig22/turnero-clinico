import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Play,
  Repeat2,
  RotateCcw,
  Stethoscope,
  UserRoundCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboard, useResetDemoData } from '@/hooks/useDashboard'
import { useCambiarEstadoTurno, useRellamarTurno, useSiguienteTurno } from '@/hooks/useTurnos'
import type { Medico, TurnoDetallado, TurnoEstado } from '@/types'

const statusLabels: Record<TurnoEstado, string> = {
  pendiente: 'Pendientes',
  en_atencion: 'En atención',
  finalizado: 'Finalizados',
  cancelado: 'Cancelados',
  pospuesto: 'Pospuestos',
  ausente: 'Ausentes',
  reprogramado: 'Reprogramados',
}

export function DashboardPage() {
  const dashboardQuery = useDashboard()
  const siguienteTurno = useSiguienteTurno()
  const cambiarEstado = useCambiarEstadoTurno()
  const rellamarTurno = useRellamarTurno()
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
            <Link className={buttonVariants()} to="/turnos/calendario">
              <CalendarDays aria-hidden="true" className="h-4 w-4" />
              Calendario
            </Link>
          </>
        }
        description="Resumen operativo del día con datos persistidos en localStorage."
        title="Panel de Control"
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard icon={Stethoscope} label="Médicos activos" value={dashboard?.medicosActivos ?? 0} />
        <MetricCard
          icon={ClipboardList}
          label="Turnos del día"
          subtitle={`${dashboard?.pacientesConTurnoHoy ?? 0} pacientes únicos`}
          value={dashboard?.turnosDelDia ?? 0}
        />
        <MetricCard
          icon={ClipboardList}
          label="Pendientes"
          value={dashboard?.pendientes ?? 0}
          variant="pending"
        />
        <MetricCard
          icon={UserRoundCheck}
          label="En atención"
          value={dashboard?.enAtencion ?? 0}
          variant="active"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Finalizados"
          value={dashboard?.finalizados ?? 0}
          variant="completed"
        />
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
                isMutating={cambiarEstado.isPending || rellamarTurno.isPending}
                key={medico.id}
                medico={medico}
                onCallNext={() => siguienteTurno.mutate(medico.id)}
                onFinishCurrent={(turnoId) =>
                  cambiarEstado.mutate({ id: turnoId, estado: 'finalizado' })
                }
                onRecallCurrent={(turnoId) => rellamarTurno.mutate(turnoId)}
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
  subtitle?: string
  variant?: 'neutral' | 'pending' | 'active' | 'completed'
}

const metricVariantClasses: Record<
  NonNullable<MetricCardProps['variant']>,
  {
    card: string
    icon: string
  }
> = {
  neutral: {
    card: 'border-t-4 border-t-primary/20',
    icon: 'bg-primary-soft text-primary',
  },
  pending: {
    card: 'border-t-4 border-t-warning bg-warning-soft/35',
    icon: 'bg-warning-soft text-warning',
  },
  active: {
    card: 'border-t-4 border-t-info bg-info-soft/35',
    icon: 'bg-info-soft text-info',
  },
  completed: {
    card: 'border-t-4 border-t-success bg-success-soft/35',
    icon: 'bg-success-soft text-success',
  },
}

function MetricCard({ label, value, icon: Icon, subtitle, variant = 'neutral' }: MetricCardProps) {
  const classes = metricVariantClasses[variant]

  return (
    <Card className={classes.card}>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className={`rounded-lg p-3 ${classes.icon}`}>
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
  isMutating: boolean
  onCallNext: () => void
  onRecallCurrent: (turnoId: string) => void
  onFinishCurrent: (turnoId: string) => void
}

function DoctorCard({
  medico,
  turnos,
  isCalling,
  isMutating,
  onCallNext,
  onRecallCurrent,
  onFinishCurrent,
}: DoctorCardProps) {
  const counters = {
    pendiente: turnos.filter((turno) => turno.estado === 'pendiente').length,
    en_atencion: turnos.filter((turno) => turno.estado === 'en_atencion').length,
    finalizado: turnos.filter((turno) => turno.estado === 'finalizado').length,
  }
  const hasPending = counters.pendiente > 0
  const currentTurno = turnos.find((turno) => turno.estado === 'en_atencion')

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
              className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2"
              key={turno.id}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {turno.hora} ·{' '}
                  {turno.paciente
                    ? `${turno.paciente.apellido}, ${turno.paciente.nombre}`
                    : 'Paciente sin datos'}
                </p>
                <p className="truncate text-xs text-muted-foreground">{turno.obra_social}</p>
              </div>
              <div className="shrink-0">
                <StatusBadge estado={turno.estado} />
              </div>
            </div>
          ))}

          {!turnos.length ? (
            <div className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Sin turnos cargados para hoy.
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
            to={`/agenda/${medico.id}`}
          >
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            Ver agenda
          </Link>

          <Button disabled={isCalling || !hasPending} onClick={onCallNext} size="sm" variant="outline">
            <Play aria-hidden="true" className="h-4 w-4" />
            Llamar siguiente
          </Button>

          {currentTurno ? (
            <>
              <Button
                disabled={isMutating}
                onClick={() => onRecallCurrent(currentTurno.id)}
                size="sm"
                variant="outline"
              >
                <Repeat2 aria-hidden="true" className="h-4 w-4" />
                Rellamar actual
              </Button>
              <Button
                disabled={isMutating}
                onClick={() => onFinishCurrent(currentTurno.id)}
                size="sm"
                variant="secondary"
              >
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                Finalizar actual
              </Button>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
