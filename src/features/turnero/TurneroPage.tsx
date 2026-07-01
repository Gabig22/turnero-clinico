import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Maximize2, Monitor } from 'lucide-react'
import { Link } from 'react-router-dom'

import { DemoBadge } from '@/components/shared/DemoBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatFechaLarga } from '@/lib/dates/formatters'
import { mockApi } from '@/services/mock'

export function TurneroPage() {
  const { data } = useQuery({
    queryKey: ['mock-snapshot'],
    queryFn: mockApi.getSnapshot,
  })

  const currentTurno = data?.turnos.find((turno) => turno.estado === 'en_atencion')
  const currentPaciente = data?.pacientes.find((paciente) => paciente.id === currentTurno?.paciente_id)
  const currentMedico = data?.medicos.find((medico) => medico.id === currentTurno?.medico_id)

  return (
    <div className="min-h-screen px-4 py-5 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <Link className={buttonVariants({ variant: 'outline' })} to="/inicio">
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Volver
            </Link>
            <Button disabled variant="outline">
              <Maximize2 aria-hidden="true" className="h-4 w-4" />
              Pantalla completa
            </Button>
          </div>
          <DemoBadge />
        </div>

        <section className="rounded-xl border border-border bg-card px-5 py-8 text-center shadow-clinical">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Monitor aria-hidden="true" className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-semibold text-foreground md:text-5xl">Turnero Digital</h1>
          <p className="mt-3 text-sm text-muted-foreground first-letter:uppercase md:text-base">{formatFechaLarga()}</p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Paciente en atención</CardTitle>
            <CardDescription>
              Vista pública preparada para conectar llamados, historial y refresco automático.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentTurno && currentPaciente && currentMedico ? (
              <div className="grid gap-4 rounded-lg border border-primary/20 bg-primary-soft p-5 md:grid-cols-[160px_1fr_140px] md:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Consultorio</p>
                  <p className="mt-2 text-4xl font-semibold text-primary">{currentTurno.consultorio_cache}</p>
                </div>
                <div>
                  <StatusBadge estado={currentTurno.estado} />
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    {currentPaciente.apellido}, {currentPaciente.nombre}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{currentMedico.nombre}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Hora</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{currentTurno.hora}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 p-8 text-center">
                <p className="text-lg font-semibold text-foreground">Esperando próximos llamados</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  La integración completa del turnero se construirá sobre esta base.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
