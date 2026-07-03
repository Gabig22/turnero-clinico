import {
  CalendarDays,
  CheckCircle2,
  Monitor,
  PhoneCall,
  Repeat2,
  Stethoscope,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDoctorDemo, useDoctorToday } from '@/hooks/useDoctorDemo'
import {
  useCambiarEstadoTurno,
  useRellamarTurno,
} from '@/hooks/useTurnos'
import { formatDateDisplay } from '@/lib/dates/displayDate'
import { isTurnoVencidoPendienteDeCierre } from '@/lib/turnos/status'
import type { TurnoDetallado } from '@/types'

export function DoctorHomePage() {
  const { medicos, selectedMedico, selectedMedicoId, selectMedico, isLoading } = useDoctorDemo()
  const doctorToday = useDoctorToday(selectedMedicoId)
  const cambiarEstado = useCambiarEstadoTurno()
  const rellamarTurno = useRellamarTurno()

  if (isLoading) {
    return <EmptyState icon={Stethoscope} title="Cargando portal médico" />
  }

  if (!medicos.length) {
    return (
      <EmptyState
        description="No hay médicos activos en la demo. Revisá el módulo de médicos o reiniciá los datos demo."
        icon={Stethoscope}
        title="No hay médicos activos"
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link className={buttonVariants({ variant: 'outline' })} to="/doctor/agenda">
              <CalendarDays aria-hidden="true" className="h-4 w-4" />
              Mi agenda
            </Link>
            <Link className={buttonVariants({ variant: 'outline' })} to="/doctor/pacientes">
              <UsersRound aria-hidden="true" className="h-4 w-4" />
              Mis pacientes
            </Link>
            <Link className={buttonVariants({ variant: 'outline' })} to="/turnero">
              <Monitor aria-hidden="true" className="h-4 w-4" />
              Ver turnero
            </Link>
          </>
        }
        description="Vista operativa del médico seleccionado en modo demo."
        title="Portal Médico"
      />

      <Card>
        <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Médico actual</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {selectedMedico?.nombre ?? 'Sin médico seleccionado'}
            </h2>
            {selectedMedico ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="info">{selectedMedico.especialidad}</Badge>
                <Badge variant="muted">Consultorio {selectedMedico.consultorio}</Badge>
                <Badge variant={selectedMedico.activo ? 'success' : 'muted'}>
                  {selectedMedico.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            ) : null}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">
              Médico demo
            </span>
            <select
              className="form-input"
              onChange={(event) => selectMedico(event.target.value)}
              value={selectedMedicoId}
            >
              {medicos.map((medico) => (
                <option key={medico.id} value={medico.id}>
                  {medico.nombre} - {medico.especialidad}
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Turnos del día" value={doctorToday.metrics.total} />
        <MetricCard label="Pendientes" value={doctorToday.metrics.pendiente} variant="pending" />
        <MetricCard label="En atención" value={doctorToday.metrics.en_atencion} variant="active" />
        <MetricCard label="Finalizados" value={doctorToday.metrics.finalizado} variant="completed" />
        <MetricCard label="Vencidos" value={doctorToday.metrics.vencidos} variant="expired" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Turnos de hoy</CardTitle>
        </CardHeader>
        <CardContent>
          {doctorToday.isLoading ? (
            <EmptyState icon={CalendarDays} title="Cargando turnos de hoy" />
          ) : doctorToday.turnosHoy.length ? (
            <div className="grid gap-3">
              {doctorToday.turnosHoy.map((turno) => (
                <TurnoDoctorCard
                  isChanging={cambiarEstado.isPending}
                  isRecalling={rellamarTurno.isPending}
                  key={turno.id}
                  onAbsent={() => cambiarEstado.mutate({ id: turno.id, estado: 'ausente' })}
                  onFinish={() => cambiarEstado.mutate({ id: turno.id, estado: 'finalizado' })}
                  onRecall={() => rellamarTurno.mutate(turno.id)}
                  onReprogram={() =>
                    cambiarEstado.mutate({ id: turno.id, estado: 'reprogramado' })
                  }
                  onStart={() => cambiarEstado.mutate({ id: turno.id, estado: 'en_atencion' })}
                  turno={turno}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              description={`No hay turnos cargados para ${formatDateDisplay(doctorToday.fechaHoy)}.`}
              icon={CalendarDays}
              title="Sin turnos para hoy"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

type MetricCardProps = {
  label: string
  value: number
  variant?: 'neutral' | 'pending' | 'active' | 'completed' | 'expired'
}

const metricClasses: Record<NonNullable<MetricCardProps['variant']>, string> = {
  neutral: 'border-t-4 border-t-primary/20',
  pending: 'border-t-4 border-t-warning bg-warning-soft/35',
  active: 'border-t-4 border-t-info bg-info-soft/35',
  completed: 'border-t-4 border-t-success bg-success-soft/35',
  expired: 'border-t-4 border-t-destructive bg-destructive/5',
}

function MetricCard({ label, value, variant = 'neutral' }: MetricCardProps) {
  return (
    <Card className={metricClasses[variant]}>
      <CardContent className="p-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}

type TurnoDoctorCardProps = {
  turno: TurnoDetallado
  isChanging: boolean
  isRecalling: boolean
  onStart: () => void
  onRecall: () => void
  onFinish: () => void
  onAbsent: () => void
  onReprogram: () => void
}

function TurnoDoctorCard({
  turno,
  isChanging,
  isRecalling,
  onStart,
  onRecall,
  onFinish,
  onAbsent,
  onReprogram,
}: TurnoDoctorCardProps) {
  const isExpiredOpen = isTurnoVencidoPendienteDeCierre(turno)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">{turno.hora}</span>
          <StatusBadge estado={turno.estado} />
          {isExpiredOpen ? <Badge variant="destructive">Pendiente de cierre</Badge> : null}
        </div>
        <p className="mt-2 text-sm font-semibold text-foreground">
          {turno.paciente
            ? `${turno.paciente.apellido}, ${turno.paciente.nombre}`
            : 'Paciente sin datos'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{turno.obra_social}</p>
      </div>

      <div className="flex flex-wrap gap-2 md:justify-end">
        {isExpiredOpen ? (
          <>
            <Button disabled={isChanging} onClick={onAbsent} size="sm" variant="outline">
              <XCircle aria-hidden="true" className="h-4 w-4" />
              Ausente
            </Button>
            <Button disabled={isChanging} onClick={onFinish} size="sm" variant="secondary">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              Finalizar
            </Button>
            <Button disabled={isChanging} onClick={onReprogram} size="sm" variant="outline">
              <Repeat2 aria-hidden="true" className="h-4 w-4" />
              Reprogramar
            </Button>
          </>
        ) : null}

        {!isExpiredOpen && turno.estado === 'pendiente' ? (
          <Button disabled={isChanging} onClick={onStart} size="sm" variant="outline">
            <PhoneCall aria-hidden="true" className="h-4 w-4" />
            Llamar
          </Button>
        ) : null}

        {!isExpiredOpen && turno.estado === 'en_atencion' ? (
          <>
            <Button disabled={isRecalling} onClick={onRecall} size="sm" variant="outline">
              <Repeat2 aria-hidden="true" className="h-4 w-4" />
              Rellamar
            </Button>
            <Button disabled={isChanging} onClick={onFinish} size="sm" variant="secondary">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              Finalizar
            </Button>
          </>
        ) : null}
      </div>
    </div>
  )
}
