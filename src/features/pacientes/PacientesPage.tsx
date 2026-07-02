import { differenceInYears, parseISO } from 'date-fns'
import { Pencil, Plus, Search, UserRoundCheck, UserRoundX } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  useActualizarPaciente,
  useCrearPaciente,
  usePacientes,
  useTogglePaciente,
} from '@/hooks/usePacientes'
import { useAppSettings } from '@/hooks/useSettings'
import { DEFAULT_APP_SETTINGS } from '@/lib/storage/settingsStorage'
import { pacienteSchema, type PacienteFormValues } from '@/lib/validators/schemas'
import type { Paciente } from '@/types'

const emptyValues: PacienteFormValues = {
  nombre: '',
  apellido: '',
  dni: '',
  obra_social: 'Particular',
  telefono: '',
  email: '',
  notas: '',
  fecha_nacimiento: '',
  fecha_alta: '',
  activo: true,
}

export function PacientesPage() {
  const [search, setSearch] = useState('')
  const [obraSocial, setObraSocial] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null)
  const filters = useMemo(() => ({ search, obra_social: obraSocial }), [search, obraSocial])
  const pacientesQuery = usePacientes(filters)
  const todosPacientesQuery = usePacientes()
  const appSettingsQuery = useAppSettings()
  const crearPaciente = useCrearPaciente()
  const actualizarPaciente = useActualizarPaciente()
  const togglePaciente = useTogglePaciente()
  const obrasSociales = useMemo(() => {
    const fromSettings = appSettingsQuery.data?.obrasSociales ?? DEFAULT_APP_SETTINGS.obrasSociales
    const fromPacientes = todosPacientesQuery.data?.map((paciente) => paciente.obra_social) ?? []
    return Array.from(new Set([...fromSettings, ...fromPacientes])).sort((a, b) =>
      a.localeCompare(b, 'es'),
    )
  }, [appSettingsQuery.data, todosPacientesQuery.data])

  const openCreateForm = () => {
    setEditingPaciente(null)
    setIsFormOpen(true)
  }

  const openEditForm = (paciente: Paciente) => {
    setEditingPaciente(paciente)
    setIsFormOpen(true)
  }

  const togglePacienteStatus = (paciente: Paciente) => {
    const action = paciente.activo ? 'desactivar' : 'activar'

    if (window.confirm(`¿Querés ${action} a ${paciente.apellido}, ${paciente.nombre}?`)) {
      togglePaciente.mutate(paciente.id)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button onClick={openCreateForm}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            Nuevo paciente
          </Button>
        }
        description="Registro operativo de pacientes para crear y administrar turnos en modo demo."
        title="Pacientes"
      />

      <Card>
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
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

          {pacientesQuery.isLoading ? (
            <EmptyState title="Cargando pacientes" />
          ) : pacientesQuery.data?.length ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[820px] border-collapse bg-card text-sm">
                <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="w-[28%] px-4 py-3 font-semibold">Paciente</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">DNI</th>
                    <th className="px-4 py-3 font-semibold">Obra social</th>
                    <th className="w-[26%] px-4 py-3 font-semibold">Contacto</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">Estado</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border align-middle">
                  {pacientesQuery.data.map((paciente) => (
                    <tr className="hover:bg-accent/50" key={paciente.id}>
                      <td className="px-4 py-3">
                        <p className="max-w-[260px] whitespace-normal text-sm font-semibold leading-5 text-foreground">
                          {paciente.apellido}, {paciente.nombre}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{getEdad(paciente)}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                        {paciente.dni}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <span className="inline-flex max-w-[180px] whitespace-normal leading-5">
                          {paciente.obra_social}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs leading-5 text-muted-foreground">
                        <p>{paciente.telefono || 'Sin teléfono'}</p>
                        <p className="max-w-[240px] truncate">{paciente.email || '-'}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge variant={paciente.activo ? 'success' : 'muted'}>
                          {paciente.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button onClick={() => openEditForm(paciente)} size="sm" variant="outline">
                            <Pencil aria-hidden="true" className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            onClick={() => togglePacienteStatus(paciente)}
                            size="sm"
                            variant="ghost"
                          >
                            {paciente.activo ? (
                              <UserRoundX aria-hidden="true" className="h-4 w-4" />
                            ) : (
                              <UserRoundCheck aria-hidden="true" className="h-4 w-4" />
                            )}
                            {paciente.activo ? 'Desactivar' : 'Activar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              description="Probá cambiar los filtros o creá un paciente nuevo."
              title="No hay pacientes que coincidan con los filtros"
            />
          )}
        </CardContent>
      </Card>

      {isFormOpen ? (
        <PacienteFormDialog
          isSaving={crearPaciente.isPending || actualizarPaciente.isPending}
          obrasSociales={obrasSociales}
          onClose={() => setIsFormOpen(false)}
          onSubmit={(values) => {
            if (editingPaciente) {
              actualizarPaciente.mutate(
                { id: editingPaciente.id, input: values },
                { onSuccess: () => setIsFormOpen(false) },
              )
              return
            }

            crearPaciente.mutate(values, { onSuccess: () => setIsFormOpen(false) })
          }}
          paciente={editingPaciente}
        />
      ) : null}
    </div>
  )
}

type PacienteFormDialogProps = {
  paciente: Paciente | null
  obrasSociales: string[]
  isSaving: boolean
  onClose: () => void
  onSubmit: (values: PacienteFormValues) => void
}

function PacienteFormDialog({
  paciente,
  obrasSociales,
  isSaving,
  onClose,
  onSubmit,
}: PacienteFormDialogProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<PacienteFormValues>({
    defaultValues: paciente ? mapPacienteToForm(paciente) : buildEmptyPacienteValues(obrasSociales),
  })

  useEffect(() => {
    reset(paciente ? mapPacienteToForm(paciente) : buildEmptyPacienteValues(obrasSociales))
  }, [obrasSociales, paciente, reset])

  const submitForm = handleSubmit((values) => {
    const parsed = pacienteSchema.safeParse(values)

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]

        if (typeof fieldName === 'string') {
          setError(fieldName as keyof PacienteFormValues, { message: issue.message })
        }
      })
      return
    }

    onSubmit(parsed.data)
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-clinical">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {paciente ? 'Editar paciente' : 'Nuevo paciente'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Completá los datos de registro clínico del paciente.
          </p>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={submitForm}>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField error={errors.nombre?.message} label="Nombre *">
                <input className="form-input" {...register('nombre')} />
              </FormField>
              <FormField error={errors.apellido?.message} label="Apellido *">
                <input className="form-input" {...register('apellido')} />
              </FormField>
              <FormField error={errors.dni?.message} label="DNI *">
                <input className="form-input" {...register('dni')} />
              </FormField>
              <FormField error={errors.obra_social?.message} label="Obra social *">
                <select className="form-input" {...register('obra_social')}>
                  {obrasSociales.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField error={errors.telefono?.message} label="Teléfono">
                <input className="form-input" {...register('telefono')} />
              </FormField>
              <FormField error={errors.email?.message} label="Email">
                <input className="form-input" type="email" {...register('email')} />
              </FormField>
              <FormField error={errors.fecha_nacimiento?.message} label="Fecha de nacimiento">
                <input className="form-input" type="date" {...register('fecha_nacimiento')} />
              </FormField>
              <FormField error={errors.fecha_alta?.message} label="Fecha de alta">
                <input className="form-input" type="date" {...register('fecha_alta')} />
              </FormField>
            </div>

            <FormField error={errors.notas?.message} label="Notas">
              <textarea className="form-input min-h-24 resize-y" {...register('notas')} />
            </FormField>

            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input className="h-4 w-4 accent-primary" type="checkbox" {...register('activo')} />
              Paciente activo
            </label>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border bg-card p-5 sm:flex-row sm:justify-end">
            <Button disabled={isSaving} onClick={onClose} type="button" variant="outline">
              Cancelar
            </Button>
            <Button disabled={isSaving} type="submit">
              {isSaving ? 'Guardando...' : paciente ? 'Guardar cambios' : 'Crear paciente'}
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

function buildEmptyPacienteValues(obrasSociales: string[]): PacienteFormValues {
  return {
    ...emptyValues,
    obra_social: obrasSociales[0] ?? DEFAULT_APP_SETTINGS.obrasSociales[0],
  }
}

function mapPacienteToForm(paciente: Paciente): PacienteFormValues {
  return {
    nombre: paciente.nombre,
    apellido: paciente.apellido,
    dni: paciente.dni,
    obra_social: paciente.obra_social,
    telefono: paciente.telefono ?? '',
    email: paciente.email ?? '',
    notas: paciente.notas ?? '',
    fecha_nacimiento: paciente.fecha_nacimiento ?? '',
    fecha_alta: paciente.fecha_alta ?? '',
    activo: paciente.activo,
  }
}

function getEdad(paciente: Paciente) {
  if (!paciente.fecha_nacimiento) {
    return 'Sin fecha de nacimiento'
  }

  return `${differenceInYears(new Date(), parseISO(paciente.fecha_nacimiento))} años`
}
