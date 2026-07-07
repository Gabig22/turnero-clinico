import { CalendarClock } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { DateInputDisplay } from '@/components/shared/DateInputDisplay'
import { useAppSettings } from '@/hooks/useSettings'
import { formatDateDisplay, isValidDateKey } from '@/lib/dates/displayDate'
import { generateTimeOptions } from '@/lib/dates/timeSlots'
import { DEFAULT_APP_SETTINGS } from '@/lib/storage/settingsStorage'
import type { ReprogramarTurnoInput } from '@/services/dataApi'
import type { TurnoDetallado } from '@/types'

type ReprogramarTurnoModalProps = {
  turno: TurnoDetallado | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (input: ReprogramarTurnoInput) => void
}

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

export function ReprogramarTurnoModal({
  turno,
  isSaving,
  onClose,
  onSubmit,
}: ReprogramarTurnoModalProps) {
  const appSettingsQuery = useAppSettings()
  const appSettings = appSettingsQuery.data ?? DEFAULT_APP_SETTINGS
  const [fecha, setFecha] = useState(turno?.fecha ?? '')
  const [hora, setHora] = useState(turno?.hora.slice(0, 5) ?? '')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const timeOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...generateTimeOptions(
            appSettings.horarioInicio,
            appSettings.horarioFin,
            appSettings.slotDuracion,
            turno?.hora.slice(0, 5) ?? DEFAULT_APP_SETTINGS.horarioInicio,
          ),
          ...(turno ? [turno.hora.slice(0, 5)] : []),
        ]),
      ).sort((a, b) => a.localeCompare(b)),
    [appSettings.horarioFin, appSettings.horarioInicio, appSettings.slotDuracion, turno],
  )

  useEffect(() => {
    setFecha(turno?.fecha ?? '')
    setHora(turno?.hora.slice(0, 5) ?? '')
    setMotivo('')
    setError('')
  }, [turno])

  if (!turno) {
    return null
  }

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isValidDateKey(fecha)) {
      setError('Seleccioná una fecha válida.')
      return
    }

    if (!timePattern.test(hora)) {
      setError('Seleccioná una hora válida.')
      return
    }

    setError('')
    onSubmit({
      fecha,
      hora,
      motivo,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-clinical">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="rounded-md bg-info-soft p-2 text-info">
              <CalendarClock aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Reprogramar turno</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Elegí la nueva fecha y hora del turno existente.
              </p>
            </div>
          </div>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={submitForm}>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              <p className="font-semibold text-foreground">{getPacienteDisplay(turno)}</p>
              <p className="mt-1 text-muted-foreground">
                {turno.medico?.nombre ?? 'Médico sin datos'} · {formatDateDisplay(turno.fecha)} ·{' '}
                {turno.hora.slice(0, 5)}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Nueva fecha *
                </span>
                <DateInputDisplay onChange={setFecha} required value={fecha} />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Nueva hora *
                </span>
                <input
                  className="form-input"
                  list={`horarios-reprogramar-${turno.id}`}
                  onChange={(event) => setHora(event.target.value)}
                  step={appSettings.slotDuracion * 60}
                  type="time"
                  value={hora}
                />
                <datalist id={`horarios-reprogramar-${turno.id}`}>
                  {timeOptions.map((time) => (
                    <option key={time} value={time} />
                  ))}
                </datalist>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sugerencias cada {appSettings.slotDuracion} minutos.
                </p>
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Motivo opcional
              </span>
              <textarea
                className="form-input min-h-24 resize-y"
                onChange={(event) => setMotivo(event.target.value)}
                placeholder="Ej.: el paciente solicitó cambio de horario"
                value={motivo}
              />
            </label>

            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border bg-card p-5 sm:flex-row sm:justify-end">
            <Button disabled={isSaving} onClick={onClose} type="button" variant="outline">
              Cancelar
            </Button>
            <Button disabled={isSaving} type="submit">
              {isSaving ? 'Reprogramando...' : 'Reprogramar turno'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function getPacienteDisplay(turno: TurnoDetallado) {
  return turno.paciente
    ? `${turno.paciente.apellido}, ${turno.paciente.nombre}`
    : 'Paciente sin datos'
}
