import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  PhoneCall,
  Plus,
  Repeat2,
  XCircle,
} from 'lucide-react'
import { addDays, format, parseISO } from 'date-fns'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AgendaMensualCalendar } from '@/components/turnos/AgendaMensualCalendar'
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
import { useMedico } from '@/hooks/useMedicos'
import { usePacientes } from '@/hooks/usePacientes'
import { useAppSettings } from '@/hooks/useSettings'
import {
  useActualizarTurno,
  useCambiarEstadoTurno,
  useCancelarTurno,
  useCrearTurno,
  useRellamarTurno,
  useTurnosDeMedico,
  useTurnosMedico,
} from '@/hooks/useTurnos'
import { formatDateDisplay, parseDisplayDate } from '@/lib/dates/displayDate'
import { generateTimeOptions } from '@/lib/dates/timeSlots'
import { DEFAULT_APP_SETTINGS } from '@/lib/storage/settingsStorage'
import { isTurnoVencidoPendienteDeCierre, turnoEstadoOptions } from '@/lib/turnos/status'
import { turnoSchema, type TurnoFormValues } from '@/lib/validators/schemas'
import type { Medico, Paciente, TurnoDetallado } from '@/types'

const todayKey = () => format(new Date(), 'yyyy-MM-dd')

type AgendaMedicoPageProps = {
  medicoId?: string
  context?: 'admin' | 'doctor'
}

export function AgendaMedicoPage({ medicoId = '', context = 'admin' }: AgendaMedicoPageProps) {
  const [selectedDate, setSelectedDate] = useState(todayKey())
  const [dateInputValue, setDateInputValue] = useState(formatDateDisplay(todayKey()))
  const [dateInputError, setDateInputError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTurno, setEditingTurno] = useState<TurnoDetallado | null>(null)
  const medicoQuery = useMedico(medicoId)
  const turnosMedicoQuery = useTurnosDeMedico(medicoId)
  const turnosQuery = useTurnosMedico(medicoId, selectedDate)
  const pacientesQuery = usePacientes()
  const appSettingsQuery = useAppSettings()
  const crearTurno = useCrearTurno()
  const actualizarTurno = useActualizarTurno()
  const cambiarEstado = useCambiarEstadoTurno()
  const cancelarTurno = useCancelarTurno()
  const rellamarTurno = useRellamarTurno()
  const medico = medicoQuery.data
  const turnos = useMemo(() => turnosQuery.data ?? [], [turnosQuery.data])
  const turnosMedico = useMemo(() => turnosMedicoQuery.data ?? [], [turnosMedicoQuery.data])
  const appSettings = appSettingsQuery.data ?? DEFAULT_APP_SETTINGS
  const obrasSociales = useMemo(() => {
    const fromPacientes = pacientesQuery.data?.map((paciente) => paciente.obra_social) ?? []
    const fromTurnos = turnos.map((turno) => turno.obra_social)

    return Array.from(
      new Set([...appSettings.obrasSociales, ...fromPacientes, ...fromTurnos]),
    ).sort((a, b) => a.localeCompare(b, 'es'))
  }, [appSettings.obrasSociales, pacientesQuery.data, turnos])
  const timeOptions = useMemo(
    () =>
      generateTimeOptions(
        appSettings.horarioInicio,
        appSettings.horarioFin,
        appSettings.slotDuracion,
        DEFAULT_APP_SETTINGS.horarioInicio,
      ),
    [appSettings.horarioFin, appSettings.horarioInicio, appSettings.slotDuracion],
  )
  const metrics = useMemo(
    () => ({
      total: turnos.length,
      pendiente: turnos.filter((turno) => turno.estado === 'pendiente').length,
      en_atencion: turnos.filter((turno) => turno.estado === 'en_atencion').length,
      finalizado: turnos.filter((turno) => turno.estado === 'finalizado').length,
      cancelado: turnos.filter((turno) => turno.estado === 'cancelado').length,
    }),
    [turnos],
  )

  const moveDate = (days: number) => {
    setSelectedDate(format(addDays(parseISO(selectedDate), days), 'yyyy-MM-dd'))
  }

  useEffect(() => {
    setDateInputValue(formatDateDisplay(selectedDate))
    setDateInputError('')
  }, [selectedDate])

  const updateSelectedDateFromInput = (value: string) => {
    setDateInputValue(value)

    const parsedDate = parseDisplayDate(value)

    if (parsedDate) {
      setSelectedDate(parsedDate)
      setDateInputError('')
      return
    }

    if (value.trim().length >= 10) {
      setDateInputError('Ingresá una fecha válida en formato DD/MM/AAAA.')
    } else {
      setDateInputError('')
    }
  }

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
  const backHref = context === 'doctor' ? '/doctor' : '/medicos'
  const backLabel = context === 'doctor' ? 'Portal médico' : 'Volver a médicos'

  if (medicoQuery.isLoading) {
    return <EmptyState icon={CalendarDays} title="Cargando agenda del médico" />
  }

  if (!medico) {
    return (
      <EmptyState
        action={
          <Link className={buttonVariants({ variant: 'outline' })} to={backHref}>
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            {backLabel}
          </Link>
        }
        description="Revisá el listado de médicos o reiniciá la demo si necesitás recuperar datos."
        icon={CalendarDays}
        title="No encontramos este médico"
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link className={buttonVariants({ variant: 'outline' })} to={backHref}>
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              {context === 'doctor' ? 'Portal médico' : 'Volver'}
            </Link>
            {context === 'doctor' ? (
              <Link className={buttonVariants({ variant: 'outline' })} to="/doctor/pacientes">
                Mis pacientes
              </Link>
            ) : (
              <Link className={buttonVariants({ variant: 'outline' })} to="/turnos">
                Ver turnos generales
              </Link>
            )}
            <Button onClick={openCreateForm}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              Nuevo turno
            </Button>
          </>
        }
        description={`${medico.especialidad} · Consultorio ${medico.consultorio}`}
        title={medico.nombre}
      />

      <Card>
        <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={medico.activo ? 'success' : 'muted'}>
                {medico.activo ? 'Activo' : 'Inactivo'}
              </Badge>
              <Badge variant="info">Fecha seleccionada: {formatDateDisplay(selectedDate)}</Badge>
            </div>

            <InfoBlock label="Días disponibles">
              <ChipList items={medico.dias_disponibles?.length ? medico.dias_disponibles : ['L', 'Ma', 'Mi', 'J', 'V']} />
            </InfoBlock>

            <InfoBlock label="Obras sociales">
              <ChipList items={medico.obras_sociales ?? []} maxVisible={8} />
            </InfoBlock>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Fecha de agenda
              </span>
              <input
                className="form-input"
                inputMode="numeric"
                onBlur={() => {
                  if (!parseDisplayDate(dateInputValue)) {
                    setDateInputError('Ingresá una fecha válida en formato DD/MM/AAAA.')
                  }
                }}
                onChange={(event) => updateSelectedDateFromInput(event.target.value)}
                placeholder="DD/MM/AAAA"
                value={dateInputValue}
              />
            </label>
            {dateInputError ? (
              <p className="mt-1 text-xs font-medium text-destructive">{dateInputError}</p>
            ) : null}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button onClick={() => moveDate(-1)} size="sm" type="button" variant="outline">
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                Anterior
              </Button>
              <Button onClick={() => setSelectedDate(todayKey())} size="sm" type="button" variant="outline">
                Hoy
              </Button>
              <Button onClick={() => moveDate(1)} size="sm" type="button" variant="outline">
                Siguiente
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vista mensual</CardTitle>
          <CardDescription>
            Seleccioná un día para revisar su agenda o tocá un turno para editarlo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgendaMensualCalendar
            isLoading={turnosMedicoQuery.isLoading}
            onSelectDate={setSelectedDate}
            onSelectTurno={(turno) => {
              setEditingTurno(turno)
              setIsFormOpen(true)
            }}
            selectedDate={selectedDate}
            turnos={turnosMedico}
          />
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Turnos del día" value={metrics.total} />
        <MetricCard label="Pendientes" value={metrics.pendiente} variant="pending" />
        <MetricCard label="En atención" value={metrics.en_atencion} variant="active" />
        <MetricCard label="Finalizados" value={metrics.finalizado} variant="completed" />
        <MetricCard label="Cancelados" value={metrics.cancelado} variant="cancelled" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Turnos del médico</CardTitle>
          <CardDescription>
            Agenda del día seleccionado con acciones rápidas del flujo operativo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {turnosQuery.isLoading ? (
            <EmptyState icon={CalendarDays} title="Cargando turnos del día" />
          ) : turnos.length ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[880px] border-collapse bg-card text-sm">
                <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">Hora</th>
                    <th className="w-[28%] px-4 py-3 font-semibold">Paciente</th>
                    <th className="px-4 py-3 font-semibold">Obra social</th>
                    <th className="px-4 py-3 font-semibold">Notas</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">Estado</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border align-middle">
                  {turnos.map((turno) => (
                    <tr className="hover:bg-accent/50" key={turno.id}>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-foreground">
                        {turno.hora}
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[260px] whitespace-normal text-sm font-semibold leading-5 text-foreground">
                          {turno.paciente
                            ? `${turno.paciente.apellido}, ${turno.paciente.nombre}`
                            : 'Paciente sin datos'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          DNI {turno.paciente?.dni ?? '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {turno.obra_social}
                      </td>
                      <td className="px-4 py-3 text-xs leading-5 text-muted-foreground">
                        <span className="inline-flex max-w-[220px] whitespace-normal">
                          {turno.notas || '-'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex flex-col items-start gap-1.5">
                          <StatusBadge estado={turno.estado} />
                          {isTurnoVencidoPendienteDeCierre(turno) ? (
                            <Badge variant="destructive">Pendiente de cierre</Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <TurnoActions
                          isChanging={cambiarEstado.isPending}
                          isRecalling={rellamarTurno.isPending}
                          onAbsent={() =>
                            cambiarEstado.mutate({ id: turno.id, estado: 'ausente' })
                          }
                          onCancel={() => cancelTurno(turno)}
                          onEdit={() => openEditForm(turno)}
                          onFinish={() =>
                            cambiarEstado.mutate({ id: turno.id, estado: 'finalizado' })
                          }
                          onRecall={() => rellamarTurno.mutate(turno.id)}
                          onReprogram={() =>
                            cambiarEstado.mutate({ id: turno.id, estado: 'reprogramado' })
                          }
                          onStart={() =>
                            cambiarEstado.mutate({ id: turno.id, estado: 'en_atencion' })
                          }
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
              action={
                <Button onClick={openCreateForm}>
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  Crear turno para este día
                </Button>
              }
              icon={CalendarDays}
              title="No hay turnos para esta fecha"
            />
          )}
        </CardContent>
      </Card>

      {isFormOpen ? (
        <AgendaTurnoFormDialog
          fecha={selectedDate}
          isSaving={crearTurno.isPending || actualizarTurno.isPending}
          medico={medico}
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

type MetricCardProps = {
  label: string
  value: number
  variant?: 'neutral' | 'pending' | 'active' | 'completed' | 'cancelled'
}

const metricClasses: Record<NonNullable<MetricCardProps['variant']>, string> = {
  neutral: 'border-t-4 border-t-primary/20',
  pending: 'border-t-4 border-t-warning bg-warning-soft/35',
  active: 'border-t-4 border-t-info bg-info-soft/35',
  completed: 'border-t-4 border-t-success bg-success-soft/35',
  cancelled: 'border-t-4 border-t-destructive bg-destructive/5',
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

type InfoBlockProps = {
  label: string
  children: ReactNode
}

function InfoBlock({ label, children }: InfoBlockProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  )
}

function ChipList({ items, maxVisible = 6 }: { items: string[]; maxVisible?: number }) {
  const visibleItems = items.slice(0, maxVisible)
  const hiddenCount = Math.max(items.length - visibleItems.length, 0)

  if (!items.length) {
    return <span className="text-sm text-muted-foreground">Sin datos</span>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleItems.map((item) => (
        <span
          className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground"
          key={item}
        >
          {item}
        </span>
      ))}
      {hiddenCount ? (
        <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">
          +{hiddenCount}
        </span>
      ) : null}
    </div>
  )
}

type TurnoActionsProps = {
  turno: TurnoDetallado
  isChanging: boolean
  isRecalling: boolean
  onStart: () => void
  onRecall: () => void
  onFinish: () => void
  onAbsent: () => void
  onReprogram: () => void
  onEdit: () => void
  onCancel: () => void
}

function TurnoActions({
  turno,
  isChanging,
  isRecalling,
  onStart,
  onRecall,
  onFinish,
  onAbsent,
  onReprogram,
  onEdit,
  onCancel,
}: TurnoActionsProps) {
  const isExpiredOpen = isTurnoVencidoPendienteDeCierre(turno)

  return (
    <div className="flex flex-wrap justify-end gap-2">
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
      ) : (
        <>
          {turno.estado === 'pendiente' ? (
            <Button disabled={isChanging} onClick={onStart} size="sm" variant="outline">
              <PhoneCall aria-hidden="true" className="h-4 w-4" />
              Llamar
            </Button>
          ) : null}

          {turno.estado === 'en_atencion' ? (
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

          {turno.estado === 'pendiente' ? (
            <Button onClick={onCancel} size="sm" variant="ghost">
              <XCircle aria-hidden="true" className="h-4 w-4" />
              Cancelar
            </Button>
          ) : null}
        </>
      )}

      <Button onClick={onEdit} size="sm" variant="outline">
        <Pencil aria-hidden="true" className="h-4 w-4" />
        Editar
      </Button>
    </div>
  )
}

type AgendaTurnoFormDialogProps = {
  turno: TurnoDetallado | null
  medico: Medico
  pacientes: Paciente[]
  obrasSociales: string[]
  timeOptions: string[]
  slotDuracion: number
  fecha: string
  isSaving: boolean
  onClose: () => void
  onSubmit: (values: TurnoFormValues) => void
}

function AgendaTurnoFormDialog({
  turno,
  medico,
  pacientes,
  obrasSociales,
  timeOptions,
  slotDuracion,
  fecha,
  isSaving,
  onClose,
  onSubmit,
}: AgendaTurnoFormDialogProps) {
  const initialFormValues = turno
    ? mapTurnoToForm(turno)
    : buildNewTurnoValues(medico.id, fecha, pacientes, timeOptions[0])
  const [formDateInputValue, setFormDateInputValue] = useState(
    formatDateDisplay(initialFormValues.fecha),
  )
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
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
  } = useForm<TurnoFormValues>({
    defaultValues: initialFormValues,
  })
  const selectedPacienteId = watch('paciente_id')

  useEffect(() => {
    const nextValues = turno
      ? mapTurnoToForm(turno)
      : buildNewTurnoValues(medico.id, fecha, pacientes, timeOptions[0])

    reset(nextValues)
    setFormDateInputValue(formatDateDisplay(nextValues.fecha))
  }, [fecha, medico.id, pacientes, reset, timeOptions, turno])

  useEffect(() => {
    const paciente = pacientes.find((item) => item.id === selectedPacienteId)

    if (paciente) {
      setValue('obra_social', paciente.obra_social)
    }
  }, [pacientes, selectedPacienteId, setValue])

  const submitForm = handleSubmit((values) => {
    const parsedDisplayDate = parseDisplayDate(formDateInputValue)

    if (!parsedDisplayDate) {
      setError('fecha', { message: 'Ingresá una fecha válida en formato DD/MM/AAAA.' })
      return
    }

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

    onSubmit({
      ...parsed.data,
      fecha: parsedDisplayDate,
    })
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-clinical">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {turno ? 'Editar turno' : 'Nuevo turno'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {medico.nombre} · Consultorio {medico.consultorio}
          </p>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={submitForm}>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            <input type="hidden" {...register('medico_id')} />

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

              <FormField error={errors.fecha?.message} label="Fecha *">
                <input type="hidden" {...register('fecha')} />
                <input
                  className="form-input"
                  inputMode="numeric"
                  onBlur={() => {
                    if (!parseDisplayDate(formDateInputValue)) {
                      setError('fecha', {
                        message: 'Ingresá una fecha válida en formato DD/MM/AAAA.',
                      })
                    }
                  }}
                  onChange={(event) => {
                    const value = event.target.value
                    const parsedDate = parseDisplayDate(value)

                    setFormDateInputValue(value)

                    if (parsedDate) {
                      clearErrors('fecha')
                      setValue('fecha', parsedDate)
                    }
                  }}
                  placeholder="DD/MM/AAAA"
                  value={formDateInputValue}
                />
              </FormField>

              <FormField error={errors.hora?.message} label="Hora *">
                <input
                  className="form-input"
                  list="horarios-agenda-sugeridos"
                  step={slotDuracion * 60}
                  type="time"
                  {...register('hora')}
                />
                <datalist id="horarios-agenda-sugeridos">
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
              ) : (
                <input type="hidden" {...register('estado')} />
              )}
            </div>

            <FormField error={errors.notas?.message} label="Notas">
              <textarea className="form-input min-h-24 resize-y" {...register('notas')} />
            </FormField>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border bg-card p-5 sm:flex-row sm:justify-end">
            <Button disabled={isSaving} onClick={onClose} type="button" variant="outline">
              Cancelar
            </Button>
            <Button disabled={isSaving || !pacientes.length} type="submit">
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

function buildNewTurnoValues(
  medicoId: string,
  fecha: string,
  pacientes: Paciente[],
  suggestedStartTime?: string,
): TurnoFormValues {
  return {
    medico_id: medicoId,
    paciente_id: pacientes[0]?.id ?? '',
    fecha,
    hora: suggestedStartTime ?? DEFAULT_APP_SETTINGS.horarioInicio,
    obra_social: pacientes[0]?.obra_social ?? DEFAULT_APP_SETTINGS.obrasSociales[0],
    estado: 'pendiente',
    notas: '',
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
