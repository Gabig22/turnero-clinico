import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  PhoneCall,
  Plus,
  Repeat2,
  Stethoscope,
  UserX,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PosponerTurnoModal } from '@/components/turnos/PosponerTurnoModal'
import { ReprogramarTurnoModal } from '@/components/turnos/ReprogramarTurnoModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDoctorDemo, useDoctorToday } from '@/hooks/useDoctorDemo'
import {
  useCambiarEstadoTurno,
  useCancelarTurno,
  useConfirmarConflictoTurno,
  useMarcarAusenteTurno,
  usePosponerTurno,
  useRellamarTurno,
  useReprogramarTurno,
  useSiguienteTurno,
} from '@/hooks/useTurnos'
import { formatDateDisplay } from '@/lib/dates/displayDate'
import { formatConsultorioCompact } from '@/lib/utils/consultorio'
import type { Medico, TurnoDetallado } from '@/types'

export function DoctorHomePage() {
  const [reprogrammingTurno, setReprogrammingTurno] = useState<TurnoDetallado | null>(null)
  const [postponingTurno, setPostponingTurno] = useState<TurnoDetallado | null>(null)
  const { medicos, selectedMedico, selectedMedicoId, selectMedico, isLoading } = useDoctorDemo()
  const doctorToday = useDoctorToday(selectedMedicoId)
  const cambiarEstado = useCambiarEstadoTurno()
  const cancelarTurno = useCancelarTurno()
  const confirmarConflictoTurno = useConfirmarConflictoTurno()
  const marcarAusente = useMarcarAusenteTurno()
  const posponerTurno = usePosponerTurno()
  const rellamarTurno = useRellamarTurno()
  const reprogramarTurno = useReprogramarTurno()
  const siguienteTurno = useSiguienteTurno()
  const turnosHoy = useMemo(
    () => [...doctorToday.turnosHoy].sort((a, b) => a.hora.localeCompare(b.hora)),
    [doctorToday.turnosHoy],
  )
  const turnoEnAtencion = turnosHoy.find((turno) => turno.estado === 'en_atencion') ?? null
  const turnosPendientes = turnosHoy.filter((turno) => turno.estado === 'pendiente')
  const proximoTurno = turnosPendientes[0] ?? null
  const proximosTurnos = turnoEnAtencion ? turnosPendientes.slice(0, 5) : turnosPendientes.slice(1, 5)
  const isChanging =
    cambiarEstado.isPending ||
    siguienteTurno.isPending ||
    cancelarTurno.isPending ||
    marcarAusente.isPending ||
    posponerTurno.isPending ||
    reprogramarTurno.isPending

  const llamarSiguiente = () => {
    if (selectedMedicoId) {
      siguienteTurno.mutate(selectedMedicoId)
    }
  }

  const cancelar = (turno: TurnoDetallado) => {
    if (window.confirm(`¿Querés cancelar el turno de ${getPacienteDisplay(turno)}?`)) {
      cancelarTurno.mutate(turno.id)
    }
  }

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
      <DoctorPortalHeader
        medicos={medicos}
        selectedMedico={selectedMedico}
        selectedMedicoId={selectedMedicoId}
        selectMedico={selectMedico}
      />

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-3 border-b border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">Turnos de Hoy</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Atención diaria del médico seleccionado.
            </p>
          </div>
          <Badge variant="muted">{formatDoctorDateBadge()}</Badge>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          {doctorToday.isLoading ? (
            <EmptyState icon={CalendarDays} title="Cargando turnos de hoy" />
          ) : turnosHoy.length ? (
            <>
              {turnoEnAtencion ? (
                <TurnoEnAtencionCard
                  isChanging={isChanging}
                  isRecalling={rellamarTurno.isPending}
                  onAbsent={() => marcarAusente.mutate(turnoEnAtencion.id)}
                  onFinish={() =>
                    cambiarEstado.mutate({ id: turnoEnAtencion.id, estado: 'finalizado' })
                  }
                  onNext={llamarSiguiente}
                  onPostpone={() => setPostponingTurno(turnoEnAtencion)}
                  onRecall={() => rellamarTurno.mutate(turnoEnAtencion.id)}
                  onReprogram={() => setReprogrammingTurno(turnoEnAtencion)}
                  turno={turnoEnAtencion}
                />
              ) : proximoTurno ? (
                <ListoParaLlamarCard
                  isChanging={isChanging}
                  onAbsent={() => marcarAusente.mutate(proximoTurno.id)}
                  onNext={llamarSiguiente}
                  onPostpone={() => setPostponingTurno(proximoTurno)}
                  onReprogram={() => setReprogrammingTurno(proximoTurno)}
                  turno={proximoTurno}
                />
              ) : (
                <EmptyState
                  description="No hay turnos pendientes para hoy."
                  icon={CalendarDays}
                  title="Agenda al día"
                />
              )}

              <ProximosTurnosSection
                isChanging={isChanging}
                onAbsent={(turno) => marcarAusente.mutate(turno.id)}
                onCancel={cancelar}
                onPostpone={(turno) => setPostponingTurno(turno)}
                onReprogram={(turno) => setReprogrammingTurno(turno)}
                onStart={(turno) => cambiarEstado.mutate({ id: turno.id, estado: 'en_atencion' })}
                turnos={proximosTurnos}
              />

              {doctorToday.vencidosPendientes.length ? (
                <TurnosVencidosSection
                  isChanging={isChanging}
                  onAbsent={(turno) => marcarAusente.mutate(turno.id)}
                  onFinish={(turno) => cambiarEstado.mutate({ id: turno.id, estado: 'finalizado' })}
                  onReprogram={(turno) => setReprogrammingTurno(turno)}
                  turnos={doctorToday.vencidosPendientes.slice(0, 4)}
                />
              ) : null}
            </>
          ) : (
            <EmptyState
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Link className={buttonVariants()} to="/doctor/agenda">
                    <Plus aria-hidden="true" className="h-4 w-4" />
                    Nuevo turno
                  </Link>
                  <Link className={buttonVariants({ variant: 'outline' })} to="/doctor/agenda">
                    <CalendarDays aria-hidden="true" className="h-4 w-4" />
                    Ir a mi agenda
                  </Link>
                </div>
              }
              description={`No hay turnos cargados para ${formatDateDisplay(doctorToday.fechaHoy)}.`}
              icon={CalendarDays}
              title="Sin turnos para hoy"
            />
          )}
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Turnos del día" value={doctorToday.metrics.total} />
        <MetricCard label="Pendientes" value={doctorToday.metrics.pendiente} variant="pending" />
        <MetricCard label="En atención" value={doctorToday.metrics.en_atencion} variant="active" />
        <MetricCard label="Finalizados" value={doctorToday.metrics.finalizado} variant="completed" />
      </section>

      <ReprogramarTurnoModal
        isSaving={reprogramarTurno.isPending}
        onClose={() => setReprogrammingTurno(null)}
        onSubmit={async (input) => {
          if (!reprogrammingTurno) {
            return
          }

          const shouldSave = await confirmarConflictoTurno({
            medico_id: reprogrammingTurno.medico_id,
            fecha: input.fecha,
            hora: input.hora,
            excludeId: reprogrammingTurno.id,
          })

          if (!shouldSave) {
            return
          }

          reprogramarTurno.mutate(
            { id: reprogrammingTurno.id, input },
            { onSuccess: () => setReprogrammingTurno(null) },
          )
        }}
        turno={reprogrammingTurno}
      />

      <PosponerTurnoModal
        isSaving={posponerTurno.isPending}
        onClose={() => setPostponingTurno(null)}
        onSubmit={(input) => {
          if (!postponingTurno) {
            return
          }

          posponerTurno.mutate(
            { id: postponingTurno.id, input },
            { onSuccess: () => setPostponingTurno(null) },
          )
        }}
        turno={postponingTurno}
      />
    </div>
  )
}

type DoctorPortalHeaderProps = {
  medicos: Medico[]
  selectedMedico: Medico | null
  selectedMedicoId: string
  selectMedico: (medicoId: string) => void
}

function DoctorPortalHeader({
  medicos,
  selectedMedico,
  selectedMedicoId,
  selectMedico,
}: DoctorPortalHeaderProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-clinical">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">Modo demo</Badge>
              {selectedMedico ? <Badge variant="muted">{selectedMedico.especialidad}</Badge> : null}
              {selectedMedico ? (
                <Badge variant="muted">{formatConsultorioCompact(selectedMedico.consultorio)}</Badge>
              ) : null}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground">
              Portal del Médico
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              Bienvenido, {selectedMedico?.nombre ?? 'médico demo'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end md:pt-8">
            <Link className={buttonVariants({ variant: 'outline' })} to="/doctor/agenda">
              <CalendarDays aria-hidden="true" className="h-4 w-4" />
              Agenda
            </Link>
            <Link className={buttonVariants({ variant: 'outline' })} to="/doctor/pacientes">
              <UsersRound aria-hidden="true" className="h-4 w-4" />
              Pacientes
            </Link>
          </div>
        </div>

        <label className="block max-w-sm">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Médico demo</span>
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
      </div>
    </section>
  )
}

type MetricCardProps = {
  label: string
  value: number
  variant?: 'neutral' | 'pending' | 'active' | 'completed'
}

const metricClasses: Record<NonNullable<MetricCardProps['variant']>, string> = {
  neutral: 'border-t-4 border-t-primary/20',
  pending: 'border-t-4 border-t-warning bg-warning-soft/30',
  active: 'border-t-4 border-t-info bg-info-soft/30',
  completed: 'border-t-4 border-t-success bg-success-soft/30',
}

function MetricCard({ label, value, variant = 'neutral' }: MetricCardProps) {
  return (
    <Card className={metricClasses[variant]}>
      <CardContent className="p-3.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1.5 text-xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}

type TurnoEnAtencionCardProps = {
  turno: TurnoDetallado
  isChanging: boolean
  isRecalling: boolean
  onNext: () => void
  onRecall: () => void
  onFinish: () => void
  onPostpone: () => void
  onReprogram: () => void
  onAbsent: () => void
}

function TurnoEnAtencionCard({
  turno,
  isChanging,
  isRecalling,
  onNext,
  onRecall,
  onFinish,
  onPostpone,
  onReprogram,
  onAbsent,
}: TurnoEnAtencionCardProps) {
  return (
    <section className="rounded-lg border border-info/25 bg-info-soft/55 p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge estado={turno.estado} />
            <Badge variant="muted">{turno.hora}</Badge>
            {turno.obra_social ? <Badge variant="muted">{turno.obra_social}</Badge> : null}
          </div>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-foreground">
            {getPacienteDisplay(turno)}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">DNI {turno.paciente?.dni ?? '-'}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
          <Button disabled={isChanging} onClick={onNext}>
            <PhoneCall aria-hidden="true" className="h-4 w-4" />
            Siguiente turno
          </Button>
          <Button disabled={isRecalling} onClick={onRecall} variant="outline">
            <Repeat2 aria-hidden="true" className="h-4 w-4" />
            Rellamar turno
          </Button>
          <Button disabled={isChanging} onClick={onFinish} variant="secondary">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            Finalizar
          </Button>
          <Button disabled={isChanging} onClick={onPostpone} variant="outline">
            <Clock3 aria-hidden="true" className="h-4 w-4" />
            Posponer
          </Button>
          <Button disabled={isChanging} onClick={onReprogram} variant="outline">
            <CalendarClock aria-hidden="true" className="h-4 w-4" />
            Reprogramar
          </Button>
          <Button disabled={isChanging} onClick={onAbsent} variant="ghost">
            <UserX aria-hidden="true" className="h-4 w-4" />
            Ausente
          </Button>
        </div>
      </div>
    </section>
  )
}

type ListoParaLlamarCardProps = {
  turno: TurnoDetallado
  isChanging: boolean
  onNext: () => void
  onPostpone: () => void
  onReprogram: () => void
  onAbsent: () => void
}

function ListoParaLlamarCard({
  turno,
  isChanging,
  onNext,
  onPostpone,
  onReprogram,
  onAbsent,
}: ListoParaLlamarCardProps) {
  return (
    <section className="rounded-lg border border-warning/35 bg-warning-soft/60 p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Badge variant="warning">Listo para llamar</Badge>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-foreground">
            {getPacienteDisplay(turno)}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {turno.hora} · DNI {turno.paciente?.dni ?? '-'} · {turno.obra_social}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
          <Button disabled={isChanging} onClick={onNext}>
            <PhoneCall aria-hidden="true" className="h-4 w-4" />
            Llamar siguiente
          </Button>
          <Button disabled={isChanging} onClick={onPostpone} variant="outline">
            <Clock3 aria-hidden="true" className="h-4 w-4" />
            Posponer
          </Button>
          <Button disabled={isChanging} onClick={onReprogram} variant="outline">
            <CalendarClock aria-hidden="true" className="h-4 w-4" />
            Reprogramar
          </Button>
          <Button disabled={isChanging} onClick={onAbsent} variant="ghost">
            <UserX aria-hidden="true" className="h-4 w-4" />
            Ausente
          </Button>
        </div>
      </div>
    </section>
  )
}

type ProximosTurnosSectionProps = {
  turnos: TurnoDetallado[]
  isChanging: boolean
  onStart: (turno: TurnoDetallado) => void
  onAbsent: (turno: TurnoDetallado) => void
  onCancel: (turno: TurnoDetallado) => void
  onPostpone: (turno: TurnoDetallado) => void
  onReprogram: (turno: TurnoDetallado) => void
}

function ProximosTurnosSection({
  turnos,
  isChanging,
  onStart,
  onAbsent,
  onCancel,
  onPostpone,
  onReprogram,
}: ProximosTurnosSectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Próximos</h3>
        <span className="text-xs text-muted-foreground">Hasta 5 turnos pendientes</span>
      </div>
      {turnos.length ? (
        <div className="grid gap-2">
          {turnos.map((turno) => (
            <TurnoPendienteRow
              isChanging={isChanging}
              key={turno.id}
              onAbsent={() => onAbsent(turno)}
              onCancel={() => onCancel(turno)}
              onPostpone={() => onPostpone(turno)}
              onReprogram={() => onReprogram(turno)}
              onStart={() => onStart(turno)}
              turno={turno}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-border bg-muted/25 px-4 py-4 text-sm text-muted-foreground">
          No hay más turnos pendientes para hoy.
        </p>
      )}
    </section>
  )
}

type TurnoPendienteRowProps = {
  turno: TurnoDetallado
  isChanging: boolean
  onStart: () => void
  onAbsent: () => void
  onCancel: () => void
  onPostpone: () => void
  onReprogram: () => void
}

function TurnoPendienteRow({
  turno,
  isChanging,
  onStart,
  onAbsent,
  onCancel,
  onPostpone,
  onReprogram,
}: TurnoPendienteRowProps) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="grid min-w-0 gap-3 sm:grid-cols-[72px_1fr] sm:items-center">
        <p className="text-base font-semibold text-foreground">{turno.hora}</p>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{getPacienteDisplay(turno)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{turno.obra_social}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <StatusBadge estado={turno.estado} />
        <Button disabled={isChanging} onClick={onStart} size="sm" variant="outline">
          <PhoneCall aria-hidden="true" className="h-4 w-4" />
          Llamar
        </Button>
        <Button disabled={isChanging} onClick={onPostpone} size="sm" variant="outline">
          <Clock3 aria-hidden="true" className="h-4 w-4" />
          Posponer
        </Button>
        <Button disabled={isChanging} onClick={onReprogram} size="sm" variant="outline">
          <CalendarClock aria-hidden="true" className="h-4 w-4" />
          Reprogramar
        </Button>
        <Button disabled={isChanging} onClick={onAbsent} size="sm" variant="ghost">
          <UserX aria-hidden="true" className="h-4 w-4" />
          Ausente
        </Button>
        <Button disabled={isChanging} onClick={onCancel} size="sm" variant="ghost">
          <XCircle aria-hidden="true" className="h-4 w-4" />
          Cancelar
        </Button>
      </div>
    </div>
  )
}

type TurnosVencidosSectionProps = {
  turnos: TurnoDetallado[]
  isChanging: boolean
  onAbsent: (turno: TurnoDetallado) => void
  onFinish: (turno: TurnoDetallado) => void
  onReprogram: (turno: TurnoDetallado) => void
}

function TurnosVencidosSection({
  turnos,
  isChanging,
  onAbsent,
  onFinish,
  onReprogram,
}: TurnosVencidosSectionProps) {
  return (
    <section className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
      <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
        Pendientes de cierre
      </h3>
      <div className="mt-3 grid gap-2">
        {turnos.map((turno) => (
          <div
            className="flex flex-col gap-3 rounded-md border border-border bg-card px-4 py-3 md:flex-row md:items-center md:justify-between"
            key={turno.id}
          >
            <div>
              <p className="text-sm font-semibold text-foreground">
                {getPacienteDisplay(turno)} · {formatDateDisplay(turno.fecha)} · {turno.hora}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{turno.obra_social}</p>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Button disabled={isChanging} onClick={() => onAbsent(turno)} size="sm" variant="outline">
                <UserX aria-hidden="true" className="h-4 w-4" />
                Ausente
              </Button>
              <Button disabled={isChanging} onClick={() => onFinish(turno)} size="sm" variant="secondary">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                Finalizar
              </Button>
              <Button
                disabled={isChanging}
                onClick={() => onReprogram(turno)}
                size="sm"
                variant="outline"
              >
                <CalendarClock aria-hidden="true" className="h-4 w-4" />
                Reprogramar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function getPacienteDisplay(turno: TurnoDetallado) {
  return turno.paciente
    ? `${turno.paciente.apellido}, ${turno.paciente.nombre}`
    : 'Paciente sin datos'
}

function formatDoctorDateBadge(date = new Date()) {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date)
}
