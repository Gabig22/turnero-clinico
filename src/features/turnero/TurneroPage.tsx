import {
  ArrowLeft,
  Building2,
  Clock3,
  Maximize2,
  Volume2,
  VolumeX,
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
  const [soundEnabled, setSoundEnabled] = useState(false)
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
    soundEnabled,
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
  const proximosTurnos = useMemo(
    () => turnosHoy.filter((turno) => turno.estado === 'pendiente').slice(0, 5),
    [turnosHoy],
  )
  const isSoundActive = soundEnabled && isAudioReady && !needsAudioActivation

  useEffect(() => {
    setSoundEnabled(dingEnabled)
  }, [dingEnabled])

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

  const toggleSound = () => {
    if (isSoundActive) {
      setSoundEnabled(false)
      return
    }

    setSoundEnabled(true)
    void enableAudio()
  }

  return (
    <div
      className={cn(
        'min-h-screen text-foreground',
        highContrastEnabled ? 'turnero-high-contrast bg-background' : 'bg-[#f7fafb]',
      )}
    >
      <TurneroControls
        isFullscreen={isFullscreen}
        isSoundActive={isSoundActive}
        toggleSound={toggleSound}
        toggleFullscreen={toggleFullscreen}
      />

      <div className="mx-auto flex min-h-screen w-[min(92vw,1800px)] flex-col py-4">
        <header className="mx-auto w-full pt-20 text-center sm:pt-14 lg:pt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-primary/80">
            Sala de espera
          </p>
          <h1 className="font-black tracking-normal text-foreground text-[clamp(2.8rem,4.2vw,5.4rem)]">
            Turnero Digital
          </h1>
          <p className="mt-2 text-[clamp(1rem,1.15vw,1.28rem)] font-medium text-muted-foreground first-letter:uppercase">
            {formatFechaLarga()}
          </p>
        </header>

        <main className="mx-auto mt-[clamp(1.25rem,2vw,2.5rem)] flex w-full flex-1 flex-col gap-[clamp(1rem,1.6vw,1.8rem)] pb-4">
          {enAtencion.length ? <AtencionSection turnos={enAtencion} /> : null}

          <TurneroInfoGrid
            eventos={eventos}
            hasAttention={Boolean(enAtencion.length)}
            proximosTurnos={proximosTurnos}
          />
        </main>
      </div>
    </div>
  )
}

type TurneroControlsProps = {
  isFullscreen: boolean
  isSoundActive: boolean
  toggleSound: () => void
  toggleFullscreen: () => void
}

function TurneroControls({
  isFullscreen,
  isSoundActive,
  toggleSound,
  toggleFullscreen,
}: TurneroControlsProps) {
  if (isFullscreen) {
    return null
  }

  return (
    <div className="fixed left-4 top-4 z-50 flex max-w-[calc(100vw-2rem)] flex-wrap gap-2">
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
        <Maximize2 aria-hidden="true" className="h-4 w-4" />
        Pantalla completa
      </Button>
      <Button
        className="h-9 border-border/70 bg-card/70 px-3 text-xs text-muted-foreground shadow-none backdrop-blur hover:bg-card hover:text-foreground"
        onClick={toggleSound}
        type="button"
        variant="outline"
      >
        {isSoundActive ? (
          <VolumeX aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Volume2 aria-hidden="true" className="h-4 w-4" />
        )}
        {isSoundActive ? 'Desactivar sonido' : 'Activar sonido'}
      </Button>
    </div>
  )
}

function AtencionSection({ turnos }: { turnos: TurnoDetallado[] }) {
  if (turnos.length === 1) {
    return <AtencionHero turno={turnos[0]} />
  }

  return (
    <section className="grid gap-[clamp(0.75rem,1.25vw,1.5rem)] xl:grid-cols-2">
      {turnos.map((turno) => (
        <AtencionHero compact key={turno.id} turno={turno} />
      ))}
    </section>
  )
}

function AtencionHero({ compact = false, turno }: { compact?: boolean; turno: TurnoDetallado }) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-clinical',
        !compact && 'turnero-attention-hero',
      )}
    >
      <div
        className={cn(
          'grid gap-[clamp(1rem,1.8vw,2rem)] md:items-center',
          compact
            ? 'p-[clamp(1rem,1.6vw,1.75rem)]'
            : 'p-[clamp(1.35rem,2.3vw,2.8rem)] md:grid-cols-[minmax(0,1fr)_clamp(190px,17vw,300px)]',
        )}
      >
        <div className="min-w-0 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <ConsultorioPill turno={turno} />
            <TurneroStatusBadge estado={turno.estado} />
            {turno.llamado_count ? <Badge variant="info">Llamado #{turno.llamado_count}</Badge> : null}
            {turno.obra_social ? <Badge variant="muted">{turno.obra_social}</Badge> : null}
          </div>
          <p
            className={cn(
              'mt-[clamp(1rem,1.5vw,1.8rem)] truncate font-black leading-[0.95] text-foreground',
              compact
                ? 'text-[clamp(2.2rem,3vw,4rem)]'
                : 'text-[clamp(3.2rem,5.4vw,7rem)]',
            )}
          >
            {getPacienteDisplay(turno)}
          </p>
          {compact ? (
            <p className="mt-3 text-lg font-bold text-primary">{formatTurnoTime(turno.hora)}</p>
          ) : null}
        </div>

        {!compact ? <HoraLlamado hora={turno.hora} /> : null}
      </div>
    </section>
  )
}

function ConsultorioPill({ turno }: { turno: TurnoDetallado }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary-soft/80 px-3.5 py-2 text-primary">
      <Building2 aria-hidden="true" className="h-4 w-4" />
      <span className="text-sm font-bold tracking-normal">Consultorio</span>
      <span className="rounded-full bg-primary px-2.5 py-0.5 text-sm font-black text-primary-foreground">
        {getConsultorioDisplay(turno)}
      </span>
    </div>
  )
}

function HoraLlamado({ hora }: { hora: string }) {
  return (
    <div className="flex justify-center md:justify-end">
      <div className="turnero-time-display flex min-w-[clamp(13rem,17vw,22rem)] flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft/85 px-4 py-2 text-primary">
          <Clock3 aria-hidden="true" className="h-4 w-4" />
          <span className="text-[0.7rem] font-extrabold uppercase tracking-[0.2em]">
            Hora de llamado
          </span>
        </div>
        <p className="mt-4 font-black leading-none text-foreground text-[clamp(4rem,5.8vw,7rem)]">
          {formatTurnoTime(hora)}
        </p>
        <span className="mt-4 h-1.5 w-24 rounded-full bg-primary/35" aria-hidden="true" />
      </div>
    </div>
  )
}

function TurneroInfoGrid({
  eventos,
  hasAttention,
  proximosTurnos,
}: {
  eventos: TurneroEvent[]
  hasAttention: boolean
  proximosTurnos: TurnoDetallado[]
}) {
  const gridClassName = cn(
    'mx-auto grid w-full gap-[clamp(1rem,1.5vw,2rem)]',
    hasAttention
      ? 'xl:grid-cols-[minmax(380px,0.9fr)_minmax(680px,1.35fr)]'
      : 'xl:grid-cols-[minmax(720px,1.55fr)_minmax(360px,0.85fr)]',
  )

  return (
    <section className={gridClassName}>
      {hasAttention ? (
        <>
          <HistorialPanel eventos={eventos} />
          <ProximosTurnosPanel hasAttention={hasAttention} turnos={proximosTurnos} />
        </>
      ) : (
        <>
          <ProximosTurnosPanel featured hasAttention={hasAttention} turnos={proximosTurnos} />
          <HistorialPanel eventos={eventos} />
        </>
      )}
    </section>
  )
}

function HistorialPanel({ eventos }: { eventos: TurneroEvent[] }) {
  return (
    <div className="flex min-h-[clamp(18rem,32vh,28rem)] flex-col rounded-2xl border border-border/80 bg-card/90 p-[clamp(1rem,1.25vw,1.5rem)] shadow-sm">
      <div className="mb-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-foreground">
          Historial de llamados
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">Últimos llamados emitidos</p>
      </div>

      {eventos.length ? (
        <div className="space-y-2">
          {eventos.map((event) => (
            <div className="rounded-xl border border-border/80 bg-muted/25 px-3 py-2.5" key={event.id}>
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
    </div>
  )
}

function ProximosTurnosPanel({
  featured = false,
  hasAttention,
  turnos,
}: {
  featured?: boolean
  hasAttention: boolean
  turnos: TurnoDetallado[]
}) {
  return (
    <div
      className={cn(
        'flex min-h-[clamp(18rem,32vh,28rem)] flex-col rounded-2xl border border-border/80 bg-card/90 p-[clamp(1rem,1.25vw,1.5rem)] shadow-sm',
        featured && 'border-warning/30 bg-card shadow-clinical',
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2
            className={cn(
              'font-extrabold uppercase tracking-wide text-foreground',
              featured ? 'text-base' : 'text-sm',
            )}
          >
            Próximos turnos
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Hasta 5 pendientes del día</p>
        </div>
        <Badge variant="warning">{turnos.length} pendientes</Badge>
      </div>

      {turnos.length ? (
        <div className="space-y-2">
          {turnos.map((turno, index) => (
            <ProximoTurnoItem
              isPrimary={index === 0}
              key={turno.id}
              shouldPulse={index === 0 && !hasAttention}
              turno={turno}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-card/70 px-4 py-5 text-center text-sm text-muted-foreground">
          No hay próximos turnos pendientes.
        </p>
      )}
    </div>
  )
}

function ProximoTurnoItem({
  isPrimary,
  shouldPulse,
  turno,
}: {
  isPrimary: boolean
  shouldPulse: boolean
  turno: TurnoDetallado
}) {
  return (
    <div
      className={cn(
        'grid gap-3 rounded-xl border border-border bg-muted/25 px-[clamp(0.85rem,1.1vw,1.25rem)] py-[clamp(0.85rem,1vw,1.15rem)] md:grid-cols-[minmax(82px,0.45fr)_minmax(220px,1.7fr)_minmax(90px,0.55fr)_minmax(120px,0.65fr)] md:items-center',
        isPrimary && 'border-warning/40 border-l-4 border-l-warning bg-warning-soft/80',
        shouldPulse && 'turnero-next-pulse',
      )}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Hora</p>
        <p
          className={cn(
            'font-extrabold text-foreground',
            isPrimary
              ? 'text-[clamp(1.5rem,1.8vw,2.2rem)]'
              : 'text-[clamp(1.05rem,1.2vw,1.35rem)]',
          )}
        >
          {formatTurnoTime(turno.hora)}
        </p>
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            'truncate font-extrabold text-foreground',
            isPrimary
              ? 'text-[clamp(1.25rem,1.6vw,1.9rem)]'
              : 'text-[clamp(0.95rem,1.1vw,1.25rem)]',
          )}
        >
          {getPacienteDisplay(turno)}
        </p>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Consultorio
        </p>
        <p
          className={cn(
            'font-extrabold text-primary',
            isPrimary
              ? 'text-[clamp(1.5rem,1.8vw,2.2rem)]'
              : 'text-[clamp(1.05rem,1.2vw,1.35rem)]',
          )}
        >
          {getConsultorioDisplay(turno)}
        </p>
      </div>
      <div className="md:text-right">
        <TurneroStatusBadge estado={turno.estado} />
      </div>
    </div>
  )
}

function TurneroStatusBadge({ estado }: { estado: TurnoDetallado['estado'] }) {
  if (estado === 'en_atencion') {
    return <Badge variant="info">En curso</Badge>
  }

  return <StatusBadge estado={estado} />
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

function formatTurnoTime(time: string) {
  return time.slice(0, 5)
}

function formatEventTime(value: string) {
  return new Date(value).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
