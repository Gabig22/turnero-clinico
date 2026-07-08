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

  createMedico: async () => throwReadOnly('createMedico'),

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

  createPaciente: async () => throwReadOnly('createPaciente'),

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

  createTurno: async () => throwReadOnly('createTurno'),

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
