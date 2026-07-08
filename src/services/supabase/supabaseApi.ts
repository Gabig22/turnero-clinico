import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_TURNERO_SETTINGS,
} from '@/lib/storage/settingsStorage'
import type { mockApi } from '@/services/mock/mockApi'
import { getSupabaseClient } from '@/services/supabase/client'
import type {
  AppSettings,
  Medico,
  MockDatabase,
  Paciente,
  TurneroEvent,
  TurnoDetallado,
  TurnoEstado,
} from '@/types'

type SupabaseApi = typeof mockApi

type MedicoRow = {
  id: string
  nombre: string | null
  especialidad: string | null
  consultorio: string | null
  matricula: string | null
  telefono: string | null
  email: string | null
  obras_sociales: string[] | null
  dias_disponibles: string[] | null
  activo: boolean | null
}

type PacienteRow = {
  id: string
  nombre: string | null
  apellido: string | null
  dni: string | null
  obra_social: string | null
  telefono: string | null
  email: string | null
  notas: string | null
  fecha_nacimiento: string | null
  fecha_alta: string | null
  activo: boolean | null
  created_at: string | null
}

type TurnoRow = {
  id: string
  medico_id: string
  paciente_id: string
  fecha: string
  hora: string
  estado: string | null
  obra_social: string | null
  consultorio_cache: string | null
  notas: string | null
  llamado_count: number | null
  pospuesto_count: number | null
  reprogramado_count: number | null
  started_at: string | null
  completed_at: string | null
  created_at: string | null
  updated_at: string | null
  medico?: MedicoRow | MedicoRow[] | null
  paciente?: PacienteRow | PacienteRow[] | null
}

type TurneroEventRow = {
  id: string
  turno_id: string | null
  medico_id: string
  accion: string | null
  consultorio: string | null
  paciente_display: string | null
  llamado_nro: number | null
  created_at: string | null
}

type AppSettingsRow = {
  horario_inicio: string | null
  horario_fin: string | null
  slot_duracion: number | null
  obras_sociales: string[] | null
}

type TurneroSettingsRow = {
  ding_enabled: boolean | null
  high_contrast_enabled: boolean | null
}

const TURNO_ESTADOS: TurnoEstado[] = [
  'pendiente',
  'en_atencion',
  'finalizado',
  'cancelado',
  'pospuesto',
  'ausente',
  'reprogramado',
]

const SLOT_DURATIONS: AppSettings['slotDuracion'][] = [15, 20, 30, 40]

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('es-AR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string')
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null
}

function normalizeDateKey(value: string | null | undefined) {
  return value ? value.slice(0, 10) : ''
}

function normalizeTimeValue(value: string | null | undefined) {
  return value ? value.slice(0, 5) : ''
}

function normalizeTurnoEstado(value: string | null | undefined): TurnoEstado {
  return TURNO_ESTADOS.includes(value as TurnoEstado) ? (value as TurnoEstado) : 'pendiente'
}

function normalizeSlotDuration(value: number | null | undefined): AppSettings['slotDuracion'] {
  return SLOT_DURATIONS.includes(value as AppSettings['slotDuracion'])
    ? (value as AppSettings['slotDuracion'])
    : DEFAULT_APP_SETTINGS.slotDuracion
}

function compactOptional(value?: string | null) {
  return value?.trim() || null
}

function requireText(value: string | undefined, message: string) {
  const normalizedValue = value?.trim()

  if (!normalizedValue) {
    throw new Error(message)
  }

  return normalizedValue
}

function assertDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('SeleccionÃ¡ una fecha vÃ¡lida.')
  }
}

function assertTimeValue(value: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new Error('SeleccionÃ¡ una hora vÃ¡lida.')
  }
}

function mapMedico(row: MedicoRow): Medico {
  return {
    id: row.id,
    nombre: row.nombre ?? '',
    especialidad: row.especialidad ?? '',
    consultorio: row.consultorio ?? '',
    matricula: row.matricula ?? '',
    telefono: row.telefono ?? undefined,
    email: row.email ?? undefined,
    obras_sociales: toStringArray(row.obras_sociales),
    dias_disponibles: toStringArray(row.dias_disponibles),
    activo: row.activo ?? true,
  }
}

function mapPaciente(row: PacienteRow): Paciente {
  return {
    id: row.id,
    nombre: row.nombre ?? '',
    apellido: row.apellido ?? '',
    dni: row.dni ?? '',
    obra_social: row.obra_social ?? '',
    telefono: row.telefono ?? undefined,
    email: row.email,
    notas: row.notas,
    fecha_nacimiento: normalizeDateKey(row.fecha_nacimiento) || null,
    fecha_alta: normalizeDateKey(row.fecha_alta) || null,
    activo: row.activo ?? true,
    created_at: row.created_at ?? undefined,
  }
}

function mapTurno(row: TurnoRow): TurnoDetallado {
  const medicoRow = firstRelation(row.medico)
  const pacienteRow = firstRelation(row.paciente)
  const medico = medicoRow ? mapMedico(medicoRow) : undefined
  const paciente = pacienteRow ? mapPaciente(pacienteRow) : undefined

  return {
    id: row.id,
    medico_id: row.medico_id,
    paciente_id: row.paciente_id,
    fecha: normalizeDateKey(row.fecha),
    hora: normalizeTimeValue(row.hora),
    estado: normalizeTurnoEstado(row.estado),
    obra_social: row.obra_social ?? paciente?.obra_social ?? '',
    consultorio_cache: row.consultorio_cache ?? medico?.consultorio,
    notas: row.notas,
    llamado_count: row.llamado_count ?? 0,
    pospuesto_count: row.pospuesto_count ?? 0,
    reprogramado_count: row.reprogramado_count ?? 0,
    started_at: row.started_at,
    completed_at: row.completed_at,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
    medico,
    paciente,
  }
}

function mapTurneroEvent(row: TurneroEventRow): TurneroEvent {
  return {
    id: row.id,
    turno_id: row.turno_id ?? '',
    medico_id: row.medico_id,
    accion: row.accion === 'RECALL' ? 'RECALL' : 'CALL',
    consultorio: row.consultorio ?? undefined,
    paciente_display: row.paciente_display ?? undefined,
    llamado_nro: row.llamado_nro ?? undefined,
    created_at: row.created_at ?? new Date(0).toISOString(),
  }
}

function sortMedicos(medicos: Medico[]) {
  return [...medicos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

function sortPacientes(pacientes: Paciente[]) {
  return [...pacientes].sort((a, b) =>
    `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es'),
  )
}

function sortTurnos(turnos: TurnoDetallado[]) {
  return [...turnos].sort((a, b) => {
    const dateComparison = a.fecha.localeCompare(b.fecha)
    return dateComparison !== 0 ? dateComparison : a.hora.localeCompare(b.hora)
  })
}

function throwReadOnly(methodName: string): never {
  throw new Error(
    `Supabase estÃ¡ conectado en modo solo lectura para esta fase (${methodName}). SeguÃ­ usando modo mock para crear, editar o cambiar estados hasta implementar S5/S6.`,
  )
}

function handleSupabaseError(methodName: string, error: { message: string } | null) {
  if (error) {
    throw new Error(`No pudimos leer datos de Supabase (${methodName}): ${error.message}`)
  }
}

function handleSupabaseWriteError(
  methodName: string,
  error: { code?: string; message: string } | null,
  messages: {
    duplicate?: string
    permission?: string
  } = {},
): asserts error is null {
  if (!error) {
    return
  }

  if (error.code === '23505') {
    throw new Error(messages.duplicate ?? 'Ya existe un registro con esos datos.')
  }

  if (error.code === '42501') {
    throw new Error('No tenés permisos para crear pacientes con este usuario.')
  }

  throw new Error(`No pudimos guardar datos en Supabase (${methodName}): ${error.message}`)
}

async function getCurrentUserIdForWrite() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user?.id) {
    throw new Error('Necesitás iniciar sesión para crear pacientes.')
  }

  return data.user.id
}

async function getCurrentUserIdForAction(actionLabel: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user?.id) {
    throw new Error(`NecesitÃ¡s iniciar sesiÃ³n para ${actionLabel}.`)
  }

  return data.user.id
}

async function ensureCurrentUserForWrite(actionLabel: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user?.id) {
    throw new Error(`NecesitÃ¡s iniciar sesiÃ³n para ${actionLabel}.`)
  }
}

async function readMedicos() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('medicos')
    .select(
      'id,nombre,especialidad,consultorio,matricula,telefono,email,obras_sociales,dias_disponibles,activo',
    )
    .order('nombre', { ascending: true })

  handleSupabaseError('listMedicos', error)
  return ((data ?? []) as MedicoRow[]).map(mapMedico)
}

async function readPacientes() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('pacientes')
    .select(
      'id,nombre,apellido,dni,obra_social,telefono,email,notas,fecha_nacimiento,fecha_alta,activo,created_at',
    )
    .order('apellido', { ascending: true })
    .order('nombre', { ascending: true })

  handleSupabaseError('listPacientes', error)
  return ((data ?? []) as PacienteRow[]).map(mapPaciente)
}

async function readTurnos() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('turnos')
    .select(
      `
        id,
        medico_id,
        paciente_id,
        fecha,
        hora,
        estado,
        obra_social,
        consultorio_cache,
        notas,
        llamado_count,
        pospuesto_count,
        reprogramado_count,
        started_at,
        completed_at,
        created_at,
        updated_at,
        medico:medicos (
          id,
          nombre,
          especialidad,
          consultorio,
          matricula,
          telefono,
          email,
          obras_sociales,
          dias_disponibles,
          activo
        ),
        paciente:pacientes (
          id,
          nombre,
          apellido,
          dni,
          obra_social,
          telefono,
          email,
          notas,
          fecha_nacimiento,
          fecha_alta,
          activo,
          created_at
        )
      `,
    )
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true })

  handleSupabaseError('listTurnos', error)
  return ((data ?? []) as TurnoRow[]).map(mapTurno)
}

export const supabaseApi: SupabaseApi = {
  getSnapshot: async (): Promise<MockDatabase> => {
    const [medicos, pacientes, turnos, turneroEvents] = await Promise.all([
      supabaseApi.listMedicos(),
      supabaseApi.listPacientes(),
      supabaseApi.listTurnos(),
      supabaseApi.listTurneroEvents(),
    ])

    return {
      medicos,
      pacientes,
      turnos: turnos.map(({ medico: _medico, paciente: _paciente, ...turno }) => turno),
      turnero_events: turneroEvents,
    }
  },

  getAppSettings: async () => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('app_settings')
      .select('horario_inicio,horario_fin,slot_duracion,obras_sociales')
      .eq('id', true)
      .maybeSingle()

    handleSupabaseError('getAppSettings', error)

    const row = data as AppSettingsRow | null

    return {
      horarioInicio: normalizeTimeValue(row?.horario_inicio) || DEFAULT_APP_SETTINGS.horarioInicio,
      horarioFin: normalizeTimeValue(row?.horario_fin) || DEFAULT_APP_SETTINGS.horarioFin,
      slotDuracion: normalizeSlotDuration(row?.slot_duracion),
      obrasSociales: toStringArray(row?.obras_sociales).length
        ? toStringArray(row?.obras_sociales)
        : DEFAULT_APP_SETTINGS.obrasSociales,
    }
  },

  updateAppSettings: async () => throwReadOnly('updateAppSettings'),

  resetAppSettings: async () => throwReadOnly('resetAppSettings'),

  getTurneroSettings: async () => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('turnero_settings')
      .select('ding_enabled,high_contrast_enabled')
      .eq('id', true)
      .maybeSingle()

    handleSupabaseError('getTurneroSettings', error)

    const row = data as TurneroSettingsRow | null

    return {
      dingEnabled: row?.ding_enabled ?? DEFAULT_TURNERO_SETTINGS.dingEnabled,
      highContrastEnabled:
        row?.high_contrast_enabled ?? DEFAULT_TURNERO_SETTINGS.highContrastEnabled,
    }
  },

  updateTurneroSettings: async () => throwReadOnly('updateTurneroSettings'),

  resetTurneroSettings: async () => throwReadOnly('resetTurneroSettings'),

  listMedicos: async (filters = {}) => {
    const medicos = await readMedicos()
    const search = normalizeText(filters.search ?? '')

    return sortMedicos(
      medicos.filter((medico) => {
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
      }),
    )
  },

  getMedicoById: async (id: string) => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('medicos')
      .select(
        'id,nombre,especialidad,consultorio,matricula,telefono,email,obras_sociales,dias_disponibles,activo',
      )
      .eq('id', id)
      .maybeSingle()

    handleSupabaseError('getMedicoById', error)

    return data ? mapMedico(data as MedicoRow) : null
  },

  createMedico: async (input) => {
    await ensureCurrentUserForWrite('crear mÃ©dicos')

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('medicos')
      .insert({
        nombre: requireText(input.nombre, 'El nombre es obligatorio.'),
        especialidad: requireText(input.especialidad, 'La especialidad es obligatoria.'),
        consultorio: requireText(input.consultorio, 'El consultorio es obligatorio.'),
        matricula: input.matricula?.trim() ?? '',
        telefono: compactOptional(input.telefono),
        email: compactOptional(input.email),
        obras_sociales: toStringArray(input.obras_sociales),
        dias_disponibles: toStringArray(input.dias_disponibles),
        activo: input.activo ?? true,
      })
      .select(
        'id,nombre,especialidad,consultorio,matricula,telefono,email,obras_sociales,dias_disponibles,activo',
      )
      .single()

    if (error?.code === '42501') {
      throw new Error('No tenÃ©s permisos para crear mÃ©dicos con este usuario.')
    }

    handleSupabaseWriteError('createMedico', error, {
      duplicate: 'Ya existe un mÃ©dico con esos datos.',
    })

    return mapMedico(data as MedicoRow)
  },

  updateMedico: async () => throwReadOnly('updateMedico'),

  toggleMedico: async () => throwReadOnly('toggleMedico'),

  deleteMedico: async () => throwReadOnly('deleteMedico'),

  listPacientes: async (filters = {}) => {
    const pacientes = await readPacientes()
    const search = normalizeText(filters.search ?? '')

    return sortPacientes(
      pacientes.filter((paciente) => {
        const matchesSearch = search
          ? normalizeText(`${paciente.nombre} ${paciente.apellido} ${paciente.dni}`).includes(search)
          : true
        const matchesObraSocial = filters.obra_social
          ? paciente.obra_social === filters.obra_social
          : true

        return matchesSearch && matchesObraSocial
      }),
    )
  },

  createPaciente: async (input) => {
    const supabase = getSupabaseClient()
    const userId = await getCurrentUserIdForWrite()
    const dni = requireText(input.dni, 'El DNI es obligatorio.')
    const { data: existingPaciente, error: existingError } = await supabase
      .from('pacientes')
      .select('id')
      .eq('dni', dni)
      .maybeSingle()

    handleSupabaseError('createPaciente.verificarDni', existingError)

    if (existingPaciente) {
      throw new Error('Ya existe un paciente con ese DNI.')
    }

    const { data, error } = await supabase
      .from('pacientes')
      .insert({
        nombre: requireText(input.nombre, 'El nombre es obligatorio.'),
        apellido: requireText(input.apellido, 'El apellido es obligatorio.'),
        dni,
        obra_social: requireText(input.obra_social, 'La obra social es obligatoria.'),
        telefono: compactOptional(input.telefono),
        email: compactOptional(input.email),
        notas: compactOptional(input.notas),
        fecha_nacimiento: input.fecha_nacimiento || null,
        fecha_alta: input.fecha_alta || todayKey(),
        activo: input.activo ?? true,
        created_by: userId,
      })
      .select(
        'id,nombre,apellido,dni,obra_social,telefono,email,notas,fecha_nacimiento,fecha_alta,activo,created_at',
      )
      .single()

    handleSupabaseWriteError('createPaciente', error, {
      duplicate: 'Ya existe un paciente con ese DNI.',
    })

    return mapPaciente(data as PacienteRow)
  },

  updatePaciente: async () => throwReadOnly('updatePaciente'),

  togglePaciente: async () => throwReadOnly('togglePaciente'),

  listTurnos: async (filters = {}) => {
    const turnos = await readTurnos()
    const search = normalizeText(filters.search ?? '')

    return sortTurnos(
      turnos.filter((turno) => {
        const paciente = turno.paciente
        const medico = turno.medico
        const matchesSearch = search
          ? normalizeText(
              `${paciente?.nombre ?? ''} ${paciente?.apellido ?? ''} ${paciente?.dni ?? ''} ${medico?.nombre ?? ''}`,
            ).includes(search)
          : true
        const matchesEstado =
          !filters.estado || filters.estado === 'todos' ? true : turno.estado === filters.estado
        const matchesFecha = filters.fecha ? turno.fecha === filters.fecha : true
        const matchesMedico = filters.medico_id ? turno.medico_id === filters.medico_id : true
        const matchesObraSocial = filters.obra_social
          ? turno.obra_social === filters.obra_social
          : true
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
      }),
    )
  },

  findTurnoConflict: async (input) => {
    const turnos = await supabaseApi.listTurnos({
      fecha: input.fecha,
      medico_id: input.medico_id,
    })

    return (
      turnos.find(
        (turno) =>
          turno.id !== input.excludeId &&
          turno.hora.slice(0, 5) === input.hora.slice(0, 5) &&
          !['cancelado', 'ausente', 'reprogramado'].includes(turno.estado),
      ) ?? null
    )
  },

  createTurno: async (input) => {
    const supabase = getSupabaseClient()
    const userId = await getCurrentUserIdForAction('crear turnos')
    const medicoId = requireText(input.medico_id, 'SeleccionÃ¡ un mÃ©dico.')
    const pacienteId = requireText(input.paciente_id, 'SeleccionÃ¡ un paciente.')
    const fecha = requireText(input.fecha, 'La fecha es obligatoria.')
    const hora = requireText(input.hora, 'La hora es obligatoria.').slice(0, 5)
    const obraSocial = requireText(input.obra_social, 'La obra social es obligatoria.')

    assertDateKey(fecha)
    assertTimeValue(hora)

    if (input.estado && input.estado !== 'pendiente') {
      throw new Error('Por ahora los turnos nuevos en Supabase se crean como pendientes.')
    }

    const { data: medicoData, error: medicoError } = await supabase
      .from('medicos')
      .select(
        'id,nombre,especialidad,consultorio,matricula,telefono,email,obras_sociales,dias_disponibles,activo',
      )
      .eq('id', medicoId)
      .maybeSingle()

    handleSupabaseError('createTurno.medico', medicoError)

    if (!medicoData) {
      throw new Error('SeleccionÃ¡ un mÃ©dico vÃ¡lido.')
    }

    const medico = mapMedico(medicoData as MedicoRow)

    if (!medico.activo) {
      throw new Error('No se puede crear un turno a un mÃ©dico inactivo.')
    }

    const { data: pacienteData, error: pacienteError } = await supabase
      .from('pacientes')
      .select(
        'id,nombre,apellido,dni,obra_social,telefono,email,notas,fecha_nacimiento,fecha_alta,activo,created_at',
      )
      .eq('id', pacienteId)
      .maybeSingle()

    handleSupabaseError('createTurno.paciente', pacienteError)

    if (!pacienteData) {
      throw new Error('SeleccionÃ¡ un paciente vÃ¡lido.')
    }

    const paciente = mapPaciente(pacienteData as PacienteRow)

    if (!paciente.activo) {
      throw new Error('No se puede crear un turno a un paciente inactivo.')
    }

    const { data: turnosDelHorario, error: conflictError } = await supabase
      .from('turnos')
      .select('id,hora,estado')
      .eq('medico_id', medicoId)
      .eq('fecha', fecha)

    handleSupabaseError('createTurno.conflicto', conflictError)

    const hasConflict = (turnosDelHorario ?? []).some((turno) => {
      const estado = normalizeTurnoEstado(turno.estado)
      return (
        normalizeTimeValue(turno.hora) === hora &&
        !['cancelado', 'ausente', 'reprogramado'].includes(estado)
      )
    })

    if (hasConflict) {
      throw new Error('Ya existe un turno para este mÃ©dico en ese horario.')
    }

    const { data, error } = await supabase
      .from('turnos')
      .insert({
        medico_id: medicoId,
        paciente_id: pacienteId,
        fecha,
        hora,
        estado: 'pendiente',
        obra_social: obraSocial,
        consultorio_cache: medico.consultorio,
        notas: compactOptional(input.notas),
        llamado_count: 0,
        pospuesto_count: 0,
        reprogramado_count: 0,
        started_at: null,
        completed_at: null,
        created_by: userId,
      })
      .select(
        `
          id,
          medico_id,
          paciente_id,
          fecha,
          hora,
          estado,
          obra_social,
          consultorio_cache,
          notas,
          llamado_count,
          pospuesto_count,
          reprogramado_count,
          started_at,
          completed_at,
          created_at,
          updated_at,
          medico:medicos (
            id,
            nombre,
            especialidad,
            consultorio,
            matricula,
            telefono,
            email,
            obras_sociales,
            dias_disponibles,
            activo
          ),
          paciente:pacientes (
            id,
            nombre,
            apellido,
            dni,
            obra_social,
            telefono,
            email,
            notas,
            fecha_nacimiento,
            fecha_alta,
            activo,
            created_at
          )
        `,
      )
      .single()

    if (error?.code === '42501') {
      throw new Error('No tenÃ©s permisos para crear turnos con este usuario.')
    }

    if (error?.code === '23503') {
      throw new Error('SeleccionÃ¡ un mÃ©dico y un paciente vÃ¡lidos.')
    }

    handleSupabaseWriteError('createTurno', error, {
      duplicate: 'Ya existe un turno con esos datos.',
    })

    return mapTurno(data as TurnoRow)
  },

  updateTurno: async () => throwReadOnly('updateTurno'),

  cambiarEstadoTurno: async () => throwReadOnly('cambiarEstadoTurno'),

  cancelarTurno: async () => throwReadOnly('cancelarTurno'),

  marcarAusenteTurno: async () => throwReadOnly('marcarAusenteTurno'),

  reprogramarTurno: async () => throwReadOnly('reprogramarTurno'),

  posponerTurno: async () => throwReadOnly('posponerTurno'),

  siguienteTurno: async () => throwReadOnly('siguienteTurno'),

  listTurneroEvents: async () => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('turnero_events')
      .select('id,turno_id,medico_id,accion,consultorio,paciente_display,llamado_nro,created_at')
      .order('created_at', { ascending: false })

    handleSupabaseError('listTurneroEvents', error)

    return ((data ?? []) as TurneroEventRow[])
      .map(mapTurneroEvent)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  rellamarTurno: async () => throwReadOnly('rellamarTurno'),

  resetDemoData: async () => throwReadOnly('resetDemoData'),

  reset: async () => throwReadOnly('reset'),
}
