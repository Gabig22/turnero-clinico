import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MoreVertical,
  Pencil,
  PhoneCall,
  Plus,
  Repeat2,
  Search,
  SlidersHorizontal,
  UserX,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/shared/EmptyState'
import { DateInputDisplay } from '@/components/shared/DateInputDisplay'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PosponerTurnoModal } from '@/components/turnos/PosponerTurnoModal'
import { ReprogramarTurnoModal } from '@/components/turnos/ReprogramarTurnoModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent } from '@/components/ui/card'
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
import { turnoSchema, type TurnoFormValues } from '@/lib/validators/schemas'
import type { Medico, Paciente, TurnoDetallado, TurnoEstado } from '@/types'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

const emptyValues: TurnoFormValues = {
  paciente_id: '',
  medico_id: '',
  fecha: todayKey(),
  hora: '09:00',
  obra_social: '',
  estado: 'pendiente',
  notas: '',
}

export function TurnosPage() {
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<TurnoEstado | 'todos'>('todos')
  const [fecha, setFecha] = useState(todayKey())
  const [medicoId, setMedicoId] = useState('')
  const [obraSocial, setObraSocial] = useState('')
  const [consultorio, setConsultorio] = useState('')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTurno, setEditingTurno] = useState<TurnoDetallado | null>(null)
  const [reprogrammingTurno, setReprogrammingTurno] = useState<TurnoDetallado | null>(null)
  const [postponingTurno, setPostponingTurno] = useState<TurnoDetallado | null>(null)
  const filters = useMemo(
    () => ({
      search,
      estado,
      fecha,
      medico_id: medicoId,
      obra_social: obraSocial,
      consultorio,
    }),
    [search, estado, fecha, medicoId, obraSocial, consultorio],
  )
  const turnosQuery = useTurnos(filters)
  const pacientesQuery = usePacientes()
  const medicosQuery = useMedicos()
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
  const appSettings = appSettingsQuery.data ?? DEFAULT_APP_SETTINGS
  const obrasSociales = useMemo(() => {
    const fromSettings = appSettings.obrasSociales
    const fromPacientes = pacientesQuery.data?.map((paciente) => paciente.obra_social) ?? []
    const fromTurnos = turnosQuery.data?.map((turno) => turno.obra_social) ?? []
    return Array.from(new Set([...fromSettings, ...fromPacientes, ...fromTurnos])).sort((a, b) =>
      a.localeCompare(b, 'es'),
    )
  }, [appSettings.obrasSociales, pacientesQuery.data, turnosQuery.data])
  const timeOptions = useMemo(
    () =>
      generateTimeOptions(
        appSettings.horarioInicio,
        appSettings.horarioFin,
        appSettings.slotDuracion,
      ),
    [appSettings.horarioFin, appSettings.horarioInicio, appSettings.slotDuracion],
  )
  const consultorios = useMemo(
    () =>
      Array.from(new Set((medicosQuery.data ?? []).map((medico) => medico.consultorio))).sort(
        (a, b) => a.localeCompare(b, 'es'),
      ),
    [medicosQuery.data],
  )
  const activeFiltersCount = useMemo(
    () =>
      [
        search.trim(),
        estado !== 'todos',
        fecha !== todayKey(),
        medicoId,
        obraSocial,
        consultorio,
      ].filter(Boolean).length,
    [consultorio, estado, fecha, medicoId, obraSocial, search],
  )
  const filtersSummary = useMemo(() => {
    const selectedMedico = medicosQuery.data?.find((medico) => medico.id === medicoId)
    const selectedEstado = turnoEstadoOptions.find((option) => option.value === estado)
    const parts = [
      fecha ? (fecha === todayKey() ? 'Hoy' : formatDateDisplay(fecha)) : 'Todos los días',
      selectedEstado?.label,
      selectedMedico?.nombre,
      obraSocial,
      consultorio ? formatConsultorioCompact(consultorio) : '',
      search.trim() ? `Búsqueda: ${search.trim()}` : '',
    ].filter(Boolean)

    return parts.join(' · ')
  }, [consultorio, estado, fecha, medicoId, medicosQuery.data, obraSocial, search])

  const openCreateForm = () => {
    setEditingTurno(null)
    setIsFormOpen(true)
  }

  const openEditForm = (turno: TurnoDetallado) => {
    setEditingTurno(turno)
    setIsFormOpen(true)
  }

  const cancelTurno = (turno: TurnoDetallado) => {
    const patientName = turno.paciente
      ? `${turno.paciente.apellido}, ${turno.paciente.nombre}`
      : 'este paciente'

    if (window.confirm(`¿Querés cancelar el turno de ${patientName}?`)) {
      cancelarTurno.mutate(turno.id)
    }
  }

  const resetFilters = () => {
    setSearch('')
    setEstado('todos')
    setFecha(todayKey())
    setMedicoId('')
    setObraSocial('')
    setConsultorio('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link className={buttonVariants({ variant: 'outline' })} to="/turnos/calendario">
              <CalendarDays aria-hidden="true" className="h-4 w-4" />
              Calendario
            </Link>
            <Button onClick={openCreateForm}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              Nuevo turno
            </Button>
          </>
        }
        description="Gestión completa de turnos sobre datos demo persistidos en el navegador."
        title="Turnos"
      />

      <Card>
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                aria-expanded={isFiltersOpen}
                onClick={() => setIsFiltersOpen((current) => !current)}
                type="button"
                variant="outline"
              >
                <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
                Filtros
                {activeFiltersCount ? <Badge variant="info">{activeFiltersCount}</Badge> : null}
              </Button>
              <span className="text-sm text-muted-foreground">{filtersSummary}</span>
            </div>

            {activeFiltersCount ? (
              <Button onClick={resetFilters} size="sm" type="button" variant="ghost">
                Limpiar filtros
              </Button>
            ) : null}
          </div>

          {isFiltersOpen ? (
            <div className="rounded-lg border border-border bg-muted/25 p-3 shadow-sm">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.6fr)_160px_160px_minmax(190px,1fr)_minmax(180px,1fr)_130px]">
            <label className="relative block">
              <span className="sr-only">Buscar turnos</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar paciente, DNI o médico"
                value={search}
              />
            </label>

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

            <DateInputDisplay onChange={setFecha} value={fecha} />

            <select
              className="form-input"
              onChange={(event) => setMedicoId(event.target.value)}
              value={medicoId}
            >
              <option value="">Todos los médicos</option>
              {(medicosQuery.data ?? []).map((medico) => (
                <option key={medico.id} value={medico.id}>
                  {medico.nombre}
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

            <select
              className="form-input"
              onChange={(event) => setConsultorio(event.target.value)}
              value={consultorio}
            >
              <option value="">Consultorios</option>
              {consultorios.map((item) => (
                <option key={item} value={item}>
                  {formatConsultorioCompact(item)}
                </option>
              ))}
            </select>
          </div>

              <div className="mt-3 flex flex-wrap justify-end gap-2">
            <Button onClick={() => setFecha(todayKey())} size="sm" variant="outline">
              Ver hoy
            </Button>
            <Button onClick={() => setFecha('')} size="sm" variant="ghost">
              Ver todos los días
            </Button>
          </div>

            </div>
          ) : null}

          {turnosQuery.isLoading ? (
            <EmptyState title="Cargando turnos" />
          ) : turnosQuery.data?.length ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[1040px] border-collapse bg-card text-sm">
                <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="w-[11%] px-4 py-3 font-semibold">Fecha</th>
                    <th className="w-[8%] px-4 py-3 text-center font-semibold">Hora</th>
                    <th className="w-[24%] px-4 py-3 font-semibold">Paciente</th>
                    <th className="w-[22%] px-4 py-3 font-semibold">Médico</th>
                    <th className="px-4 py-3 font-semibold">Obra social</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">Estado</th>
                    <th className="w-[192px] whitespace-nowrap px-2 py-3 text-center font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border align-middle">
                  {turnosQuery.data.map((turno) => (
                    <tr className="hover:bg-accent/50" key={turno.id}>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <p className="font-semibold text-foreground">
                          {formatDateDisplay(turno.fecha)}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-center">
                        <p className="text-sm font-bold text-foreground">{turno.hora}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="max-w-[280px] whitespace-normal text-sm font-semibold leading-5 text-foreground">
                          {turno.paciente
                            ? `${turno.paciente.apellido}, ${turno.paciente.nombre}`
                            : 'Paciente sin datos'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          DNI {turno.paciente?.dni ?? '-'}
                        </p>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="max-w-[260px] whitespace-normal text-sm font-medium leading-5 text-foreground">
                          {turno.medico?.nombre ?? 'Médico sin datos'}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-primary">
                          {formatConsultorioCompact(
                            turno.consultorio_cache ?? turno.medico?.consultorio,
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-muted-foreground">
                        <span className="inline-flex max-w-[170px] whitespace-normal leading-5">
                          {turno.obra_social}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <div className="flex flex-col items-start gap-1.5">
                          <StatusBadge estado={turno.estado} />
                          {isTurnoVencidoPendienteDeCierre(turno) ? (
                            <Badge variant="destructive">Pendiente de cierre</Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-2 py-2.5">
                        <TurnoActions
                          isChanging={cambiarEstado.isPending}
                          isMarkingAbsent={marcarAusente.isPending}
                          isPostponing={posponerTurno.isPending}
                          isRecalling={rellamarTurno.isPending}
                          isReprogramming={reprogramarTurno.isPending}
                          onAbsent={() =>
                            marcarAusente.mutate(turno.id)
                          }
                          onCancel={() => cancelTurno(turno)}
                          onEdit={() => openEditForm(turno)}
                          onFinish={() =>
                            cambiarEstado.mutate({ id: turno.id, estado: 'finalizado' })
                          }
                          onRecall={() => rellamarTurno.mutate(turno.id)}
                          onPostpone={() => setPostponingTurno(turno)}
                          onReprogram={() => setReprogrammingTurno(turno)}
                          onStart={() =>
                            cambiarEstado.mutate({ id: turno.id, estado: 'en_atencion' })
                          }
                          onStatusChange={(estado) => {
                            if (estado === 'ausente') {
                              marcarAusente.mutate(turno.id)
                              return
                            }

                            cambiarEstado.mutate({ id: turno.id, estado })
                          }}
                          turno={turno}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              description="Probá ajustar los filtros o crear un turno nuevo."
              icon={CalendarClock}
              title="No hay turnos que coincidan con los filtros"
            />
          )}
        </CardContent>
      </Card>

      {isFormOpen ? (
        <TurnoFormDialog
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

type TurnoFormDialogProps = {
  turno: TurnoDetallado | null
  pacientes: Paciente[]
  medicos: Medico[]
  obrasSociales: string[]
  timeOptions: string[]
  slotDuracion: number
  defaultFecha?: string
  isSaving: boolean
  onClose: () => void
  onSubmit: (values: TurnoFormValues) => Promise<void> | void
}

export function TurnoFormDialog({
  turno,
  pacientes,
  medicos,
  obrasSociales,
  timeOptions,
  slotDuracion,
  defaultFecha,
  isSaving,
  onClose,
  onSubmit,
}: TurnoFormDialogProps) {
  const availableObrasSociales = useMemo(
    () =>
      Array.from(new Set([...obrasSociales, ...(turno ? [turno.obra_social] : [])])).sort(
        (a, b) => a.localeCompare(b, 'es'),
      ),
    [obrasSociales, turno],
  )
  const availableTimeOptions = useMemo(
    () =>
      Array.from(new Set([...timeOptions, ...(turno ? [turno.hora.slice(0, 5)] : [])])).sort(
        (a, b) => a.localeCompare(b),
      ),
    [timeOptions, turno],
  )
  const selectablePacientes = useMemo(
    () =>
      pacientes.filter(
        (paciente) => paciente.activo || (turno ? paciente.id === turno.paciente_id : false),
      ),
    [pacientes, turno],
  )
  const selectableMedicos = useMemo(
    () =>
      medicos.filter(
        (medico) => medico.activo || (turno ? medico.id === turno.medico_id : false),
      ),
    [medicos, turno],
  )
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
  } = useForm<TurnoFormValues>({
    defaultValues: turno
      ? mapTurnoToForm(turno)
      : buildEmptyTurnoValues(selectablePacientes, selectableMedicos, timeOptions[0], defaultFecha),
  })
  const selectedPacienteId = watch('paciente_id')
  const selectedMedicoId = watch('medico_id')
  const selectedFecha = watch('fecha')
  const selectedMedico = selectableMedicos.find((medico) => medico.id === selectedMedicoId)

  useEffect(() => {
    reset(
      turno
        ? mapTurnoToForm(turno)
        : buildEmptyTurnoValues(selectablePacientes, selectableMedicos, timeOptions[0], defaultFecha),
    )
  }, [defaultFecha, reset, selectableMedicos, selectablePacientes, timeOptions, turno])

  useEffect(() => {
    const paciente = pacientes.find((item) => item.id === selectedPacienteId)

    if (paciente) {
      setValue('obra_social', paciente.obra_social)
    }
  }, [pacientes, selectedPacienteId, setValue])

  const submitForm = handleSubmit((values) => {
    const parsed = turnoSchema.safeParse(values)

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]

        if (typeof fieldName === 'string') {
          setError(fieldName as keyof TurnoFormValues, { message: issue.message })
        }
      })
      return
    }

    onSubmit(parsed.data)
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-clinical">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {turno ? 'Editar turno' : 'Nuevo turno'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Seleccioná paciente, médico, fecha y hora para guardar el turno.
          </p>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={submitForm}>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField error={errors.paciente_id?.message} label="Paciente *">
                <select className="form-input" {...register('paciente_id')}>
                  <option value="">Seleccionar paciente</option>
                  {selectablePacientes.map((paciente) => (
                    <option key={paciente.id} value={paciente.id}>
                      {paciente.apellido}, {paciente.nombre} - DNI {paciente.dni}
                      {!paciente.activo ? ' (inactivo)' : ''}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField error={errors.medico_id?.message} label="Médico *">
                <select className="form-input" {...register('medico_id')}>
                  <option value="">Seleccionar médico</option>
                  {selectableMedicos.map((medico) => (
                    <option key={medico.id} value={medico.id}>
                      {medico.nombre} - {formatConsultorioCompact(medico.consultorio)}
                      {!medico.activo ? ' (inactivo)' : ''}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField error={errors.fecha?.message} label="Fecha *">
                <input type="hidden" {...register('fecha')} />
                <DateInputDisplay
                  onChange={(value) => setValue('fecha', value)}
                  required
                  value={selectedFecha}
                />
              </FormField>

              <FormField error={errors.hora?.message} label="Hora *">
                <input
                  className="form-input"
                  list="horarios-turno-sugeridos"
                  step={slotDuracion * 60}
                  type="time"
                  {...register('hora')}
                />
                <datalist id="horarios-turno-sugeridos">
                  {availableTimeOptions.map((time) => (
                    <option key={time} value={time} />
                  ))}
                </datalist>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sugerencias cada {slotDuracion} minutos.
                </p>
              </FormField>

              <FormField error={errors.obra_social?.message} label="Obra social *">
                <select className="form-input" {...register('obra_social')}>
                  {availableObrasSociales.map((obraSocial) => (
                    <option key={obraSocial} value={obraSocial}>
                      {obraSocial}
                    </option>
                  ))}
                </select>
              </FormField>

              {turno ? (
                <FormField error={errors.estado?.message} label="Estado">
                  <select className="form-input" {...register('estado')}>
                    {turnoEstadoOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              ) : null}
            </div>

            {selectedMedico ? (
              <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                {formatConsultorioCompact(selectedMedico.consultorio)}
                {selectedMedico.dias_disponibles?.length
                  ? ` · Días: ${selectedMedico.dias_disponibles.join(', ')}`
                  : ''}
              </div>
            ) : null}

            <FormField error={errors.notas?.message} label="Notas">
              <textarea className="form-input min-h-24 resize-y" {...register('notas')} />
            </FormField>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border bg-card p-5 sm:flex-row sm:justify-end">
            <Button disabled={isSaving} onClick={onClose} type="button" variant="outline">
              Cancelar
            </Button>
            <Button
              disabled={isSaving || !selectablePacientes.length || !selectableMedicos.length}
              type="submit"
            >
              {isSaving ? 'Guardando...' : turno ? 'Guardar cambios' : 'Crear turno'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

type FormFieldProps = {
  label: string
  error?: string
  children: ReactNode
}

function FormField({ label, error, children }: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs font-medium text-destructive">{error}</span> : null}
    </label>
  )
}

type TurnoActionsProps = {
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

export function TurnoActions({
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
}: TurnoActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isExpiredOpen = isTurnoVencidoPendienteDeCierre(turno)
  const canPostpone = ['pendiente', 'en_atencion'].includes(turno.estado)
  const canReprogram = !['finalizado', 'cancelado', 'ausente', 'reprogramado'].includes(
    turno.estado,
  )
  const canMarkAbsent = ['pendiente', 'en_atencion'].includes(turno.estado) || isExpiredOpen
  const runAction = (action: () => void) => {
    setIsMenuOpen(false)
    action()
  }

  return (
    <div className="flex min-w-[176px] justify-center gap-1">
      {isExpiredOpen ? (
        <>
          <ActionIconButton
            disabled={isMarkingAbsent}
            label="Marcar ausente"
            onClick={onAbsent}
            variant="outline"
          >
            <UserX aria-hidden="true" className="h-4 w-4" />
          </ActionIconButton>
          <ActionIconButton
            disabled={isChanging}
            label="Finalizar"
            onClick={onFinish}
            variant="secondary"
          >
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          </ActionIconButton>
          <ActionIconButton
            disabled={isReprogramming}
            label="Reprogramar"
            onClick={onReprogram}
            variant="outline"
          >
            <CalendarClock aria-hidden="true" className="h-4 w-4" />
          </ActionIconButton>
        </>
      ) : (
        <>
          {turno.estado === 'pendiente' ? (
            <ActionIconButton
              disabled={isChanging}
              label="Llamar"
              onClick={onStart}
              variant="outline"
            >
              <PhoneCall aria-hidden="true" className="h-4 w-4" />
            </ActionIconButton>
          ) : null}

          {canPostpone ? (
            <ActionIconButton
              disabled={isPostponing}
              label="Posponer"
              onClick={onPostpone}
              variant="outline"
            >
              <Clock3 aria-hidden="true" className="h-4 w-4" />
            </ActionIconButton>
          ) : null}

          {turno.estado === 'en_atencion' ? (
            <>
              <ActionIconButton
                disabled={isRecalling}
                label="Rellamar"
                onClick={onRecall}
                variant="outline"
              >
                <Repeat2 aria-hidden="true" className="h-4 w-4" />
              </ActionIconButton>
              <ActionIconButton
                disabled={isChanging}
                label="Finalizar"
                onClick={onFinish}
                variant="secondary"
              >
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              </ActionIconButton>
            </>
          ) : null}

          {turno.estado === 'pendiente' ? (
            <ActionIconButton label="Cancelar" onClick={onCancel} variant="outline">
              <XCircle aria-hidden="true" className="h-4 w-4" />
            </ActionIconButton>
          ) : null}
        </>
      )}

      <ActionIconButton label="Editar" onClick={onEdit} variant="outline">
        <Pencil aria-hidden="true" className="h-4 w-4" />
      </ActionIconButton>

      <div
        className="relative"
        onBlur={(event) => {
          const nextFocus = event.relatedTarget as Node | null

          if (!event.currentTarget.contains(nextFocus)) {
            setIsMenuOpen(false)
          }
        }}
      >
        <Button
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          aria-label="Más acciones"
          className="h-8 w-8 p-0"
          onClick={() => setIsMenuOpen((current) => !current)}
          size="sm"
          title="Más acciones"
          type="button"
          variant="outline"
        >
          <MoreVertical aria-hidden="true" className="h-4 w-4" />
        </Button>

        {isMenuOpen ? (
          <div
            className="absolute right-0 top-9 z-20 w-52 rounded-md border border-border bg-card p-1 text-left shadow-clinical"
            role="menu"
          >
            <p className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Acciones
            </p>
            {canReprogram ? (
              <button
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs font-medium text-foreground transition hover:bg-accent disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
                disabled={isReprogramming}
                onClick={() => runAction(onReprogram)}
                role="menuitem"
                type="button"
              >
                <CalendarClock aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
                Reprogramar
              </button>
            ) : null}
            {canPostpone ? (
              <button
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs font-medium text-foreground transition hover:bg-accent disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
                disabled={isPostponing}
                onClick={() => runAction(onPostpone)}
                role="menuitem"
                type="button"
              >
                <Clock3 aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
                Posponer
              </button>
            ) : null}
            {canMarkAbsent && turno.estado !== 'ausente' ? (
              <button
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs font-medium text-foreground transition hover:bg-accent disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
                disabled={isMarkingAbsent}
                onClick={() => runAction(onAbsent)}
                role="menuitem"
                type="button"
              >
                <UserX aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
                Marcar ausente
              </button>
            ) : null}
            <p className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Cambiar estado
            </p>
            {turnoEstadoOptions
              .filter(
                (option) =>
                  option.value !== turno.estado &&
                  !['pospuesto', 'reprogramado', 'ausente'].includes(option.value),
              )
              .map((option) => (
                <button
                  className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs font-medium text-foreground transition hover:bg-accent disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
                  disabled={isChanging}
                  key={option.value}
                  onClick={() => runAction(() => onStatusChange(option.value))}
                  role="menuitem"
                  type="button"
                >
                  <span className="h-2 w-2 rounded-full border border-border" />
                  {getStatusMenuLabel(option.value, option.label)}
                </button>
              ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

type ActionIconButtonProps = {
  children: ReactNode
  disabled?: boolean
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
}

function ActionIconButton({
  children,
  disabled,
  label,
  onClick,
  variant = 'outline',
}: ActionIconButtonProps) {
  return (
    <Button
      aria-label={label}
      className="h-8 w-8 p-0 hover:border-primary/30"
      disabled={disabled}
      onClick={onClick}
      size="sm"
      title={label}
      type="button"
      variant={variant}
    >
      {children}
    </Button>
  )
}

function getStatusMenuLabel(estado: TurnoEstado, label: string) {
  if (estado === 'ausente') {
    return 'Marcar ausente'
  }

  if (estado === 'reprogramado') {
    return 'Marcar reprogramado'
  }

  return `Cambiar a ${label}`
}

function buildEmptyTurnoValues(
  pacientes: Paciente[],
  medicos: Medico[],
  suggestedStartTime?: string,
  defaultFecha?: string,
): TurnoFormValues {
  return {
    ...emptyValues,
    fecha: defaultFecha ?? emptyValues.fecha,
    hora: suggestedStartTime ?? DEFAULT_APP_SETTINGS.horarioInicio,
    paciente_id: pacientes[0]?.id ?? '',
    medico_id: medicos[0]?.id ?? '',
    obra_social: pacientes[0]?.obra_social ?? '',
  }
}

function mapTurnoToForm(turno: TurnoDetallado): TurnoFormValues {
  return {
    paciente_id: turno.paciente_id,
    medico_id: turno.medico_id,
    fecha: turno.fecha,
    hora: turno.hora.slice(0, 5),
    obra_social: turno.obra_social,
    estado: turno.estado,
    notas: turno.notas ?? '',
  }
}
