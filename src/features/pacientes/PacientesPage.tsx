import { Pencil, Plus, Search, UserRoundCheck, UserRoundX } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useActualizarPaciente, useCrearPaciente, usePacientes } from '@/hooks/usePacientes'
import { pacienteSchema, type PacienteFormValues } from '@/lib/validators/schemas'
import type { Paciente } from '@/types'

const obrasSociales = ['OSDE', 'Swiss Medical', 'IAPS', 'IPS', 'PAMI', 'Galeno', 'Particular']

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
}

export function PacientesPage() {
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null)
  const filters = useMemo(() => ({ search }), [search])
  const pacientesQuery = usePacientes(filters)
  const crearPaciente = useCrearPaciente()
  const actualizarPaciente = useActualizarPaciente()

  const openCreateForm = () => {
    setEditingPaciente(null)
    setIsFormOpen(true)
  }

  const openEditForm = (paciente: Paciente) => {
    setEditingPaciente(paciente)
    setIsFormOpen(true)
  }

  const togglePacienteStatus = (paciente: Paciente) => {
    actualizarPaciente.mutate({
      id: paciente.id,
      input: {
        activo: !paciente.activo,
      },
    })
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
        description="Registro operativo de pacientes para crear turnos en modo demo."
        title="Pacientes"
      />

      <Card>
        <CardContent className="space-y-4 p-5">
          <label className="relative block max-w-xl">
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

          {pacientesQuery.isLoading ? (
            <EmptyState title="Cargando pacientes" />
          ) : pacientesQuery.data?.length ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[820px] border-collapse bg-card text-sm">
                <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Apellido y nombre</th>
                    <th className="px-4 py-3 font-semibold">DNI</th>
                    <th className="px-4 py-3 font-semibold">Obra social</th>
                    <th className="px-4 py-3 font-semibold">Teléfono</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pacientesQuery.data.map((paciente) => (
                    <tr className="hover:bg-accent/50" key={paciente.id}>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {paciente.apellido}, {paciente.nombre}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{paciente.dni}</td>
                      <td className="px-4 py-3 text-muted-foreground">{paciente.obra_social}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {paciente.telefono || 'Sin teléfono'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={paciente.activo ? 'success' : 'muted'}>
                          {paciente.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
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
              description="Probá cambiar el texto de búsqueda o creá un paciente nuevo."
              title="No hay pacientes que coincidan con los filtros"
            />
          )}
        </CardContent>
      </Card>

      {isFormOpen ? (
        <PacienteFormDialog
          isSaving={crearPaciente.isPending || actualizarPaciente.isPending}
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
  isSaving: boolean
  onClose: () => void
  onSubmit: (values: PacienteFormValues) => void
}

function PacienteFormDialog({ paciente, isSaving, onClose, onSubmit }: PacienteFormDialogProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<PacienteFormValues>({
    defaultValues: paciente ? mapPacienteToForm(paciente) : emptyValues,
  })

  useEffect(() => {
    reset(paciente ? mapPacienteToForm(paciente) : emptyValues)
  }, [paciente, reset])

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
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card shadow-clinical">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {paciente ? 'Editar paciente' : 'Nuevo paciente'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Completá los datos mínimos para operar turnos en el demo.
          </p>
        </div>

        <form className="space-y-4 p-5" onSubmit={submitForm}>
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
            <FormField error={errors.telefono?.message} label="Teléfono">
              <input className="form-input" {...register('telefono')} />
            </FormField>
            <FormField error={errors.email?.message} label="Email">
              <input className="form-input" type="email" {...register('email')} />
            </FormField>
            <FormField error={errors.obra_social?.message} label="Obra social *">
              <select className="form-input" {...register('obra_social')}>
                {obrasSociales.map((obraSocial) => (
                  <option key={obraSocial} value={obraSocial}>
                    {obraSocial}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField error={errors.notas?.message} label="Notas">
            <textarea className="form-input min-h-24 resize-y" {...register('notas')} />
          </FormField>

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
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
  }
}
