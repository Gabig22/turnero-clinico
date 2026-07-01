import { ArrowLeft, Maximize2, Monitor } from 'lucide-react'
import { Link } from 'react-router-dom'

import { DemoBadge } from '@/components/shared/DemoBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTurnero } from '@/hooks/useTurnero'
import { formatFechaLarga } from '@/lib/dates/formatters'

export function TurneroPage() {
  const turneroQuery = useTurnero()
  const turnosHoy = turneroQuery.data?.turnosHoy ?? []
  const enAtencion = turneroQuery.data?.enAtencion ?? []
  const eventos = turneroQuery.data?.eventos.slice(0, 6) ?? []

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
          <p className="mt-3 text-sm text-muted-foreground first-letter:uppercase md:text-base">
            {formatFechaLarga()}
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Pacientes en atención</CardTitle>
            <CardDescription>
              Esta pantalla se actualiza automáticamente cada 10 segundos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enAtencion.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {enAtencion.map((turno) => (
                  <div
                    className="grid gap-4 rounded-lg border border-primary/20 bg-primary-soft p-5 md:grid-cols-[150px_1fr_120px] md:items-center"
                    key={turno.id}
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Consultorio
                      </p>
                      <p className="mt-2 text-4xl font-semibold text-primary">
                        {turno.consultorio_cache ?? turno.medico?.consultorio ?? '-'}
                      </p>
                    </div>
                    <div>
                      <StatusBadge estado={turno.estado} />
                      <p className="mt-3 text-2xl font-semibold text-foreground">
                        {turno.paciente
                          ? `${turno.paciente.apellido}, ${turno.paciente.nombre}`
                          : 'Paciente sin datos'}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {turno.medico?.nombre ?? 'Médico sin datos'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Hora</p>
                      <p className="mt-2 text-3xl font-semibold text-foreground">{turno.hora}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 p-8 text-center">
                <p className="text-lg font-semibold text-foreground">Esperando próximos llamados…</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cuando un turno pase a en atención, se mostrará destacado en esta pantalla.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Turnos de hoy</CardTitle>
              <CardDescription>Listado público de turnos del día y su estado actual.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[760px] border-collapse bg-card text-sm">
                  <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Hora</th>
                      <th className="px-4 py-3 font-semibold">Paciente</th>
                      <th className="px-4 py-3 font-semibold">Consultorio</th>
                      <th className="px-4 py-3 font-semibold">Médico</th>
                      <th className="px-4 py-3 font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {turnosHoy.map((turno) => (
                      <tr className="hover:bg-accent/50" key={turno.id}>
                        <td className="px-4 py-3 font-semibold text-foreground">{turno.hora}</td>
                        <td className="px-4 py-3 text-foreground">
                          {turno.paciente
                            ? `${turno.paciente.apellido}, ${turno.paciente.nombre}`
                            : 'Paciente sin datos'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {turno.consultorio_cache ?? turno.medico?.consultorio ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {turno.medico?.nombre ?? 'Médico sin datos'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge estado={turno.estado} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de llamados</CardTitle>
              <CardDescription>Eventos recientes del turnero.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {eventos.length ? (
                eventos.map((event) => (
                  <div className="rounded-md border border-border bg-muted/30 p-3" key={event.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {event.accion === 'CALL' ? 'Llamado' : 'Rellamado'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {event.paciente_display ?? 'Paciente sin datos'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Consultorio {event.consultorio ?? '-'} · Llamado #{event.llamado_nro ?? 1}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Todavía no hay llamados registrados.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
