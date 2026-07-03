import { format } from 'date-fns'

import {
  readMockStorage,
  resetMockStorage,
  writeMockStorage,
} from '@/lib/storage/mockStorage'
import {
  readAppSettings,
  readTurneroSettings,
  resetAppSettings,
  resetTurneroSettings,
  writeAppSettings,
  writeTurneroSettings,
} from '@/lib/storage/settingsStorage'
import type {
  AppSettings,
  Medico,
  MockDatabase,
  Paciente,
  TurneroSettings,
  TurneroEvent,
  Turno,
  TurnoDetallado,
  TurnoEstado,
} from '@/types'

export type PacienteFilters = {
  search?: string
  obra_social?: string
}

export type MedicoFilters = {
  search?: string
  especialidad?: string
  estado?: 'todos' | 'activo' | 'inactivo'
}

export type TurnoFilters = {
  search?: string
  estado?: TurnoEstado | 'todos'
  fecha?: string
  medico_id?: string
  obra_social?: string
  consultorio?: string
}

export type PacienteInput = Pick<
  Paciente,
  'nombre' | 'apellido' | 'dni' | 'obra_social'
> &
  Partial<Pick<Paciente, 'telefono' | 'email' | 'notas' | 'fecha_nacimiento' | 'fecha_alta' | 'activo'>>

export type MedicoInput = Pick<Medico, 'nombre' | 'especialidad' | 'consultorio'> &
  Partial<
    Pick<
      Medico,
      'matricula' | 'telefono' | 'email' | 'obras_sociales' | 'dias_disponibles' | 'activo'
    >
  >

export type TurnoInput = Pick<Turno, 'medico_id' | 'paciente_id' | 'fecha' | 'hora' | 'obra_social'> &
  Partial<Pick<Turno, 'notas' | 'estado'>>

export type AppSettingsInput = Partial<AppSettings>

export type TurneroSettingsInput = Partial<TurneroSettings>

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

function compactOptional(value?: string | null) {
  return value?.trim() || null
}

function sortTurnosByDateAndTime(turnos: Turno[]) {
  return [...turnos].sort((a, b) => {
    const dateComparison = a.fecha.localeCompare(b.fecha)
    return dateComparison !== 0 ? dateComparison : a.hora.localeCompare(b.hora)
  })
}

function enrichTurnosFromDatabase(database: MockDatabase, turnos: Turno[]): TurnoDetallado[] {
  return turnos.map((turno) => ({
    ...turno,
    medico: database.medicos.find((medico) => medico.id === turno.medico_id),
    paciente: database.pacientes.find((paciente) => paciente.id === turno.paciente_id),
  }))
}

function buildTurneroEvent(
  database: MockDatabase,
  turno: Turno,
  accion: TurneroEvent['accion'],
): TurneroEvent {
  const paciente = database.pacientes.find((item) => item.id === turno.paciente_id)
  const pacienteDisplay = paciente
    ? `${paciente.apellido}, ${paciente.nombre} (${turno.obra_social})`
    : 'Paciente sin datos'

  return {
    id: createId('evento'),
    turno_id: turno.id,
    medico_id: turno.medico_id,
    accion,
    consultorio: turno.consultorio_cache,
    paciente_display: pacienteDisplay,
    llamado_nro: turno.llamado_count ?? 1,
    created_at: new Date().toISOString(),
  }
}

function applyTurnoEstado(
  database: MockDatabase,
  turnoId: string,
  estado: TurnoEstado,
) {
  const turno = database.turnos.find((item) => item.id === turnoId)
  const now = new Date().toISOString()

  if (!turno) {
    throw new Error('No se encontró el turno.')
  }

  const shouldCreateCallEvent = estado === 'en_atencion' && turno.estado !== 'en_atencion'
  const shouldSetCompletedAt = estado === 'finalizado' || estado === 'ausente'
  const updatedTurno: Turno = {
    ...turno,
    estado,
    started_at: estado === 'en_atencion' ? turno.started_at ?? now : turno.started_at,
    completed_at: shouldSetCompletedAt ? now : estado === 'en_atencion' ? null : turno.completed_at,
    llamado_count: shouldCreateCallEvent ? (turno.llamado_count ?? 0) + 1 : turno.llamado_count,
    updated_at: now,
  }
  const nextEvents = shouldCreateCallEvent
    ? [...database.turnero_events, buildTurneroEvent(database, updatedTurno, 'CALL')]
    : database.turnero_events

  const nextTurnos = database.turnos.map((item) => {
    if (item.id === turnoId) {
      return updatedTurno
    }

    // Regla demo central: solo un turno puede quedar en atención por médico y fecha.
    // Cuando se llama un turno manualmente, cualquier atención previa del mismo médico se finaliza.
    if (
      shouldCreateCallEvent &&
      item.medico_id === updatedTurno.medico_id &&
      item.fecha === updatedTurno.fecha &&
      item.estado === 'en_atencion'
    ) {
      return {
        ...item,
        estado: 'finalizado' as const,
        completed_at: now,
        updated_at: now,
      }
    }

    return item
  })

  return {
    database: {
      ...database,
      turnos: sortTurnosByDateAndTime(nextTurnos),
      turnero_events: nextEvents,
    },
    turno: updatedTurno,
  }
}

export const mockApi = {
  getSnapshot: async () => readMockStorage(),

  getAppSettings: async () => readAppSettings(),

  updateAppSettings: async (input: AppSettingsInput) => writeAppSettings(input),

  resetAppSettings: async () => resetAppSettings(),

  getTurneroSettings: async () => readTurneroSettings(),

  updateTurneroSettings: async (input: TurneroSettingsInput) => writeTurneroSettings(input),

  resetTurneroSettings: async () => resetTurneroSettings(),

  listMedicos: async (filters: MedicoFilters = {}) => {
    const database = readMockStorage()
    const search = normalizeText(filters.search ?? '')

    return database.medicos
      .filter((medico) => {
        const matchesSearch = search
          ? normalizeText(`${medico.nombre} ${medico.especialidad} ${medico.consultorio}`).includes(
              search,
            )
          : true
        const matchesEspecialidad = filters.especialidad
          ? medico.especialidad === filters.especialidad
          : true
        const matchesEstado =
          !filters.estado || filters.estado === 'todos'
            ? true
            : filters.estado === 'activo'
              ? medico.activo
              : !medico.activo

        return matchesSearch && matchesEspecialidad && matchesEstado
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  },

  getMedicoById: async (id: string) => {
    const database = readMockStorage()
    return database.medicos.find((medico) => medico.id === id) ?? null
  },

  createMedico: async (input: MedicoInput) => {
    const database = readMockStorage()
    const medico: Medico = {
      id: createId('medico'),
      nombre: input.nombre.trim(),
      especialidad: input.especialidad.trim(),
      consultorio: input.consultorio.trim(),
      matricula: input.matricula?.trim() ?? '',
      telefono: input.telefono?.trim(),
      email: compactOptional(input.email) ?? undefined,
      obras_sociales: input.obras_sociales ?? [],
      dias_disponibles: input.dias_disponibles ?? [],
      activo: input.activo ?? true,
    }

    writeMockStorage({
      ...database,
      medicos: [...database.medicos, medico],
    })

    return medico
  },

  updateMedico: async (id: string, input: Partial<MedicoInput>) => {
    const database = readMockStorage()
    const medico = database.medicos.find((item) => item.id === id)

    if (!medico) {
      throw new Error('No se encontró el médico.')
    }

    const updatedMedico: Medico = {
      ...medico,
      ...input,
      nombre: input.nombre?.trim() ?? medico.nombre,
      especialidad: input.especialidad?.trim() ?? medico.especialidad,
      consultorio: input.consultorio?.trim() ?? medico.consultorio,
      matricula: input.matricula?.trim() ?? medico.matricula,
      telefono: input.telefono?.trim() ?? medico.telefono,
      email: input.email === undefined ? medico.email : compactOptional(input.email) ?? undefined,
      obras_sociales: input.obras_sociales ?? medico.obras_sociales,
      dias_disponibles: input.dias_disponibles ?? medico.dias_disponibles,
      activo: input.activo ?? medico.activo,
    }

    writeMockStorage({
      ...database,
      medicos: database.medicos.map((item) => (item.id === id ? updatedMedico : item)),
      turnos: database.turnos.map((turno) =>
        turno.medico_id === id
          ? {
              ...turno,
              consultorio_cache: updatedMedico.consultorio,
              updated_at: new Date().toISOString(),
            }
          : turno,
      ),
    })

    return updatedMedico
  },

  toggleMedico: async (id: string) => {
    const database = readMockStorage()
    const medico = database.medicos.find((item) => item.id === id)

    if (!medico) {
      throw new Error('No se encontró el médico.')
    }

    return mockApi.updateMedico(id, { activo: !medico.activo })
  },

  deleteMedico: async (id: string) => {
    const database = readMockStorage()
    const hasTurnos = database.turnos.some((turno) => turno.medico_id === id)

    if (hasTurnos) {
      throw new Error('No se puede eliminar porque tiene turnos registrados. Podés desactivarlo.')
    }

    writeMockStorage({
      ...database,
      medicos: database.medicos.filter((medico) => medico.id !== id),
    })

    return true
  },

  listPacientes: async (filters: PacienteFilters = {}) => {
    const database = readMockStorage()
    const search = normalizeText(filters.search ?? '')

    return database.pacientes
      .filter((paciente) => {
        const matchesSearch = search
          ? normalizeText(`${paciente.nombre} ${paciente.apellido} ${paciente.dni}`).includes(search)
          : true
        const matchesObraSocial = filters.obra_social
          ? paciente.obra_social === filters.obra_social
          : true

        return matchesSearch && matchesObraSocial
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
      email: compactOptional(input.email),
      notas: compactOptional(input.notas),
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
      email: input.email === undefined ? paciente.email : compactOptional(input.email),
      notas: input.notas === undefined ? paciente.notas : compactOptional(input.notas),
      fecha_nacimiento:
        input.fecha_nacimiento === undefined ? paciente.fecha_nacimiento : input.fecha_nacimiento || null,
      fecha_alta: input.fecha_alta === undefined ? paciente.fecha_alta : input.fecha_alta || null,
      activo: input.activo ?? paciente.activo,
    }

    writeMockStorage({
      ...database,
      pacientes: database.pacientes.map((item) => (item.id === id ? updatedPaciente : item)),
    })

    return updatedPaciente
  },

  togglePaciente: async (id: string) => {
    const database = readMockStorage()
    const paciente = database.pacientes.find((item) => item.id === id)

    if (!paciente) {
      throw new Error('No se encontró el paciente.')
    }

    return mockApi.updatePaciente(id, { activo: !paciente.activo })
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
      const matchesMedico = filters.medico_id ? turno.medico_id === filters.medico_id : true
      const matchesObraSocial = filters.obra_social ? turno.obra_social === filters.obra_social : true
      const matchesConsultorio = filters.consultorio
        ? (turno.consultorio_cache ?? medico?.consultorio) === filters.consultorio
        : true

      return (
        matchesSearch &&
        matchesEstado &&
        matchesFecha &&
        matchesMedico &&
        matchesObraSocial &&
        matchesConsultorio
      )
    })

    return enrichTurnosFromDatabase(database, sortTurnosByDateAndTime(turnos))
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
      estado: 'pendiente',
      obra_social: input.obra_social.trim(),
      consultorio_cache: medico.consultorio,
      notas: compactOptional(input.notas),
      llamado_count: 0,
      pospuesto_count: 0,
      started_at: null,
      completed_at: null,
      created_at: now,
      updated_at: now,
    }

    const nextDatabase = {
      ...database,
      turnos: sortTurnosByDateAndTime([...database.turnos, turno]),
    }

    if (input.estado && input.estado !== 'pendiente') {
      const result = applyTurnoEstado(nextDatabase, turno.id, input.estado)
      writeMockStorage(result.database)
      return enrichTurnosFromDatabase(result.database, [result.turno])[0]
    }

    writeMockStorage(nextDatabase)
    return enrichTurnosFromDatabase(nextDatabase, [turno])[0]
  },

  updateTurno: async (id: string, input: Partial<TurnoInput>) => {
    const database = readMockStorage()
    const turno = database.turnos.find((item) => item.id === id)

    if (!turno) {
      throw new Error('No se encontró el turno.')
    }

    const medicoId = input.medico_id ?? turno.medico_id
    const pacienteId = input.paciente_id ?? turno.paciente_id
    const medico = database.medicos.find((item) => item.id === medicoId)
    const paciente = database.pacientes.find((item) => item.id === pacienteId)

    if (!medico) {
      throw new Error('Seleccioná un médico válido.')
    }

    if (!paciente) {
      throw new Error('Seleccioná un paciente válido.')
    }

    const baseTurno: Turno = {
      ...turno,
      medico_id: medicoId,
      paciente_id: pacienteId,
      fecha: input.fecha ?? turno.fecha,
      hora: input.hora ?? turno.hora,
      obra_social: input.obra_social?.trim() ?? turno.obra_social,
      estado: input.estado ?? turno.estado,
      consultorio_cache: medico.consultorio,
      notas: input.notas === undefined ? turno.notas : compactOptional(input.notas),
      updated_at: new Date().toISOString(),
    }
    const databaseWithBaseTurno = {
      ...database,
      turnos: database.turnos.map((item) => (item.id === id ? baseTurno : item)),
    }

    if (input.estado && input.estado !== turno.estado) {
      const result = applyTurnoEstado(databaseWithBaseTurno, id, input.estado)
      writeMockStorage(result.database)
      return enrichTurnosFromDatabase(result.database, [result.turno])[0]
    }

    const nextDatabase = {
      ...databaseWithBaseTurno,
      turnos: sortTurnosByDateAndTime(databaseWithBaseTurno.turnos),
    }
    writeMockStorage(nextDatabase)

    return enrichTurnosFromDatabase(nextDatabase, [baseTurno])[0]
  },

  cambiarEstadoTurno: async (id: string, estado: TurnoEstado) => {
    const database = readMockStorage()
    const result = applyTurnoEstado(database, id, estado)
    writeMockStorage(result.database)

    return enrichTurnosFromDatabase(result.database, [result.turno])[0]
  },

  cancelarTurno: async (id: string) => mockApi.cambiarEstadoTurno(id, 'cancelado'),

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
          completed_at: null,
          llamado_count: (turno.llamado_count ?? 0) + 1,
          updated_at: now,
        }

        return turnoLlamado
      }

      return turno
    })

    const nextEvents = turnoLlamado
      ? [...database.turnero_events, buildTurneroEvent(database, turnoLlamado, 'CALL')]
      : database.turnero_events
    const nextDatabase = {
      ...database,
      turnos: sortTurnosByDateAndTime(updatedTurnos),
      turnero_events: nextEvents,
    }

    writeMockStorage(nextDatabase)

    return {
      turnoFinalizado: turnoFinalizado ? enrichTurnosFromDatabase(nextDatabase, [turnoFinalizado])[0] : null,
      turnoLlamado: turnoLlamado ? enrichTurnosFromDatabase(nextDatabase, [turnoLlamado])[0] : null,
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

    if (turno.estado !== 'en_atencion') {
      throw new Error('Solo se puede rellamar un turno en atención.')
    }

    const updatedTurno: Turno = {
      ...turno,
      llamado_count: (turno.llamado_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    }
    const nextDatabase = {
      ...database,
      turnos: database.turnos.map((item) => (item.id === turnoId ? updatedTurno : item)),
      turnero_events: [...database.turnero_events, buildTurneroEvent(database, updatedTurno, 'RECALL')],
    }

    writeMockStorage(nextDatabase)

    return {
      turno: enrichTurnosFromDatabase(nextDatabase, [updatedTurno])[0],
      event: nextDatabase.turnero_events.at(-1),
    }
  },

  resetDemoData: async () => resetMockStorage(),

  reset: async () => resetMockStorage(),
}
