import { format } from 'date-fns'

import {
  readMockStorage,
  resetMockStorage,
  writeMockStorage,
} from '@/lib/storage/mockStorage'
import type { Paciente, TurneroEvent, Turno, TurnoDetallado, TurnoEstado } from '@/types'

export type PacienteFilters = {
  search?: string
}

export type TurnoFilters = {
  search?: string
  estado?: TurnoEstado | 'todos'
  fecha?: string
}

export type PacienteInput = Pick<
  Paciente,
  'nombre' | 'apellido' | 'dni' | 'obra_social'
> &
  Partial<Pick<Paciente, 'telefono' | 'email' | 'notas' | 'fecha_nacimiento' | 'fecha_alta' | 'activo'>>

export type TurnoInput = Pick<Turno, 'medico_id' | 'paciente_id' | 'fecha' | 'hora' | 'obra_social'> &
  Partial<Pick<Turno, 'notas' | 'estado'>>

const todayKey = () => format(new Date(), 'yyyy-MM-dd')

function createId(prefix: string) {
  const randomId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  return `${prefix}-${randomId}`
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('es-AR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function enrichTurnos(turnos: Turno[]): TurnoDetallado[] {
  const database = readMockStorage()

  return turnos.map((turno) => ({
    ...turno,
    medico: database.medicos.find((medico) => medico.id === turno.medico_id),
    paciente: database.pacientes.find((paciente) => paciente.id === turno.paciente_id),
  }))
}

function sortTurnosByDateAndTime(turnos: Turno[]) {
  return [...turnos].sort((a, b) => {
    const dateComparison = a.fecha.localeCompare(b.fecha)
    return dateComparison !== 0 ? dateComparison : a.hora.localeCompare(b.hora)
  })
}

function buildTurneroEvent(turno: Turno, accion: TurneroEvent['accion']): TurneroEvent {
  const database = readMockStorage()
  const paciente = database.pacientes.find((item) => item.id === turno.paciente_id)
  const consultorio = turno.consultorio_cache
  const pacienteDisplay = paciente
    ? `${paciente.apellido}, ${paciente.nombre} (${turno.obra_social})`
    : 'Paciente sin datos'

  return {
    id: createId('evento'),
    turno_id: turno.id,
    medico_id: turno.medico_id,
    accion,
    consultorio,
    paciente_display: pacienteDisplay,
    llamado_nro: turno.llamado_count ?? 1,
    created_at: new Date().toISOString(),
  }
}

export const mockApi = {
  getSnapshot: async () => readMockStorage(),

  listMedicos: async () => {
    const database = readMockStorage()
    return [...database.medicos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  },

  getMedicoById: async (id: string) => {
    const database = readMockStorage()
    return database.medicos.find((medico) => medico.id === id) ?? null
  },

  listPacientes: async (filters: PacienteFilters = {}) => {
    const database = readMockStorage()
    const search = normalizeText(filters.search ?? '')

    return database.pacientes
      .filter((paciente) => {
        if (!search) {
          return true
        }

        const searchable = normalizeText(
          `${paciente.nombre} ${paciente.apellido} ${paciente.dni}`,
        )

        return searchable.includes(search)
      })
      .sort((a, b) =>
        `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es'),
      )
  },

  createPaciente: async (input: PacienteInput) => {
    const database = readMockStorage()
    const now = new Date().toISOString()

    if (database.pacientes.some((paciente) => paciente.dni === input.dni.trim())) {
      throw new Error('Ya existe un paciente con ese DNI.')
    }

    const paciente: Paciente = {
      id: createId('paciente'),
      nombre: input.nombre.trim(),
      apellido: input.apellido.trim(),
      dni: input.dni.trim(),
      obra_social: input.obra_social.trim(),
      telefono: input.telefono?.trim(),
      email: input.email?.trim() || null,
      notas: input.notas?.trim() || null,
      fecha_nacimiento: input.fecha_nacimiento || null,
      fecha_alta: input.fecha_alta || todayKey(),
      activo: input.activo ?? true,
      created_at: now,
    }

    writeMockStorage({
      ...database,
      pacientes: [...database.pacientes, paciente],
    })

    return paciente
  },

  updatePaciente: async (id: string, input: Partial<PacienteInput>) => {
    const database = readMockStorage()
    const paciente = database.pacientes.find((item) => item.id === id)

    if (!paciente) {
      throw new Error('No se encontró el paciente.')
    }

    if (
      input.dni &&
      database.pacientes.some((item) => item.id !== id && item.dni === input.dni?.trim())
    ) {
      throw new Error('Ya existe otro paciente con ese DNI.')
    }

    const updatedPaciente: Paciente = {
      ...paciente,
      ...input,
      nombre: input.nombre?.trim() ?? paciente.nombre,
      apellido: input.apellido?.trim() ?? paciente.apellido,
      dni: input.dni?.trim() ?? paciente.dni,
      obra_social: input.obra_social?.trim() ?? paciente.obra_social,
      telefono: input.telefono?.trim() ?? paciente.telefono,
      email: input.email?.trim() || paciente.email,
      notas: input.notas?.trim() ?? paciente.notas,
    }

    writeMockStorage({
      ...database,
      pacientes: database.pacientes.map((item) => (item.id === id ? updatedPaciente : item)),
    })

    return updatedPaciente
  },

  listTurnos: async (filters: TurnoFilters = {}) => {
    const database = readMockStorage()
    const search = normalizeText(filters.search ?? '')

    const turnos = database.turnos.filter((turno) => {
      const paciente = database.pacientes.find((item) => item.id === turno.paciente_id)
      const medico = database.medicos.find((item) => item.id === turno.medico_id)
      const matchesSearch = search
        ? normalizeText(
            `${paciente?.nombre ?? ''} ${paciente?.apellido ?? ''} ${paciente?.dni ?? ''} ${medico?.nombre ?? ''}`,
          ).includes(search)
        : true
      const matchesEstado =
        !filters.estado || filters.estado === 'todos' ? true : turno.estado === filters.estado
      const matchesFecha = filters.fecha ? turno.fecha === filters.fecha : true

      return matchesSearch && matchesEstado && matchesFecha
    })

    return enrichTurnos(sortTurnosByDateAndTime(turnos))
  },

  createTurno: async (input: TurnoInput) => {
    const database = readMockStorage()
    const medico = database.medicos.find((item) => item.id === input.medico_id)
    const paciente = database.pacientes.find((item) => item.id === input.paciente_id)
    const now = new Date().toISOString()

    if (!medico) {
      throw new Error('Seleccioná un médico válido.')
    }

    if (!paciente) {
      throw new Error('Seleccioná un paciente válido.')
    }

    const turno: Turno = {
      id: createId('turno'),
      medico_id: input.medico_id,
      paciente_id: input.paciente_id,
      fecha: input.fecha,
      hora: input.hora,
      estado: input.estado ?? 'pendiente',
      obra_social: input.obra_social,
      consultorio_cache: medico.consultorio,
      notas: input.notas?.trim() || null,
      llamado_count: 0,
      pospuesto_count: 0,
      started_at: null,
      completed_at: null,
      created_at: now,
      updated_at: now,
    }

    writeMockStorage({
      ...database,
      turnos: sortTurnosByDateAndTime([...database.turnos, turno]),
    })

    return enrichTurnos([turno])[0]
  },

  updateTurno: async (id: string, input: Partial<TurnoInput>) => {
    const database = readMockStorage()
    const turno = database.turnos.find((item) => item.id === id)

    if (!turno) {
      throw new Error('No se encontró el turno.')
    }

    const medico = input.medico_id
      ? database.medicos.find((item) => item.id === input.medico_id)
      : null

    const updatedTurno: Turno = {
      ...turno,
      ...input,
      consultorio_cache: medico?.consultorio ?? turno.consultorio_cache,
      notas: input.notas?.trim() ?? turno.notas,
      updated_at: new Date().toISOString(),
    }

    writeMockStorage({
      ...database,
      turnos: sortTurnosByDateAndTime(
        database.turnos.map((item) => (item.id === id ? updatedTurno : item)),
      ),
    })

    return enrichTurnos([updatedTurno])[0]
  },

  cambiarEstadoTurno: async (id: string, estado: TurnoEstado) => {
    const database = readMockStorage()
    const now = new Date().toISOString()
    const turno = database.turnos.find((item) => item.id === id)

    if (!turno) {
      throw new Error('No se encontró el turno.')
    }

    const shouldCreateCallEvent = estado === 'en_atencion' && turno.estado !== 'en_atencion'
    const updatedTurno: Turno = {
      ...turno,
      estado,
      started_at: estado === 'en_atencion' ? turno.started_at ?? now : turno.started_at,
      completed_at: estado === 'finalizado' ? now : estado === 'en_atencion' ? null : turno.completed_at,
      llamado_count: shouldCreateCallEvent ? (turno.llamado_count ?? 0) + 1 : turno.llamado_count,
      updated_at: now,
    }
    const nextEvents = shouldCreateCallEvent
      ? [...database.turnero_events, buildTurneroEvent(updatedTurno, 'CALL')]
      : database.turnero_events

    writeMockStorage({
      ...database,
      turnos: database.turnos.map((item) => {
        if (item.id === id) {
          return updatedTurno
        }

        // Regla demo: al llamar manualmente a un paciente, cerramos cualquier otro
        // turno en atención del mismo médico y fecha para evitar llamados simultáneos.
        if (
          shouldCreateCallEvent &&
          item.medico_id === turno.medico_id &&
          item.fecha === turno.fecha &&
          item.estado === 'en_atencion'
        ) {
          return {
            ...item,
            estado: 'finalizado',
            completed_at: now,
            updated_at: now,
          }
        }

        return item
      }),
      turnero_events: nextEvents,
    })

    return enrichTurnos([updatedTurno])[0]
  },

  siguienteTurno: async (medicoId: string) => {
    const database = readMockStorage()
    const today = todayKey()
    const now = new Date().toISOString()
    const turnosDelMedicoHoy = sortTurnosByDateAndTime(
      database.turnos.filter((turno) => turno.medico_id === medicoId && turno.fecha === today),
    )
    const turnosActuales = turnosDelMedicoHoy.filter((turno) => turno.estado === 'en_atencion')
    const siguiente = turnosDelMedicoHoy.find((turno) => turno.estado === 'pendiente')
    let turnoFinalizado: Turno | null = null
    let turnoLlamado: Turno | null = null

    const updatedTurnos = database.turnos.map((turno) => {
      if (turno.medico_id === medicoId && turno.fecha === today && turno.estado === 'en_atencion') {
        const finalizado: Turno = {
          ...turno,
          estado: 'finalizado',
          completed_at: now,
          updated_at: now,
        }

        turnoFinalizado = turnoFinalizado ?? finalizado
        return finalizado
      }

      if (siguiente && turno.id === siguiente.id) {
        turnoLlamado = {
          ...turno,
          estado: 'en_atencion',
          started_at: now,
          llamado_count: (turno.llamado_count ?? 0) + 1,
          updated_at: now,
        }

        return turnoLlamado
      }

      return turno
    })

    const nextEvents = turnoLlamado
      ? [...database.turnero_events, buildTurneroEvent(turnoLlamado, 'CALL')]
      : database.turnero_events

    writeMockStorage({
      ...database,
      turnos: sortTurnosByDateAndTime(updatedTurnos),
      turnero_events: nextEvents,
    })

    return {
      turnoFinalizado: turnoFinalizado ? enrichTurnos([turnoFinalizado])[0] : null,
      turnoLlamado: turnoLlamado ? enrichTurnos([turnoLlamado])[0] : null,
      turnosFinalizados: turnosActuales.length,
    }
  },

  listTurneroEvents: async () => {
    const database = readMockStorage()

    return [...database.turnero_events].sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  rellamarTurno: async (turnoId: string) => {
    const database = readMockStorage()
    const turno = database.turnos.find((item) => item.id === turnoId)

    if (!turno) {
      throw new Error('No se encontró el turno.')
    }

    const updatedTurno: Turno = {
      ...turno,
      llamado_count: (turno.llamado_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    }
    const event = buildTurneroEvent(updatedTurno, 'RECALL')

    writeMockStorage({
      ...database,
      turnos: database.turnos.map((item) => (item.id === turnoId ? updatedTurno : item)),
      turnero_events: [...database.turnero_events, event],
    })

    return {
      turno: enrichTurnos([updatedTurno])[0],
      event,
    }
  },

  resetDemoData: async () => resetMockStorage(),

  reset: async () => resetMockStorage(),
}
