import {
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  Clock3,
  Plus,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AgendaMensualCalendar } from '@/components/turnos/AgendaMensualCalendar'
import { PosponerTurnoModal } from '@/components/turnos/PosponerTurnoModal'
import { ReprogramarTurnoModal } from '@/components/turnos/ReprogramarTurnoModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useMedicos } from '@/hooks/useMedicos'
import { usePacientes } from '@/hooks/usePacientes'
import { useAppSettings } from '@/hooks/useSettings'
import {
  useActualizarTurno,
  useCambiarEstadoTurno,
  useCancelarTurno,
  useConfirmarConflictoTurno,
  useCrearTurno,
  useMarcarAusenteTurno,
  usePosponerTurno,
  useRellamarTurno,
  useReprogramarTurno,
  useTurnos,
} from '@/hooks/useTurnos'
import { formatDateDisplay } from '@/lib/dates/displayDate'
import { generateTimeOptions } from '@/lib/dates/timeSlots'
import { DEFAULT_APP_SETTINGS } from '@/lib/storage/settingsStorage'
import { isTurnoVencidoPendienteDeCierre, turnoEstadoOptions } from '@/lib/turnos/status'
import { formatConsultorioCompact } from '@/lib/utils/consultorio'
import type { TurnoDetallado, TurnoEstado } from '@/types'

import { TurnoActions, TurnoFormDialog } from './TurnosPage'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function TurnosCalendarioPage() {
  const turnosDelDiaRef = useRef<HTMLDivElement | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayKey())
  const [medicoId, setMedicoId] = useState('')
  const [estado, setEstado] = useState<TurnoEstado | 'todos'>('todos')
  const [obraSocial, setObraSocial] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTurno, setEditingTurno] = useState<TurnoDetallado | null>(null)
  const [reprogrammingTurno, setReprogrammingTurno] = useState<TurnoDetallado | null>(null)
  const [postponingTurno, setPostponingTurno] = useState<TurnoDetallado | null>(null)
  const filters = useMemo(
    () => ({
      estado,
      medico_id: medicoId,
      obra_social: obraSocial,
    }),
    [estado, medicoId, obraSocial],
  )
  const turnosQuery = useTurnos(filters)
  const medicosQuery = useMedicos()
  const pacientesQuery = usePacientes()
  const appSettingsQuery = useAppSettings()
  const crearTurno = useCrearTurno()
  const actualizarTurno = useActualizarTurno()
  const cambiarEstado = useCambiarEstadoTurno()
  const cancelarTurno = useCancelarTurno()
  const confirmarConflictoTurno = useConfirmarConflictoTurno()
  const marcarAusente = useMarcarAusenteTurno()
  const posponerTurno = usePosponerTurno()
  const rellamarTurno = useRellamarTurno()
  const reprogramarTurno = useReprogramarTurno()
  const turnos = useMemo(() => turnosQuery.data ?? [], [turnosQuery.data])
  const turnosDelDia = useMemo(
    () =>
      turnos
        .filter((turno) => turno.fecha === selectedDate)
        .sort((a, b) => a.hora.localeCompare(b.hora)),
    [selectedDate, turnos],
  )
  const appSettings = appSettingsQuery.data ?? DEFAULT_APP_SETTINGS
  const obrasSociales = useMemo(() => {
    const fromSettings = appSettings.obrasSociales
    const fromPacientes = pacientesQuery.data?.map((paciente) => paciente.obra_social) ?? []
    const fromTurnos = turnos.map((turno) => turno.obra_social)

    return Array.from(new Set([...fromSettings, ...fromPacientes, ...fromTurnos])).sort((a, b) =>
      a.localeCompare(b, 'es'),
    )
  }, [appSettings.obrasSociales, pacientesQuery.data, turnos])
  const timeOptions = useMemo(
    () =>
      generateTimeOptions(
        appSettings.horarioInicio,
        appSettings.horarioFin,
        appSettings.slotDuracion,
      ),
    [appSettings.horarioFin, appSettings.horarioInicio, appSettings.slotDuracion],
  )

  const openCreateForm = () => {
    setEditingTurno(null)
    setIsFormOpen(true)
  }

  const selectDateAndScrollToTurnos = (date: string) => {
    setSelectedDate(date)
    window.requestAnimationFrame(() => {
      turnosDelDiaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const openEditForm = (turno: TurnoDetallado) => {
    setSelectedDate(turno.fecha)
    setEditingTurno(turno)
    setIsFormOpen(true)
  }

  const cancelTurno = (turno: TurnoDetallado) => {
    const paciente = turno.paciente
      ? `${turno.paciente.apellido}, ${turno.paciente.nombre}`
      : 'este paciente'

    if (window.confirm(`¿Querés cancelar el turno de ${paciente}?`)) {
      cancelarTurno.mutate(turno.id)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link className={buttonVariants({ variant: 'outline' })} to="/turnos">
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Volver a Turnos
            </Link>
            <Button onClick={openCreateForm}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              Nuevo turno
            </Button>
          </>
        }
        description="Vista mensual general de turnos de la clínica."
        title="Calendario de Turnos"
      />

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-3 md:p-5">
          <select
            className="form-input"
            onChange={(event) => setMedicoId(event.target.value)}
            value={medicoId}
          >
            <option value="">Todos los médicos</option>
            {(medicosQuery.data ?? []).map((medico) => (
              <option key={medico.id} value={medico.id}>
                {medico.nombre} · {formatConsultorioCompact(medico.consultorio)}
              </option>
            ))}
          </select>

          <select
            className="form-input"
            onChange={(event) => setEstado(event.target.value as TurnoEstado | 'todos')}
            value={estado}
          >
            <option value="todos">Todos los estados</option>
            {turnoEstadoOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className="form-input"
            onChange={(event) => setObraSocial(event.target.value)}
            value={obraSocial}
          >
            <option value="">Todas las obras sociales</option>
            {obrasSociales.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Vista mensual</CardTitle>
            <CardDescription>
              Hacé click o doble click en un día para seleccionar fecha; tocá un turno para editarlo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AgendaMensualCalendar
              isLoading={turnosQuery.isLoading}
              onDateDoubleClick={selectDateAndScrollToTurnos}
              onSelectDate={setSelectedDate}
              onSelectTurno={openEditForm}
              selectedDate={selectedDate}
              turnos={turnos}
            />
          </CardContent>
        </Card>

        <div className="scroll-mt-24" ref={turnosDelDiaRef} />

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Turnos del {formatDateDisplay(selectedDate)}</CardTitle>
              <CardDescription>
                {turnosDelDia.length
                  ? `${turnosDelDia.length} turnos cargados para esta fecha.`
                  : 'No hay turnos cargados para esta fecha.'}
              </CardDescription>
            </div>
            <Button onClick={openCreateForm} size="sm" variant="outline">
              <CalendarPlus aria-hidden="true" className="h-4 w-4" />
              Nuevo turno
            </Button>
          </CardHeader>
          <CardContent>
            {turnosQuery.isLoading ? (
              <EmptyState icon={CalendarDays} title="Cargando turnos" />
            ) : turnosDelDia.length ? (
              <div className="space-y-2">
                {turnosDelDia.map((turno) => (
                  <TurnoDiaCard
                    isChanging={cambiarEstado.isPending}
                    isMarkingAbsent={marcarAusente.isPending}
                    isPostponing={posponerTurno.isPending}
                    isRecalling={rellamarTurno.isPending}
                    isReprogramming={reprogramarTurno.isPending}
                    key={turno.id}
                    onAbsent={() => marcarAusente.mutate(turno.id)}
                    onCancel={() => cancelTurno(turno)}
                    onEdit={() => openEditForm(turno)}
                    onFinish={() =>
                      cambiarEstado.mutate({ id: turno.id, estado: 'finalizado' })
                    }
                    onPostpone={() => setPostponingTurno(turno)}
                    onRecall={() => rellamarTurno.mutate(turno.id)}
                    onReprogram={() => setReprogrammingTurno(turno)}
                    onStart={() => cambiarEstado.mutate({ id: turno.id, estado: 'en_atencion' })}
                    onStatusChange={(nextEstado) => {
                      if (nextEstado === 'ausente') {
                        marcarAusente.mutate(turno.id)
                        return
                      }

                      cambiarEstado.mutate({ id: turno.id, estado: nextEstado })
                    }}
                    turno={turno}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                action={
                  <Button onClick={openCreateForm}>
                    <Plus aria-hidden="true" className="h-4 w-4" />
                    Nuevo turno
                  </Button>
                }
                description="Seleccioná Nuevo turno para cargar uno con esta fecha preseleccionada."
                icon={CalendarDays}
                title="No hay turnos cargados para esta fecha"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {isFormOpen ? (
        <TurnoFormDialog
          defaultFecha={selectedDate}
          isSaving={crearTurno.isPending || actualizarTurno.isPending}
          medicos={medicosQuery.data ?? []}
          obrasSociales={obrasSociales}
          onClose={() => setIsFormOpen(false)}
          onSubmit={async (values) => {
            const shouldSave = await confirmarConflictoTurno({
              medico_id: values.medico_id,
              fecha: values.fecha,
              hora: values.hora,
              excludeId: editingTurno?.id,
            })

            if (!shouldSave) {
              return
            }

            if (editingTurno) {
              actualizarTurno.mutate(
                { id: editingTurno.id, input: values },
                { onSuccess: () => setIsFormOpen(false) },
              )
              return
            }

            crearTurno.mutate(values, { onSuccess: () => setIsFormOpen(false) })
          }}
          pacientes={pacientesQuery.data ?? []}
          slotDuracion={appSettings.slotDuracion}
          timeOptions={timeOptions}
          turno={editingTurno}
        />
      ) : null}

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

type TurnoDiaCardProps = {
  turno: TurnoDetallado
  isChanging: boolean
  isMarkingAbsent: boolean
  isPostponing: boolean
  isRecalling: boolean
  isReprogramming: boolean
  onStart: () => void
  onRecall: () => void
  onFinish: () => void
  onAbsent: () => void
  onPostpone: () => void
  onReprogram: () => void
  onEdit: () => void
  onCancel: () => void
  onStatusChange: (estado: TurnoEstado) => void
}

function TurnoDiaCard({
  turno,
  isChanging,
  isMarkingAbsent,
  isPostponing,
  isRecalling,
  isReprogramming,
  onStart,
  onRecall,
  onFinish,
  onAbsent,
  onPostpone,
  onReprogram,
  onEdit,
  onCancel,
  onStatusChange,
}: TurnoDiaCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground">
              {turno.hora.slice(0, 5)} · {getPacienteDisplay(turno)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {turno.medico?.nombre ?? 'Médico sin datos'} ·{' '}
              {formatConsultorioCompact(turno.consultorio_cache ?? turno.medico?.consultorio)} ·{' '}
              {turno.obra_social}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <StatusBadge estado={turno.estado} />
            {isTurnoVencidoPendienteDeCierre(turno) ? (
              <Badge variant="destructive">Pendiente de cierre</Badge>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
            <span>{formatDateDisplay(turno.fecha)}</span>
          </div>
          <TurnoActions
            isChanging={isChanging}
            isMarkingAbsent={isMarkingAbsent}
            isPostponing={isPostponing}
            isRecalling={isRecalling}
            isReprogramming={isReprogramming}
            onAbsent={onAbsent}
            onCancel={onCancel}
            onEdit={onEdit}
            onFinish={onFinish}
            onPostpone={onPostpone}
            onRecall={onRecall}
            onReprogram={onReprogram}
            onStart={onStart}
            onStatusChange={onStatusChange}
            turno={turno}
          />
        </div>
      </div>
    </div>
  )
}

function getPacienteDisplay(turno: TurnoDetallado) {
  return turno.paciente
    ? `${turno.paciente.apellido}, ${turno.paciente.nombre}`
    : 'Paciente sin datos'
}
