import type { EventClickArg, EventInput } from '@fullcalendar/core'
import esLocale from '@fullcalendar/core/locales/es'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import { format } from 'date-fns'
import { useMemo } from 'react'

import { formatConsultorioCompact } from '@/lib/utils/consultorio'
import { cn } from '@/lib/utils/cn'
import type { TurnoDetallado, TurnoEstado } from '@/types'

type AgendaMensualCalendarProps = {
  isLoading?: boolean
  onDateDoubleClick?: (date: string) => void
  onSelectDate: (date: string) => void
  onSelectTurno: (turno: TurnoDetallado) => void
  selectedDate: string
  turnos: TurnoDetallado[]
}

const eventClassByEstado: Record<TurnoEstado, string> = {
  pendiente: 'agenda-calendar-event--pendiente',
  en_atencion: 'agenda-calendar-event--en-atencion',
  finalizado: 'agenda-calendar-event--finalizado',
  cancelado: 'agenda-calendar-event--cancelado',
  pospuesto: 'agenda-calendar-event--pospuesto',
  ausente: 'agenda-calendar-event--ausente',
  reprogramado: 'agenda-calendar-event--reprogramado',
}

export function AgendaMensualCalendar({
  isLoading = false,
  onDateDoubleClick,
  onSelectDate,
  onSelectTurno,
  selectedDate,
  turnos,
}: AgendaMensualCalendarProps) {
  const turnosById = useMemo(
    () => new Map(turnos.map((turno) => [turno.id, turno])),
    [turnos],
  )
  const events = useMemo<EventInput[]>(
    () =>
      [...turnos]
        .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))
        .map((turno) => ({
          allDay: false,
          classNames: ['agenda-calendar-event', eventClassByEstado[turno.estado]],
          extendedProps: {
            estado: turno.estado,
            turnoId: turno.id,
          },
          id: turno.id,
          start: `${turno.fecha}T${turno.hora.slice(0, 5)}`,
          title: buildEventTitle(turno),
        })),
    [turnos],
  )

  const handleDateClick = (event: DateClickArg) => {
    onSelectDate(event.dateStr)

    if (event.jsEvent.detail >= 2) {
      onDateDoubleClick?.(event.dateStr)
    }
  }

  const handleEventClick = (event: EventClickArg) => {
    const turno = turnosById.get(event.event.id)

    if (turno) {
      onSelectDate(turno.fecha)
      onSelectTurno(turno)
    }
  }

  return (
    <div
      className={cn(
        'agenda-calendar rounded-lg border border-border bg-card p-3 shadow-clinical sm:p-4',
        isLoading ? 'opacity-70' : '',
      )}
    >
      <FullCalendar
        buttonText={{ today: 'Hoy' }}
        dateClick={handleDateClick}
        dayCellDidMount={(event) => {
          event.el.title = 'Doble click para seleccionar esta fecha'
        }}
        dayCellClassNames={(event) =>
          format(event.date, 'yyyy-MM-dd') === selectedDate
            ? ['agenda-calendar-day-selected']
            : []
        }
        dayMaxEvents={3}
        displayEventTime={false}
        eventClick={handleEventClick}
        events={events}
        firstDay={1}
        fixedWeekCount={false}
        headerToolbar={{
          center: 'title',
          left: 'prev,next today',
          right: '',
        }}
        height="auto"
        initialDate={selectedDate}
        key={selectedDate.slice(0, 7)}
        locale={esLocale}
        moreLinkText="más"
        plugins={[dayGridPlugin, interactionPlugin]}
      />
    </div>
  )
}

function buildEventTitle(turno: TurnoDetallado) {
  const paciente = turno.paciente
    ? `${turno.paciente.apellido}, ${turno.paciente.nombre}`
    : 'Paciente sin datos'
  const consultorio = formatConsultorioCompact(turno.consultorio_cache ?? turno.medico?.consultorio)

  return [turno.hora.slice(0, 5), paciente, consultorio].filter(Boolean).join(' · ')
}
