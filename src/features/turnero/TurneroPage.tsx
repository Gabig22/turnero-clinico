import {
  ArrowLeft,
  Building2,
  Clock3,
  Maximize2,
  Minimize2,
  Stethoscope,
  UserRound,
  Volume2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { useTurneroSettings } from '@/hooks/useSettings'
import { useTurneroDing } from '@/hooks/useTurneroDing'
import { useTurnero } from '@/hooks/useTurnero'
import { formatFechaLarga } from '@/lib/dates/formatters'
import { cn } from '@/lib/utils/cn'
import type { TurneroEvent, TurnoDetallado } from '@/types'

export function TurneroPage() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const turneroQuery = useTurnero()
  const turneroSettingsQuery = useTurneroSettings()
  const turnosHoy = useMemo(
    () =>
      [...(turneroQuery.data?.turnosHoy ?? [])].sort((a, b) => a.hora.localeCompare(b.hora)),
    [turneroQuery.data?.turnosHoy],
  )
  const eventos = useMemo(
    () =>
      [...(turneroQuery.data?.eventos ?? [])]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 4),
    [turneroQuery.data?.eventos],
  )
  const turneroSettings = turneroSettingsQuery.data
  const dingEnabled = turneroSettings?.dingEnabled ?? false
  const highContrastEnabled = turneroSettings?.highContrastEnabled ?? false
  const { enableAudio, isAudioReady, needsAudioActivation } = useTurneroDing(
    eventos,
    dingEnabled,
  )
  const latestEventByTurnoId = useMemo(() => {
    const eventMap = new Map<string, TurneroEvent>()

    for (const event of eventos) {
      if (!eventMap.has(event.turno_id)) {
        eventMap.set(event.turno_id, event)
      }
    }

    return eventMap
  }, [eventos])
  const enAtencion = useMemo(
    () =>
      turnosHoy
        .filter((turno) => turno.estado === 'en_atencion')
        .sort(
          (a, b) =>
            getTurnoActivityTime(b, latestEventByTurnoId) -
            getTurnoActivityTime(a, latestEventByTurnoId),
        ),
    [latestEventByTurnoId, turnosHoy],
  )
  const proximoTurno = useMemo(
    () => turnosHoy.find((turno) => turno.estado === 'pendiente') ?? null,
    [turnosHoy],
  )

  useEffect(() => {
    const updateFullscreenState = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    updateFullscreenState()
    document.addEventListener('fullscreenchange', updateFullscreenState)

    return () => document.removeEventListener('fullscreenchange', updateFullscreenState)
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        return
      }

      await document.documentElement.requestFullscreen()
    } catch {
      toast.error('No se pudo cambiar el modo pantalla completa.')
    }
  }

  return (
    <div
      className={cn(
        'min-h-screen bg-background text-foreground',
        highContrastEnabled && 'turnero-high-contrast',
      )}
    >
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1180px] flex-col px-4 py-4 md:px-6">
        <TurneroControls
          dingEnabled={dingEnabled}
          enableAudio={enableAudio}
          isAudioReady={isAudioReady}
          isFullscreen={isFullscreen}
          needsAudioActivation={needsAudioActivation}
          toggleFullscreen={toggleFullscreen}
        />

        <header className="mx-auto w-full max-w-4xl pt-12 text-center md:pt-6">
          <h1 className="text-4xl font-bold tracking-normal text-foreground md:text-5xl">
            Turnero Digital
          </h1>
          <p className="mt-2 text-base text-muted-foreground first-letter:uppercase md:text-lg">
            {formatFechaLarga()}
          </p>
          <NextTurnChip turno={proximoTurno} />
        </header>

        <main className="mx-auto mt-6 flex w-full flex-1 flex-col gap-4 pb-4 md:mt-8">
          {enAtencion.length ? <AtencionSection turnos={enAtencion} /> : null}

          {enAtencion.length ? (
            <CompactNextStrip turno={proximoTurno} />
          ) : null}

          <TurnosHoyTable
            hasAttention={Boolean(enAtencion.length)}
            proximoTurnoId={proximoTurno?.id ?? null}
            turnos={turnosHoy}
          />

          <HistorialCompacto eventos={eventos} />
        </main>
      </div>
    </div>
  )
}

type TurneroControlsProps = {
  dingEnabled: boolean
  enableAudio: () => void
  isAudioReady: boolean
  isFullscreen: boolean
  needsAudioActivation: boolean
  toggleFullscreen: () => void
}

function TurneroControls({
  dingEnabled,
  enableAudio,
  isAudioReady,
  isFullscreen,
  needsAudioActivation,
  toggleFullscreen,
}: TurneroControlsProps) {
  return (
    <div className="z-20 flex flex-wrap gap-2 md:absolute md:left-4 md:top-4">
      <Link
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'h-9 border-border/70 bg-card/70 px-3 text-xs text-muted-foreground shadow-none backdrop-blur hover:bg-card hover:text-foreground',
        )}
        to="/inicio"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Volver
      </Link>
      <Button
        className="h-9 border-border/70 bg-card/70 px-3 text-xs text-muted-foreground shadow-none backdrop-blur hover:bg-card hover:text-foreground"
        onClick={toggleFullscreen}
        type="button"
        variant="outline"
      >
        {isFullscreen ? (
          <Minimize2 aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Maximize2 aria-hidden="true" className="h-4 w-4" />
        )}
        {isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
      </Button>
      {dingEnabled && needsAudioActivation ? (
        <Button
          className="h-9 border-border/70 bg-card/70 px-3 text-xs text-muted-foreground shadow-none backdrop-blur hover:bg-card hover:text-foreground"
          onClick={enableAudio}
          type="button"
          variant="outline"
        >
          <Volume2 aria-hidden="true" className="h-4 w-4" />
          Activar sonido
        </Button>
      ) : null}
      {dingEnabled && isAudioReady ? (
        <Badge className="h-9 bg-card/70 px-3 text-xs backdrop-blur" variant="success">
          Sonido activo
        </Badge>
      ) : null}
    </div>
  )
}

function NextTurnChip({ turno }: { turno: TurnoDetallado | null }) {
  return (
    <div className="mt-5 flex justify-center">
      <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-card/75 px-4 py-2 text-sm text-muted-foreground shadow-sm">
        <Clock3 aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
        {turno ? (
          <span className="truncate">
            Siguiente:{' '}
            <strong className="font-semibold text-foreground">{formatTurnoTime(turno.hora)}</strong>
            {' — '}
            <span className="text-foreground">{getPacienteDisplay(turno)}</span>
            {' · '}
            {getConsultorioText(turno)}
          </span>
        ) : (
          <span>No hay próximos turnos pendientes</span>
        )}
      </div>
    </div>
  )
}

function AtencionSection({ turnos }: { turnos: TurnoDetallado[] }) {
  if (turnos.length === 1) {
    return <AtencionHero turno={turnos[0]} />
  }

  return (
    <section className="grid gap-3 lg:grid-cols-2">
      {turnos.map((turno) => (
        <AtencionHero compact key={turno.id} turno={turno} />
      ))}
    </section>
  )
}

function AtencionHero({ compact = false, turno }: { compact?: boolean; turno: TurnoDetallado }) {
  return (
    <section
      className="overflow-hidden rounded-xl border border-primary/25 bg-primary-soft/70 shadow-clinical"
    >
      <div className="border-b border-primary/20 bg-card/75 px-5 py-2.5 text-center">
        <p className="truncate text-lg font-extrabold uppercase tracking-wide text-primary md:text-2xl">
          {getConsultorioHero(turno)}
        </p>
      </div>
      <div
        className={cn(
          'grid gap-5 md:items-center',
          compact ? 'p-5' : 'p-5 md:grid-cols-[1fr_150px] md:p-7',
        )}
      >
        <div className="min-w-0 text-center md:text-left">
          <div className="flex flex-wrap justify-center gap-2 md:justify-start">
            <StatusBadge estado={turno.estado} />
            {turno.llamado_count ? <Badge variant="info">Llamado #{turno.llamado_count}</Badge> : null}
            {turno.obra_social ? <Badge variant="muted">{turno.obra_social}</Badge> : null}
          </div>
          <p
            className={cn(
              'mt-3 truncate font-bold leading-tight text-foreground',
              compact ? 'text-3xl md:text-4xl' : 'text-4xl md:text-6xl',
            )}
          >
            {getPacienteDisplay(turno)}
          </p>
          <p className="mt-2 text-lg font-medium text-muted-foreground md:text-2xl">
            {turno.medico?.nombre ?? 'Médico sin datos'}
          </p>
        </div>

        {!compact ? (
          <div className="rounded-lg border border-border bg-card/80 px-4 py-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Hora</p>
            <p className="mt-2 text-5xl font-bold leading-none text-foreground">
              {formatTurnoTime(turno.hora)}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function CompactNextStrip({ turno }: { turno: TurnoDetallado | null }) {
  return (
    <div className="rounded-lg border border-border bg-card/80 px-4 py-3 text-center text-sm text-muted-foreground shadow-sm">
      {turno ? (
        <span>
          Siguiente:{' '}
          <strong className="font-semibold text-foreground">{formatTurnoTime(turno.hora)}</strong>
          {' — '}
          <span className="font-medium text-foreground">{getPacienteDisplay(turno)}</span>
          {' · '}
          {getConsultorioText(turno)}
        </span>
      ) : (
        <span>No hay próximos turnos pendientes.</span>
      )}
    </div>
  )
}

function TurnosHoyTable({
  hasAttention,
  proximoTurnoId,
  turnos,
}: {
  hasAttention: boolean
  proximoTurnoId: string | null
  turnos: TurnoDetallado[]
}) {
  if (!turnos.length) {
    return (
      <div className="mx-auto w-full max-w-5xl rounded-xl border border-dashed border-border bg-card/80 px-6 py-8 text-center text-muted-foreground">
        No hay turnos registrados para hoy.
      </div>
    )
  }

  return (
    <section className="mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-card shadow-[0_26px_70px_-52px_rgb(15_23_42_/_0.8)]">
      <div className={cn('overflow-auto', hasAttention ? 'max-h-[360px]' : 'max-h-[430px]')}>
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="sticky top-0 z-10 border-b border-border bg-card text-xs font-bold uppercase tracking-wide text-foreground">
            <tr>
              <TableHead icon={Clock3} label="Hora" />
              <TableHead icon={UserRound} label="Paciente" />
              <TableHead icon={Building2} label="Consultorio" />
              <TableHead icon={Stethoscope} label="Médico" />
              <th className="px-6 py-4 text-center font-bold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {turnos.map((turno) => {
              const isNext = turno.id === proximoTurnoId

              return (
                <TurnoRow
                  isNext={isNext}
                  key={turno.id}
                  shouldPulse={isNext && !hasAttention}
                  turno={turno}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function TableHead({ icon: Icon, label }: { icon: typeof Clock3; label: string }) {
  return (
    <th className="px-6 py-4 font-bold">
      <span className="inline-flex items-center gap-2">
        <Icon aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
        {label}
      </span>
    </th>
  )
}

function TurnoRow({
  isNext,
  shouldPulse,
  turno,
}: {
  isNext: boolean
  shouldPulse: boolean
  turno: TurnoDetallado
}) {
  const isCurrent = turno.estado === 'en_atencion'
  const isMuted = turno.estado === 'cancelado' || turno.estado === 'finalizado'

  return (
    <tr
      className={cn(
        'transition-colors',
        isNext && 'border-l-4 border-l-warning bg-warning-soft/80',
        isCurrent && 'border-l-4 border-l-primary bg-primary-soft/70',
        isMuted && !isCurrent && !isNext && 'opacity-55',
        shouldPulse && 'turnero-next-pulse',
      )}
    >
      <td className="whitespace-nowrap px-6 py-5">
        <span
          className={cn(
            'font-bold text-foreground',
            isNext || isCurrent ? 'text-3xl' : 'text-xl',
          )}
        >
          {formatTurnoTime(turno.hora)}
        </span>
      </td>
      <td className="px-6 py-5">
        <p
          className={cn(
            'max-w-[340px] truncate font-bold text-foreground',
            isNext || isCurrent ? 'text-2xl' : 'text-lg',
          )}
        >
          {getPacienteDisplay(turno)}
        </p>
        {turno.obra_social ? (
          <p className="mt-1 text-sm text-muted-foreground">{turno.obra_social}</p>
        ) : null}
      </td>
      <td className="whitespace-nowrap px-6 py-5">
        <span
          className={cn(
            'font-bold text-primary',
            isNext || isCurrent ? 'text-3xl' : 'text-xl',
          )}
        >
          {getConsultorioDisplay(turno)}
        </span>
      </td>
      <td className="px-6 py-5 text-lg text-muted-foreground">
        {turno.medico?.nombre ?? 'Médico sin datos'}
      </td>
      <td className="whitespace-nowrap px-6 py-5 text-center">
        <StatusBadge estado={turno.estado} />
      </td>
    </tr>
  )
}

function HistorialCompacto({ eventos }: { eventos: TurneroEvent[] }) {
  return (
    <section className="mx-auto w-full max-w-5xl">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Historial reciente</span>
        <span>Últimos llamados</span>
      </div>
      {eventos.length ? (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {eventos.map((event) => (
            <div
              className="rounded-lg border border-border bg-card/70 px-3 py-2 shadow-sm"
              key={event.id}
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant={event.accion === 'CALL' ? 'info' : 'warning'}>
                  {event.accion === 'CALL' ? 'LLAMADO' : 'RELLAMADO'}
                </Badge>
                <span className="text-xs font-semibold text-muted-foreground">
                  {formatEventTime(event.created_at)}
                </span>
              </div>
              <p className="mt-2 truncate text-sm font-semibold text-foreground">
                {event.paciente_display ?? 'Paciente sin datos'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Consultorio {event.consultorio ?? '-'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-card/70 px-4 py-3 text-center text-sm text-muted-foreground">
          Todavía no hay llamados registrados.
        </p>
      )}
    </section>
  )
}

function getTurnoActivityTime(
  turno: TurnoDetallado,
  latestEventByTurnoId: Map<string, TurneroEvent>,
) {
  const eventTime = latestEventByTurnoId.get(turno.id)?.created_at
  const dateValue = eventTime ?? turno.started_at ?? `${turno.fecha}T${turno.hora.slice(0, 5)}`

  return new Date(dateValue).getTime()
}

function getPacienteDisplay(turno: TurnoDetallado) {
  return turno.paciente
    ? `${turno.paciente.apellido}, ${turno.paciente.nombre}`
    : 'Paciente sin datos'
}

function getConsultorio(turno: TurnoDetallado) {
  return turno.consultorio_cache ?? turno.medico?.consultorio ?? '-'
}

function getConsultorioDisplay(turno: TurnoDetallado) {
  const consultorio = getConsultorio(turno).trim()
  const compactValue = consultorio.replace(/^consultorio\s*/i, '').trim()

  return compactValue || consultorio
}

function getConsultorioText(turno: TurnoDetallado) {
  const consultorio = getConsultorioDisplay(turno)

  return consultorio === '-' ? consultorio : `Consultorio ${consultorio}`
}

function getConsultorioHero(turno: TurnoDetallado) {
  return getConsultorioText(turno).toLocaleUpperCase('es-AR')
}

function formatTurnoTime(time: string) {
  return time.slice(0, 5)
}

function formatEventTime(value: string) {
  return new Date(value).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
