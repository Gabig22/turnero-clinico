import { CalendarDays, Pencil, Plus, Search, Stethoscope, UserRoundCheck, UserRoundX } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent } from '@/components/ui/card'
import {
  useActualizarMedico,
  useCrearMedico,
  useMedicos,
  useToggleMedico,
} from '@/hooks/useMedicos'
import { useAppSettings } from '@/hooks/useSettings'
import { DEFAULT_APP_SETTINGS } from '@/lib/storage/settingsStorage'
import { medicoSchema, type MedicoFormValues } from '@/lib/validators/schemas'
import type { Medico } from '@/types'

const diasDisponibles = [
  { value: 'L', label: 'L' },
  { value: 'Ma', label: 'Ma' },
  { value: 'Mi', label: 'Mi' },
  { value: 'J', label: 'J' },
  { value: 'V', label: 'V' },
  { value: 'S', label: 'S' },
]

const emptyValues: MedicoFormValues = {
  nombre: '',
  especialidad: '',
  consultorio: '',
  matricula: '',
  telefono: '',
  email: '',
  obras_sociales: [],
  dias_disponibles: ['L', 'Ma', 'Mi', 'J', 'V'],
  activo: true,
}

export function MedicosPage() {
  const [search, setSearch] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [estado, setEstado] = useState<'todos' | 'activo' | 'inactivo'>('todos')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMedico, setEditingMedico] = useState<Medico | null>(null)
  const filters = useMemo(() => ({ search, especialidad, estado }), [search, especialidad, estado])
  const medicosQuery = useMedicos(filters)
  const allMedicosQuery = useMedicos()
  const appSettingsQuery = useAppSettings()
  const crearMedico = useCrearMedico()
  const actualizarMedico = useActualizarMedico()
  const toggleMedico = useToggleMedico()
  const obrasSociales = appSettingsQuery.data?.obrasSociales ?? DEFAULT_APP_SETTINGS.obrasSociales
  const especialidades = useMemo(
    () =>
      Array.from(new Set(allMedicosQuery.data?.map((medico) => medico.especialidad) ?? [])).sort(
        (a, b) => a.localeCompare(b, 'es'),
      ),
    [allMedicosQuery.data],
  )

  const openCreateForm = () => {
    setEditingMedico(null)
    setIsFormOpen(true)
  }

  const openEditForm = (medico: Medico) => {
    setEditingMedico(medico)
    setIsFormOpen(true)
  }

  const toggleMedicoStatus = (medico: Medico) => {
    const action = medico.activo ? 'desactivar' : 'activar'

    if (window.confirm(`¿Querés ${action} a ${medico.nombre}?`)) {
      toggleMedico.mutate(medico.id)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button onClick={openCreateForm}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            Nuevo médico
          </Button>
        }
        description="Gestión de profesionales, consultorios, días disponibles y obras sociales."
        title="Médicos"
      />

      <Card>
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_170px]">
            <label className="relative block">
              <span className="sr-only">Buscar médicos</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, especialidad o consultorio"
                value={search}
              />
            </label>

            <select
              className="form-input"
              onChange={(event) => setEspecialidad(event.target.value)}
              value={especialidad}
            >
              <option value="">Todas las especialidades</option>
              {especialidades.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              className="form-input"
              onChange={(event) => setEstado(event.target.value as 'todos' | 'activo' | 'inactivo')}
              value={estado}
            >
              <option value="todos">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>

          {medicosQuery.isLoading ? (
            <EmptyState icon={Stethoscope} title="Cargando médicos" />
          ) : medicosQuery.data?.length ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[980px] border-collapse bg-card text-sm">
                <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="w-[26%] px-4 py-3 font-semibold">Médico</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">Consultorio</th>
                    <th className="w-[17%] px-4 py-3 font-semibold">Días</th>
                    <th className="w-[20%] px-4 py-3 font-semibold">Obras sociales</th>
                    <th className="w-[20%] px-4 py-3 font-semibold">Contacto</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">Estado</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border align-middle">
                  {medicosQuery.data.map((medico) => (
                    <tr className="hover:bg-accent/50" key={medico.id}>
                      <td className="px-4 py-3">
                        <p className="max-w-[260px] whitespace-normal text-sm font-semibold leading-5 text-foreground">
                          {medico.nombre}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {medico.especialidad}
                          {medico.matricula ? ` · ${medico.matricula}` : ''}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                        Consultorio {medico.consultorio}
                      </td>
                      <td className="px-4 py-3">
                        <ChipList items={medico.dias_disponibles?.length ? medico.dias_disponibles : ['L', 'Ma', 'Mi', 'J', 'V', 'S']} />
                      </td>
                      <td className="px-4 py-3">
                        <ChipList items={medico.obras_sociales ?? []} maxVisible={3} />
                      </td>
                      <td className="px-4 py-3 text-xs leading-5 text-muted-foreground">
                        <p>{medico.telefono || '-'}</p>
                        <p className="max-w-[220px] truncate">{medico.email || '-'}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge variant={medico.activo ? 'success' : 'muted'}>
                          {medico.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link
                            className={buttonVariants({ variant: 'outline', size: 'sm' })}
                            to={`/agenda/${medico.id}`}
                          >
                            <CalendarDays aria-hidden="true" className="h-4 w-4" />
                            Agenda
                          </Link>
                          <Button onClick={() => openEditForm(medico)} size="sm" variant="outline">
                            <Pencil aria-hidden="true" className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button onClick={() => toggleMedicoStatus(medico)} size="sm" variant="ghost">
                            {medico.activo ? (
                              <UserRoundX aria-hidden="true" className="h-4 w-4" />
                            ) : (
                              <UserRoundCheck aria-hidden="true" className="h-4 w-4" />
                            )}
                            {medico.activo ? 'Desactivar' : 'Activar'}
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
              description="Probá cambiar los filtros o crear un médico nuevo."
              icon={Stethoscope}
              title="No hay médicos que coincidan con los filtros"
            />
          )}
        </CardContent>
      </Card>

      {isFormOpen ? (
        <MedicoFormDialog
          isSaving={crearMedico.isPending || actualizarMedico.isPending}
          medico={editingMedico}
          obrasSociales={obrasSociales}
          onClose={() => setIsFormOpen(false)}
          onSubmit={(values) => {
            if (editingMedico) {
              actualizarMedico.mutate(
                { id: editingMedico.id, input: values },
                { onSuccess: () => setIsFormOpen(false) },
              )
              return
            }

            crearMedico.mutate(values, { onSuccess: () => setIsFormOpen(false) })
          }}
        />
      ) : null}
    </div>
  )
}

type MedicoFormDialogProps = {
  medico: Medico | null
  obrasSociales: string[]
  isSaving: boolean
  onClose: () => void
  onSubmit: (values: MedicoFormValues) => void
}

function MedicoFormDialog({
  medico,
  obrasSociales,
  isSaving,
  onClose,
  onSubmit,
}: MedicoFormDialogProps) {
  const availableObrasSociales = useMemo(
    () =>
      Array.from(new Set([...obrasSociales, ...(medico?.obras_sociales ?? [])])).sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [medico?.obras_sociales, obrasSociales],
  )
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<MedicoFormValues>({
    defaultValues: medico ? mapMedicoToForm(medico) : emptyValues,
  })

  useEffect(() => {
    reset(medico ? mapMedicoToForm(medico) : emptyValues)
  }, [medico, reset])

  const submitForm = handleSubmit((values) => {
    const parsed = medicoSchema.safeParse(values)

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]

        if (typeof fieldName === 'string') {
          setError(fieldName as keyof MedicoFormValues, { message: issue.message })
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
            {medico ? 'Editar médico' : 'Nuevo médico'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Definí datos profesionales, consultorio y disponibilidad.
          </p>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={submitForm}>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField error={errors.nombre?.message} label="Nombre *">
                <input className="form-input" {...register('nombre')} />
              </FormField>
              <FormField error={errors.especialidad?.message} label="Especialidad *">
                <input className="form-input" {...register('especialidad')} />
              </FormField>
              <FormField error={errors.consultorio?.message} label="Consultorio *">
                <input className="form-input" {...register('consultorio')} />
              </FormField>
              <FormField error={errors.matricula?.message} label="Matrícula">
                <input className="form-input" {...register('matricula')} />
              </FormField>
              <FormField error={errors.telefono?.message} label="Teléfono">
                <input className="form-input" {...register('telefono')} />
              </FormField>
              <FormField error={errors.email?.message} label="Email">
                <input className="form-input" type="email" {...register('email')} />
              </FormField>
            </div>

            <CheckboxGroup
              error={errors.dias_disponibles?.message}
              items={diasDisponibles}
              label="Días disponibles"
              register={register}
              registerName="dias_disponibles"
            />

            <CheckboxGroup
              error={errors.obras_sociales?.message}
              items={availableObrasSociales.map((item) => ({ value: item, label: item }))}
              label="Obras sociales"
              register={register}
              registerName="obras_sociales"
            />

            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input className="h-4 w-4 accent-primary" type="checkbox" {...register('activo')} />
              Médico activo
            </label>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border bg-card p-5 sm:flex-row sm:justify-end">
            <Button disabled={isSaving} onClick={onClose} type="button" variant="outline">
              Cancelar
            </Button>
            <Button disabled={isSaving} type="submit">
              {isSaving ? 'Guardando...' : medico ? 'Guardar cambios' : 'Crear médico'}
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

type CheckboxGroupProps = {
  label: string
  items: Array<{ value: string; label: string }>
  registerName: 'dias_disponibles' | 'obras_sociales'
  register: ReturnType<typeof useForm<MedicoFormValues>>['register']
  error?: string
}

function CheckboxGroup({ label, items, registerName, register, error }: CheckboxGroupProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-foreground">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <label
            className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground"
            key={item.value}
          >
            <input
              className="h-4 w-4 accent-primary"
              type="checkbox"
              value={item.value}
              {...register(registerName)}
            />
            {item.label}
          </label>
        ))}
      </div>
      {error ? <span className="mt-1 block text-xs font-medium text-destructive">{error}</span> : null}
    </fieldset>
  )
}

function ChipList({ items, maxVisible = 6 }: { items: string[]; maxVisible?: number }) {
  const visibleItems = items.slice(0, maxVisible)
  const hiddenCount = Math.max(items.length - visibleItems.length, 0)

  if (!items.length) {
    return <span className="text-xs text-muted-foreground">Sin datos</span>
  }

  return (
    <div className="flex max-w-[260px] flex-wrap gap-1.5">
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

function mapMedicoToForm(medico: Medico): MedicoFormValues {
  return {
    nombre: medico.nombre,
    especialidad: medico.especialidad,
    consultorio: medico.consultorio,
    matricula: medico.matricula ?? '',
    telefono: medico.telefono ?? '',
    email: medico.email ?? '',
    obras_sociales: medico.obras_sociales ?? [],
    dias_disponibles: medico.dias_disponibles ?? [],
    activo: medico.activo,
  }
}
