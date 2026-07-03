import { differenceInYears, parseISO } from 'date-fns'
import { CalendarDays, Pencil, Search, UsersRound } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent } from '@/components/ui/card'
import { PacienteFormDialog } from '@/features/pacientes/PacientesPage'
import { useDoctorDemo, useDoctorPatients } from '@/hooks/useDoctorDemo'
import { useActualizarPaciente } from '@/hooks/usePacientes'
import { useAppSettings } from '@/hooks/useSettings'
import { useConfirmarConflictoTurno, useCrearTurno } from '@/hooks/useTurnos'
import { formatDateDisplay } from '@/lib/dates/displayDate'
import { generateTimeOptions } from '@/lib/dates/timeSlots'
import { DEFAULT_APP_SETTINGS } from '@/lib/storage/settingsStorage'
import { turnoSchema, type PacienteFormValues, type TurnoFormValues } from '@/lib/validators/schemas'
import type { Medico, Paciente, TurnoDetallado } from '@/types'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function DoctorPacientesPage() {
  const [search, setSearch] = useState('')
  const [obraSocial, setObraSocial] = useState('')
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null)
  const [turnoPaciente, setTurnoPaciente] = useState<Paciente | null>(null)
  const { selectedMedico, selectedMedicoId, isLoading: isDoctorLoading } = useDoctorDemo()
  const patientsQuery = useDoctorPatients(selectedMedicoId)
  const actualizarPaciente = useActualizarPaciente()
  const confirmarConflictoTurno = useConfirmarConflictoTurno()
  const crearTurno = useCrearTurno()
  const appSettingsQuery = useAppSettings()
  const appSettings = appSettingsQuery.data ?? DEFAULT_APP_SETTINGS
  const obrasSociales = useMemo(() => {
    const fromSettings = appSettings.obrasSociales
    const fromPatients = patientsQuery.pacientes
      .map((item) => item.paciente?.obra_social)
      .filter((value): value is string => Boolean(value))

    return Array.from(new Set([...fromSettings, ...fromPatients])).sort((a, b) =>
      a.localeCompare(b, 'es'),
    )
  }, [appSettings.obrasSociales, patientsQuery.pacientes])
  const timeOptions = useMemo(
    () =>
      generateTimeOptions(
        appSettings.horarioInicio,
        appSettings.horarioFin,
        appSettings.slotDuracion,
      ),
    [appSettings.horarioFin, appSettings.horarioInicio, appSettings.slotDuracion],
  )
  const filteredPatients = useMemo(() => {
    const normalizedSearch = normalizeText(search)

    return patientsQuery.pacientes.filter((item) => {
      const paciente = item.paciente

      if (!paciente) {
        return false
      }

      const matchesSearch = normalizedSearch
        ? normalizeText(`${paciente.nombre} ${paciente.apellido} ${paciente.dni}`).includes(
            normalizedSearch,
          )
        : true
      const matchesObraSocial = obraSocial ? paciente.obra_social === obraSocial : true

      return matchesSearch && matchesObraSocial
    })
  }, [obraSocial, patientsQuery.pacientes, search])

  if (isDoctorLoading) {
    return <EmptyState icon={UsersRound} title="Cargando pacientes del médico" />
  }

  if (!selectedMedicoId || !selectedMedico) {
    return (
      <EmptyState
        description="Seleccioná un médico demo desde el portal médico para ver sus pacientes."
        icon={UsersRound}
        title="No hay médico demo seleccionado"
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link className={buttonVariants({ variant: 'outline' })} to="/doctor/agenda">
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            Mi agenda
          </Link>
        }
        description={`Pacientes con turnos asociados a ${selectedMedico.nombre}`}
        title="Mis Pacientes"
      />

      <Card>
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
            <label className="relative block">
              <span className="sr-only">Buscar pacientes</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, apellido o DNI"
                value={search}
              />
            </label>

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
          </div>

          {patientsQuery.isLoading ? (
            <EmptyState icon={UsersRound} title="Cargando pacientes" />
          ) : filteredPatients.length ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[1040px] border-collapse bg-card text-sm">
                <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="w-[24%] px-4 py-3 font-semibold">Paciente</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">DNI</th>
                    <th className="px-4 py-3 font-semibold">Obra social</th>
                    <th className="px-4 py-3 font-semibold">Contacto</th>
                    <th className="px-4 py-3 font-semibold">Último turno</th>
                    <th className="px-4 py-3 font-semibold">Próximo turno</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">Estado</th>
                    <th className="w-[116px] whitespace-nowrap px-3 py-3 text-center font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border align-middle">
                  {filteredPatients.map(({ paciente, ultimoTurno, proximoTurno }) => {
                    if (!paciente) {
                      return null
                    }

                    return (
                      <tr className="hover:bg-accent/50" key={paciente.id}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground">
                            {paciente.apellido}, {paciente.nombre}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{getEdad(paciente)}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {paciente.dni}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {paciente.obra_social}
                        </td>
                        <td className="px-4 py-3 text-xs leading-5 text-muted-foreground">
                          <p>{paciente.telefono || 'Sin teléfono'}</p>
                          <p className="max-w-[220px] truncate">{paciente.email || '-'}</p>
                        </td>
                        <td className="px-4 py-3">{renderTurnoSummary(ultimoTurno)}</td>
                        <td className="px-4 py-3">{renderTurnoSummary(proximoTurno)}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <Badge variant={paciente.activo ? 'success' : 'muted'}>
                            {paciente.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-center gap-1.5">
                            <Button
                              aria-label={`Crear turno para ${paciente.apellido}, ${paciente.nombre}`}
                              className="h-8 w-8 p-0"
                              disabled={!paciente.activo}
                              onClick={() => setTurnoPaciente(paciente)}
                              size="sm"
                              title={paciente.activo ? 'Nuevo turno' : 'Paciente inactivo'}
                              variant="outline"
                            >
                              <CalendarDays aria-hidden="true" className="h-4 w-4" />
                            </Button>
                            <Button
                              aria-label={`Editar paciente ${paciente.apellido}, ${paciente.nombre}`}
                              className="h-8 w-8 p-0"
                              onClick={() => setEditingPaciente(paciente)}
                              size="sm"
                              title="Editar paciente"
                              variant="outline"
                            >
                              <Pencil aria-hidden="true" className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              description="No hay pacientes asociados a este médico con los filtros actuales."
              icon={UsersRound}
              title="Sin pacientes asociados"
            />
          )}
        </CardContent>
      </Card>

      {editingPaciente ? (
        <PacienteFormDialog
          isSaving={actualizarPaciente.isPending}
          obrasSociales={obrasSociales}
          onClose={() => setEditingPaciente(null)}
          onSubmit={(values: PacienteFormValues) => {
            actualizarPaciente.mutate(
              { id: editingPaciente.id, input: values },
              { onSuccess: () => setEditingPaciente(null) },
            )
          }}
          paciente={editingPaciente}
        />
      ) : null}

      {turnoPaciente ? (
        <NuevoTurnoPacienteDialog
          isSaving={crearTurno.isPending}
          medico={selectedMedico}
          obrasSociales={obrasSociales}
          onClose={() => setTurnoPaciente(null)}
          onSubmit={async (values) => {
            const shouldSave = await confirmarConflictoTurno({
              medico_id: values.medico_id,
              fecha: values.fecha,
              hora: values.hora,
            })

            if (!shouldSave) {
              return
            }

            crearTurno.mutate(values, { onSuccess: () => setTurnoPaciente(null) })
          }}
          paciente={turnoPaciente}
          slotDuracion={appSettings.slotDuracion}
          timeOptions={timeOptions}
        />
      ) : null}
    </div>
  )
}

type NuevoTurnoPacienteDialogProps = {
  paciente: Paciente
  medico: Medico
  obrasSociales: string[]
  timeOptions: string[]
  slotDuracion: number
  isSaving: boolean
  onClose: () => void
  onSubmit: (values: TurnoFormValues) => Promise<void> | void
}

function NuevoTurnoPacienteDialog({
  paciente,
  medico,
  obrasSociales,
  timeOptions,
  slotDuracion,
  isSaving,
  onClose,
  onSubmit,
}: NuevoTurnoPacienteDialogProps) {
  const availableObrasSociales = useMemo(
    () => Array.from(new Set([...obrasSociales, paciente.obra_social])).sort((a, b) =>
      a.localeCompare(b, 'es'),
    ),
    [obrasSociales, paciente.obra_social],
  )
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<TurnoFormValues>({
    defaultValues: buildTurnoForPaciente(paciente, medico, timeOptions[0]),
  })

  useEffect(() => {
    reset(buildTurnoForPaciente(paciente, medico, timeOptions[0]))
  }, [medico, paciente, reset, timeOptions])

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
          <h2 className="text-lg font-semibold text-foreground">Nuevo turno</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {paciente.apellido}, {paciente.nombre} · {medico.nombre}
          </p>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={submitForm}>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            <input type="hidden" {...register('paciente_id')} />
            <input type="hidden" {...register('medico_id')} />
            <input type="hidden" {...register('estado')} />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Paciente">
                <input
                  className="form-input bg-muted/40"
                  disabled
                  value={`${paciente.apellido}, ${paciente.nombre}`}
                />
              </FormField>
              <FormField label="Médico">
                <input className="form-input bg-muted/40" disabled value={medico.nombre} />
              </FormField>
              <FormField error={errors.fecha?.message} label="Fecha *">
                <input className="form-input" type="date" {...register('fecha')} />
              </FormField>
              <FormField error={errors.hora?.message} label="Hora *">
                <input
                  className="form-input"
                  list="horarios-paciente-sugeridos"
                  step={slotDuracion * 60}
                  type="time"
                  {...register('hora')}
                />
                <datalist id="horarios-paciente-sugeridos">
                  {timeOptions.map((time) => (
                    <option key={time} value={time} />
                  ))}
                </datalist>
              </FormField>
              <FormField error={errors.obra_social?.message} label="Obra social *">
                <select className="form-input" {...register('obra_social')}>
                  {availableObrasSociales.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField error={errors.notas?.message} label="Notas">
              <textarea className="form-input min-h-24 resize-y" {...register('notas')} />
            </FormField>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border bg-card p-5 sm:flex-row sm:justify-end">
            <Button disabled={isSaving} onClick={onClose} type="button" variant="outline">
              Cancelar
            </Button>
            <Button disabled={isSaving || !paciente.activo || !medico.activo} type="submit">
              {isSaving ? 'Guardando...' : 'Crear turno'}
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

function renderTurnoSummary(turno: TurnoDetallado | null) {
  if (!turno) {
    return <span className="text-xs text-muted-foreground">Sin datos</span>
  }

  return (
    <div className="space-y-1">
      <p className="whitespace-nowrap text-sm font-medium text-foreground">
        {formatDateDisplay(turno.fecha)} · {turno.hora}
      </p>
      <StatusBadge estado={turno.estado} />
    </div>
  )
}

function buildTurnoForPaciente(
  paciente: Paciente,
  medico: Medico,
  suggestedStartTime?: string,
): TurnoFormValues {
  return {
    paciente_id: paciente.id,
    medico_id: medico.id,
    fecha: todayKey(),
    hora: suggestedStartTime ?? DEFAULT_APP_SETTINGS.horarioInicio,
    obra_social: paciente.obra_social,
    estado: 'pendiente',
    notas: '',
  }
}

function getEdad(paciente: Paciente) {
  if (!paciente.fecha_nacimiento) {
    return 'Sin fecha de nacimiento'
  }

  return `${differenceInYears(new Date(), parseISO(paciente.fecha_nacimiento))} años`
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('es-AR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}
