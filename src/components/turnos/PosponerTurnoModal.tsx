import { Clock3 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { formatDateDisplay } from '@/lib/dates/displayDate'
import type { PosponerTurnoInput } from '@/services/mock/mockApi'
import type { TurnoDetallado } from '@/types'

type PosponerTurnoModalProps = {
  turno: TurnoDetallado | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (input: PosponerTurnoInput) => void
}

const options: Array<{ value: PosponerTurnoInput['opcion']; label: string; description: string }> = [
  { value: '10', label: '10 min', description: 'Mover 10 minutos' },
  { value: '15', label: '15 min', description: 'Mover 15 minutos' },
  { value: '30', label: '30 min', description: 'Mover 30 minutos' },
  { value: 'fin_dia', label: 'Final del día', description: 'Ubicar después del último turno' },
]

export function PosponerTurnoModal({
  turno,
  isSaving,
  onClose,
  onSubmit,
}: PosponerTurnoModalProps) {
  const [opcion, setOpcion] = useState<PosponerTurnoInput['opcion']>('15')
  const [motivo, setMotivo] = useState('')

  useEffect(() => {
    setOpcion('15')
    setMotivo('')
  }, [turno])

  if (!turno) {
    return null
  }

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      opcion,
      motivo,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-clinical">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="rounded-md bg-warning-soft p-2 text-warning">
              <Clock3 aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Posponer turno</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Mové el turno y dejalo nuevamente pendiente.
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

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Opción de posposición</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {options.map((item) => (
                  <button
                    className={`rounded-md border px-3 py-3 text-left transition ${
                      opcion === item.value
                        ? 'border-warning bg-warning-soft text-foreground'
                        : 'border-border bg-card hover:border-warning/45 hover:bg-warning-soft/30'
                    }`}
                    key={item.value}
                    onClick={() => setOpcion(item.value)}
                    type="button"
                  >
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Motivo opcional
              </span>
              <textarea
                className="form-input min-h-24 resize-y"
                onChange={(event) => setMotivo(event.target.value)}
                placeholder="Ej.: demora del médico, paciente momentáneamente ausente"
                value={motivo}
              />
            </label>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border bg-card p-5 sm:flex-row sm:justify-end">
            <Button disabled={isSaving} onClick={onClose} type="button" variant="outline">
              Cancelar
            </Button>
            <Button disabled={isSaving} type="submit">
              {isSaving ? 'Posponiendo...' : 'Posponer turno'}
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
