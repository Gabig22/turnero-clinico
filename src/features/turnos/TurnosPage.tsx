import { CalendarClock, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useMedicos } from '@/hooks/useMedicos'
import { usePacientes } from '@/hooks/usePacientes'
import { useCambiarEstadoTurno, useCrearTurno, useTurnos } from '@/hooks/useTurnos'
import { turnoSchema, type TurnoFormValues } from '@/lib/validators/schemas'
import type { Medico, Paciente, TurnoEstado } from '@/types'

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
  notas: '',
}

export function TurnosPage() {
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<TurnoEstado | 'todos'>('todos')
  const [fecha, setFecha] = useState(todayKey())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const filters = useMemo(() => ({ search, estado, fecha }), [search, estado, fecha])
  const turnosQuery = useTurnos(filters)
  const pacientesQuery = usePacientes()
  const medicosQuery = useMedicos()
  const crearTurno = useCrearTurno()
  const cambiarEstado = useCambiarEstadoTurno()

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            Nuevo turno
          </Button>
        }
        description="Gestión simple de turnos sobre datos demo persistidos en el navegador."
        title="Turnos"
      />

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
            <label className="relative block">
              <span className="sr-only">Buscar turnos</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por paciente o médico"
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
          </div>

          {turnosQuery.isLoading ? (
            <EmptyState title="Cargando turnos" />
          ) : turnosQuery.data?.length ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[1080px] border-collapse bg-card text-sm">
                <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold">Hora</th>
                    <th className="px-4 py-3 font-semibold">Paciente</th>
                    <th className="px-4 py-3 font-semibold">Obra social</th>
                    <th className="px-4 py-3 font-semibold">Médico</th>
                    <th className="px-4 py-3 font-semibold">Consultorio</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {turnosQuery.data.map((turno) => (
                    <tr className="hover:bg-accent/50" key={turno.id}>
                      <td className="px-4 py-3 text-muted-foreground">{turno.fecha}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{turno.hora}</td>
                      <td className="px-4 py-3 text-foreground">
                        {turno.paciente
                          ? `${turno.paciente.apellido}, ${turno.paciente.nombre}`
                          : 'Paciente sin datos'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{turno.obra_social}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {turno.medico?.nombre ?? 'Médico sin datos'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {turno.consultorio_cache ?? turno.medico?.consultorio ?? '-'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge estado={turno.estado} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <select
                            className="h-9 rounded-md border border-input bg-card px-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
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
          isSaving={crearTurno.isPending}
          medicos={medicosQuery.data ?? []}
          onClose={() => setIsFormOpen(false)}
          onSubmit={(values) => {
            crearTurno.mutate(values, { onSuccess: () => setIsFormOpen(false) })
          }}
          pacientes={pacientesQuery.data ?? []}
        />
      ) : null}
    </div>
  )
}

type TurnoFormDialogProps = {
  pacientes: Paciente[]
  medicos: Medico[]
  isSaving: boolean
  onClose: () => void
  onSubmit: (values: TurnoFormValues) => void
}

function TurnoFormDialog({
  pacientes,
  medicos,
  isSaving,
  onClose,
  onSubmit,
}: TurnoFormDialogProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
    watch,
  } = useForm<TurnoFormValues>({
    defaultValues: {
      ...emptyValues,
      paciente_id: pacientes[0]?.id ?? '',
      medico_id: medicos[0]?.id ?? '',
      obra_social: pacientes[0]?.obra_social ?? '',
    },
  })
  const selectedPacienteId = watch('paciente_id')

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
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card shadow-clinical">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">Nuevo turno</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Seleccioná paciente, médico, fecha y hora para guardar el turno.
          </p>
        </div>

        <form className="space-y-4 p-5" onSubmit={submitForm}>
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
              <input className="form-input" step="300" type="time" {...register('hora')} />
            </FormField>

            <FormField error={errors.obra_social?.message} label="Obra social *">
              <input className="form-input" {...register('obra_social')} />
            </FormField>
          </div>

          <FormField error={errors.notas?.message} label="Notas">
            <textarea className="form-input min-h-24 resize-y" {...register('notas')} />
          </FormField>

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button disabled={isSaving} onClick={onClose} type="button" variant="outline">
              Cancelar
            </Button>
            <Button disabled={isSaving || !pacientes.length || !medicos.length} type="submit">
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
