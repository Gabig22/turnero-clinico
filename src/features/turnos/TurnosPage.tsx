import {
  CalendarClock,
  CheckCircle2,
  Pencil,
  PhoneCall,
  Plus,
  Repeat2,
  Search,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useMedicos } from '@/hooks/useMedicos'
import { usePacientes } from '@/hooks/usePacientes'
import { useAppSettings } from '@/hooks/useSettings'
import {
  useActualizarTurno,
  useCambiarEstadoTurno,
  useCancelarTurno,
  useCrearTurno,
  useRellamarTurno,
  useTurnos,
} from '@/hooks/useTurnos'
import { DEFAULT_APP_SETTINGS } from '@/lib/storage/settingsStorage'
import { turnoSchema, type TurnoFormValues } from '@/lib/validators/schemas'
import type { Medico, Paciente, TurnoDetallado, TurnoEstado } from '@/types'

const estadoOptions: Array<{ value: TurnoEstado; label: string }> = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_atencion', label: 'En atención' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'pospuesto', label: 'Pospuesto' },
]

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
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTurno, setEditingTurno] = useState<TurnoDetallado | null>(null)
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
  const rellamarTurno = useRellamarTurno()
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

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button onClick={openCreateForm}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            Nuevo turno
          </Button>
        }
        description="Gestión completa de turnos sobre datos demo persistidos en el navegador."
        title="Turnos"
      />

      <Card>
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="grid gap-3 xl:grid-cols-[1.4fr_170px_170px_220px_190px_160px]">
            <label className="relative block">
              <span className="sr-only">Buscar turnos</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por paciente, DNI o médico"
                value={search}
              />
            </label>

            <select
              className="form-input"
              onChange={(event) => setEstado(event.target.value as TurnoEstado | 'todos')}
              value={estado}
            >
              <option value="todos">Todos los estados</option>
              {estadoOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              className="form-input"
              onChange={(event) => setFecha(event.target.value)}
              type="date"
              value={fecha}
            />

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
                  Consultorio {item}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setFecha(todayKey())} size="sm" variant="outline">
              Ver hoy
            </Button>
            <Button onClick={() => setFecha('')} size="sm" variant="ghost">
              Ver todos los días
            </Button>
          </div>

          {turnosQuery.isLoading ? (
            <EmptyState title="Cargando turnos" />
          ) : turnosQuery.data?.length ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[1060px] border-collapse bg-card text-sm">
                <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="w-[15%] px-4 py-3 font-semibold">Fecha y hora</th>
                    <th className="w-[24%] px-4 py-3 font-semibold">Paciente</th>
                    <th className="w-[23%] px-4 py-3 font-semibold">Médico</th>
                    <th className="px-4 py-3 font-semibold">Obra social</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">Estado</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border align-middle">
                  {turnosQuery.data.map((turno) => (
                    <tr className="hover:bg-accent/50" key={turno.id}>
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="font-semibold text-foreground">{turno.hora}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{turno.fecha}</p>
                        <div className="mt-1">
                          <DateBadge fecha={turno.fecha} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[280px] whitespace-normal text-sm font-semibold leading-5 text-foreground">
                          {turno.paciente
                            ? `${turno.paciente.apellido}, ${turno.paciente.nombre}`
                            : 'Paciente sin datos'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          DNI {turno.paciente?.dni ?? '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[260px] whitespace-normal text-sm font-medium leading-5 text-foreground">
                          {turno.medico?.nombre ?? 'Médico sin datos'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Consultorio {turno.consultorio_cache ?? turno.medico?.consultorio ?? '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <span className="inline-flex max-w-[170px] whitespace-normal leading-5">
                          {turno.obra_social}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge estado={turno.estado} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex max-w-[360px] flex-wrap justify-end gap-2">
                          <Button onClick={() => openEditForm(turno)} size="sm" variant="outline">
                            <Pencil aria-hidden="true" className="h-4 w-4" />
                            Editar
                          </Button>

                          {turno.estado === 'pendiente' ? (
                            <Button
                              disabled={cambiarEstado.isPending}
                              onClick={() =>
                                cambiarEstado.mutate({ id: turno.id, estado: 'en_atencion' })
                              }
                              size="sm"
                              variant="outline"
                            >
                              <PhoneCall aria-hidden="true" className="h-4 w-4" />
                              Llamar
                            </Button>
                          ) : null}

                          {turno.estado === 'en_atencion' ? (
                            <>
                              <Button
                                disabled={rellamarTurno.isPending}
                                onClick={() => rellamarTurno.mutate(turno.id)}
                                size="sm"
                                variant="outline"
                              >
                                <Repeat2 aria-hidden="true" className="h-4 w-4" />
                                Rellamar
                              </Button>
                              <Button
                                disabled={cambiarEstado.isPending}
                                onClick={() =>
                                  cambiarEstado.mutate({ id: turno.id, estado: 'finalizado' })
                                }
                                size="sm"
                                variant="secondary"
                              >
                                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                                Finalizar
                              </Button>
                            </>
                          ) : null}

                          {!['finalizado', 'cancelado'].includes(turno.estado) ? (
                            <Button onClick={() => cancelTurno(turno)} size="sm" variant="ghost">
                              <XCircle aria-hidden="true" className="h-4 w-4" />
                              Cancelar
                            </Button>
                          ) : null}

                          <select
                            aria-label="Cambiar estado"
                            className="h-9 w-36 rounded-md border border-input bg-card px-2 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                            onChange={(event) =>
                              cambiarEstado.mutate({
                                id: turno.id,
                                estado: event.target.value as TurnoEstado,
                              })
                            }
                            value={turno.estado}
                          >
                            {estadoOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
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
          onSubmit={(values) => {
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
  isSaving: boolean
  onClose: () => void
  onSubmit: (values: TurnoFormValues) => void
}

function TurnoFormDialog({
  turno,
  pacientes,
  medicos,
  obrasSociales,
  timeOptions,
  slotDuracion,
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
      : buildEmptyTurnoValues(pacientes, medicos, timeOptions[0]),
  })
  const selectedPacienteId = watch('paciente_id')
  const selectedMedicoId = watch('medico_id')
  const selectedMedico = medicos.find((medico) => medico.id === selectedMedicoId)

  useEffect(() => {
    reset(turno ? mapTurnoToForm(turno) : buildEmptyTurnoValues(pacientes, medicos, timeOptions[0]))
  }, [medicos, pacientes, reset, timeOptions, turno])

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
                  {pacientes.map((paciente) => (
                    <option key={paciente.id} value={paciente.id}>
                      {paciente.apellido}, {paciente.nombre} - DNI {paciente.dni}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField error={errors.medico_id?.message} label="Médico *">
                <select className="form-input" {...register('medico_id')}>
                  <option value="">Seleccionar médico</option>
                  {medicos.map((medico) => (
                    <option key={medico.id} value={medico.id}>
                      {medico.nombre} - Consultorio {medico.consultorio}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField error={errors.fecha?.message} label="Fecha *">
                <input className="form-input" type="date" {...register('fecha')} />
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
                    {estadoOptions.map((option) => (
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
                Consultorio {selectedMedico.consultorio}
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
            <Button disabled={isSaving || !pacientes.length || !medicos.length} type="submit">
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

function buildEmptyTurnoValues(
  pacientes: Paciente[],
  medicos: Medico[],
  suggestedStartTime?: string,
): TurnoFormValues {
  return {
    ...emptyValues,
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

function parseTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null
  }

  return hours * 60 + minutes
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`
}

function generateTimeOptions(horarioInicio: string, horarioFin: string, slotDuracion: number) {
  const start = parseTimeToMinutes(horarioInicio)
  const end = parseTimeToMinutes(horarioFin)

  if (start === null || end === null || start >= end) {
    return [DEFAULT_APP_SETTINGS.horarioInicio]
  }

  const options: string[] = []

  for (let current = start; current < end; current += slotDuracion) {
    options.push(formatMinutes(current))
  }

  return options
}

function DateBadge({ fecha }: { fecha: string }) {
  const today = todayKey()

  if (fecha === today) {
    return <Badge variant="info">Hoy</Badge>
  }

  if (fecha > today) {
    return <Badge variant="default">Futuro</Badge>
  }

  return <Badge variant="muted">Pasado</Badge>
}
