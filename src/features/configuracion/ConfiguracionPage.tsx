import { Bell, Building2, Clock3, RotateCcw, Settings, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useResetDemoData } from '@/hooks/useDashboard'
import { usePacientes } from '@/hooks/usePacientes'
import {
  useAppSettings,
  useResetAppSettings,
  useResetTurneroSettings,
  useTurneroSettings,
  useUpdateAppSettings,
  useUpdateTurneroSettings,
} from '@/hooks/useSettings'
import { useTurnos } from '@/hooks/useTurnos'
import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_TURNERO_SETTINGS,
} from '@/lib/storage/settingsStorage'
import { appSettingsSchema, type AppSettingsFormValues } from '@/lib/validators/schemas'

const slotOptions = [15, 20, 30, 40] as const

export function ConfiguracionPage() {
  const appSettingsQuery = useAppSettings()
  const turneroSettingsQuery = useTurneroSettings()
  const pacientesQuery = usePacientes()
  const turnosQuery = useTurnos()
  const updateAppSettings = useUpdateAppSettings()
  const updateTurneroSettings = useUpdateTurneroSettings()
  const resetAppSettings = useResetAppSettings()
  const resetTurneroSettings = useResetTurneroSettings()
  const resetDemoData = useResetDemoData()
  const appSettings = appSettingsQuery.data ?? DEFAULT_APP_SETTINGS
  const turneroSettings = turneroSettingsQuery.data ?? DEFAULT_TURNERO_SETTINGS
  const [newObraSocial, setNewObraSocial] = useState('')
  const obrasSocialesEnUso = useMemo(() => {
    const used = new Set<string>()

    pacientesQuery.data?.forEach((paciente) => used.add(paciente.obra_social))
    turnosQuery.data?.forEach((turno) => used.add(turno.obra_social))

    return used
  }, [pacientesQuery.data, turnosQuery.data])

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<AppSettingsFormValues>({
    defaultValues: appSettings,
  })

  useEffect(() => {
    reset(appSettings)
  }, [appSettings, reset])

  const submitParameters = handleSubmit((values) => {
    const parsed = appSettingsSchema.safeParse({
      ...values,
      obrasSociales: appSettings.obrasSociales,
    })

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]

        if (typeof fieldName === 'string') {
          setError(fieldName as keyof AppSettingsFormValues, { message: issue.message })
        }
      })
      return
    }

    updateAppSettings.mutate(parsed.data)
  })

  const restoreParameters = () => {
    updateAppSettings.mutate({
      horarioInicio: DEFAULT_APP_SETTINGS.horarioInicio,
      horarioFin: DEFAULT_APP_SETTINGS.horarioFin,
      slotDuracion: DEFAULT_APP_SETTINGS.slotDuracion,
    })
  }

  const addObraSocial = () => {
    const value = newObraSocial.trim()
    const exists = appSettings.obrasSociales.some(
      (obraSocial) => obraSocial.toLocaleLowerCase('es-AR') === value.toLocaleLowerCase('es-AR'),
    )

    if (!value) {
      toast.error('Ingresá el nombre de la obra social.')
      return
    }

    if (exists) {
      toast.error('Esa obra social ya existe en la lista.')
      return
    }

    updateAppSettings.mutate({
      obrasSociales: [...appSettings.obrasSociales, value].sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    })
    setNewObraSocial('')
  }

  const removeObraSocial = (obraSocial: string) => {
    if (obrasSocialesEnUso.has(obraSocial)) {
      const confirmed = window.confirm(
        'Esta obra social ya está usada en pacientes o turnos. ¿Querés quitarla igualmente de la lista de opciones?',
      )

      if (!confirmed) {
        return
      }
    }

    updateAppSettings.mutate({
      obrasSociales: appSettings.obrasSociales.filter((item) => item !== obraSocial),
    })
  }

  const restoreObrasSociales = () => {
    updateAppSettings.mutate({
      obrasSociales: DEFAULT_APP_SETTINGS.obrasSociales,
    })
  }

  const resetDemo = () => {
    if (window.confirm('¿Querés reiniciar los datos demo? Se regenerarán médicos, pacientes y turnos.')) {
      resetDemoData.mutate()
    }
  }

  const restoreAllSettings = () => {
    if (window.confirm('¿Querés restaurar toda la configuración por defecto?')) {
      resetAppSettings.mutate()
      resetTurneroSettings.mutate()
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Parámetros del sistema demo, obras sociales, turnero público y acciones de reinicio."
        title="Configuración"
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <SectionTitle icon={Clock3} title="Parámetros" />
            <CardDescription>
              Definí el rango horario y la duración sugerida para crear turnos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submitParameters}>
              <div className="grid gap-4 md:grid-cols-3">
                <FormField error={errors.horarioInicio?.message} label="Horario de inicio">
                  <input className="form-input" type="time" {...register('horarioInicio')} />
                </FormField>
                <FormField error={errors.horarioFin?.message} label="Horario de fin">
                  <input className="form-input" type="time" {...register('horarioFin')} />
                </FormField>
                <FormField error={errors.slotDuracion?.message} label="Duración del turno">
                  <select className="form-input" {...register('slotDuracion')}>
                    {slotOptions.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes} minutos
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  disabled={updateAppSettings.isPending}
                  onClick={restoreParameters}
                  type="button"
                  variant="outline"
                >
                  Restaurar valores por defecto
                </Button>
                <Button disabled={updateAppSettings.isPending} type="submit">
                  Guardar cambios
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionTitle icon={Bell} title="Turnero" />
            <CardDescription>
              Ajustes visuales y preparación del sonido para llamados públicos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleRow
              checked={turneroSettings.dingEnabled}
              description="Preparado para sonido de llamado."
              label="Sonido ding"
              onChange={(checked) => updateTurneroSettings.mutate({ dingEnabled: checked })}
            />
            <ToggleRow
              checked={turneroSettings.highContrastEnabled}
              description="Aplica una variante más contrastada en /turnero."
              label="Alto contraste"
              onChange={(checked) =>
                updateTurneroSettings.mutate({ highContrastEnabled: checked })
              }
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <SectionTitle icon={Building2} title="Obras sociales" />
          <CardDescription>
            Lista de opciones para pacientes, médicos, filtros y turnos nuevos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="nueva-obra-social">
              Nueva obra social
            </label>
            <input
              className="form-input"
              id="nueva-obra-social"
              onChange={(event) => setNewObraSocial(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addObraSocial()
                }
              }}
              placeholder="Agregar obra social"
              value={newObraSocial}
            />
            <Button
              className="shrink-0"
              disabled={updateAppSettings.isPending}
              onClick={addObraSocial}
              type="button"
            >
              Agregar
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {appSettings.obrasSociales.map((obraSocial) => (
              <span
                className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm font-medium text-foreground"
                key={obraSocial}
              >
                {obraSocial}
                {obrasSocialesEnUso.has(obraSocial) ? <Badge variant="info">En uso</Badge> : null}
                <button
                  aria-label={`Quitar ${obraSocial}`}
                  className="rounded-full p-0.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeObraSocial(obraSocial)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              disabled={updateAppSettings.isPending}
              onClick={restoreObrasSociales}
              type="button"
              variant="outline"
            >
              Restaurar obras sociales por defecto
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionTitle icon={Settings} title="Demo" />
          <CardDescription>
            Acciones administrativas para volver a un estado demo conocido.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <ActionPanel
              description="Borra y regenera médicos, pacientes y turnos relativos a la fecha actual."
              title="Reiniciar datos demo"
            >
              <Button
                disabled={resetDemoData.isPending}
                onClick={resetDemo}
                type="button"
                variant="outline"
              >
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
                Reiniciar datos demo
              </Button>
            </ActionPanel>

            <ActionPanel
              description="Restaura parámetros, obras sociales y ajustes del turnero."
              title="Restaurar configuración"
            >
              <Button
                disabled={resetAppSettings.isPending || resetTurneroSettings.isPending}
                onClick={restoreAllSettings}
                type="button"
                variant="outline"
              >
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
                Restaurar configuración por defecto
              </Button>
            </ActionPanel>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

type SectionTitleProps = {
  icon: typeof Settings
  title: string
}

function SectionTitle({ icon: Icon, title }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-lg bg-primary-soft p-2 text-primary">
        <Icon aria-hidden="true" className="h-4 w-4" />
      </div>
      <CardTitle>{title}</CardTitle>
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

type ToggleRowProps = {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4">
      <span>
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
      </span>
      <input
        checked={checked}
        className="mt-1 h-4 w-4 shrink-0 accent-primary"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  )
}

type ActionPanelProps = {
  title: string
  description: string
  children: ReactNode
}

function ActionPanel({ title, description, children }: ActionPanelProps) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  )
}
