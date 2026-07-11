import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_TURNERO_SETTINGS,
} from '@/lib/storage/settingsStorage'
import { formatMinutes, parseTimeToMinutes } from '@/lib/dates/timeSlots'
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
type TurnoInputForUpdate = Parameters<typeof mockApi.updateTurno>[1]
type MedicoInputForUpdate = Parameters<typeof mockApi.updateMedico>[1]
type PacienteInputForUpdate = Parameters<typeof mockApi.updatePaciente>[1]

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

const MEDICO_SELECT =
  'id,nombre,especialidad,consultorio,matricula,telefono,email,obras_sociales,dias_disponibles,activo'

const PACIENTE_SELECT =
  'id,nombre,apellido,dni,obra_social,telefono,email,notas,fecha_nacimiento,fecha_alta,activo,created_at'

const TURNO_SELECT = `
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
`

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

function normalizeObrasSociales(values: unknown) {
  const source = Array.isArray(values) ? values : DEFAULT_APP_SETTINGS.obrasSociales
  const seen = new Set<string>()
  const normalized = source
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLocaleLowerCase('es-AR')

      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })

  return normalized.length ? normalized : DEFAULT_APP_SETTINGS.obrasSociales
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

function formatNowForNote() {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
}

function appendTurnoNote(current: string | null | undefined, nextNote: string) {
  const currentNote = current?.trim()
  return currentNote ? `${currentNote}\n${nextNote}` : nextNote
}

function formatDateKeyForNote(dateKey: string) {
  const [year, month, day] = dateKey.split('-')

  return year && month && day ? `${day}/${month}/${year}` : dateKey
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
    throw new Error('Seleccioná una fecha válida.')
  }
}

function assertTimeValue(value: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new Error('Seleccioná una hora válida.')
  }
}

function assertTimeWithinSettings(value: string, settings: AppSettings) {
  const selected = parseTimeToMinutes(value)
  const start = parseTimeToMinutes(settings.horarioInicio)
  const end = parseTimeToMinutes(settings.horarioFin)

  if (selected === null || start === null || end === null || start >= end) {
    return
  }

  if (selected < start || selected >= end) {
    throw new Error(
      `La hora debe estar dentro del horario configurado (${settings.horarioInicio} a ${settings.horarioFin}).`,
    )
  }
}

function normalizeAppSettingsInput(input: Partial<AppSettings>, current: AppSettings): AppSettings {
  const horarioInicio = input.horarioInicio?.trim() || current.horarioInicio
  const horarioFin = input.horarioFin?.trim() || current.horarioFin
  const slotDuracion = SLOT_DURATIONS.includes(input.slotDuracion as AppSettings['slotDuracion'])
    ? (input.slotDuracion as AppSettings['slotDuracion'])
    : current.slotDuracion
  const obrasSociales =
    input.obrasSociales === undefined
      ? normalizeObrasSociales(current.obrasSociales)
      : normalizeObrasSociales(input.obrasSociales)

  assertTimeValue(horarioInicio)
  assertTimeValue(horarioFin)

  if (horarioInicio >= horarioFin) {
    throw new Error('El horario de inicio debe ser menor al horario de fin.')
  }

  return {
    horarioInicio,
    horarioFin,
    slotDuracion,
    obrasSociales,
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
    `Supabase está conectado en modo solo lectura para esta fase (${methodName}). Seguí usando modo mock para crear, editar o cambiar estados hasta implementar S5/S6.`,
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
    throw new Error(messages.permission ?? 'No tenés permisos para realizar esta acción.')
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
    throw new Error(`Necesitás iniciar sesión para ${actionLabel}.`)
  }

  return data.user.id
}

async function ensureCurrentUserForWrite(actionLabel: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user?.id) {
    throw new Error(`Necesitás iniciar sesión para ${actionLabel}.`)
  }
}

async function readMedicos() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('medicos')
    .select(MEDICO_SELECT)
    .order('nombre', { ascending: true })

  handleSupabaseError('listMedicos', error)
  return ((data ?? []) as MedicoRow[]).map(mapMedico)
}

async function readPacientes() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('pacientes')
    .select(PACIENTE_SELECT)
    .order('apellido', { ascending: true })
    .order('nombre', { ascending: true })

  handleSupabaseError('listPacientes', error)
  return ((data ?? []) as PacienteRow[]).map(mapPaciente)
}

async function readTurnos() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('turnos')
    .select(TURNO_SELECT)
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true })

  handleSupabaseError('listTurnos', error)
  return ((data ?? []) as TurnoRow[]).map(mapTurno)
}

async function readTurnoById(id: string, methodName = 'readTurnoById') {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('turnos')
    .select(TURNO_SELECT)
    .eq('id', id)
    .maybeSingle()

  handleSupabaseError(methodName, error)

  if (!data) {
    throw new Error('No se encontró el turno.')
  }

  return mapTurno(data as TurnoRow)
}

function buildPacienteDisplay(turno: TurnoDetallado) {
  return turno.paciente
    ? `${turno.paciente.apellido}, ${turno.paciente.nombre} (${turno.obra_social})`
    : 'Paciente sin datos'
}

async function createTurneroEvent(turno: TurnoDetallado, accion: TurneroEvent['accion']) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('turnero_events')
    .insert({
      turno_id: turno.id,
      medico_id: turno.medico_id,
      accion,
      consultorio: turno.consultorio_cache ?? turno.medico?.consultorio ?? null,
      paciente_display: buildPacienteDisplay(turno),
      llamado_nro: turno.llamado_count ?? 1,
    })
    .select('id,turno_id,medico_id,accion,consultorio,paciente_display,llamado_nro,created_at')
    .single()

  handleSupabaseWriteError('createTurneroEvent', error)

  return mapTurneroEvent(data as TurneroEventRow)
}

async function readMedicoByIdOrThrow(id: string, methodName: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('medicos')
    .select(MEDICO_SELECT)
    .eq('id', id)
    .maybeSingle()

  handleSupabaseError(methodName, error)

  if (!data) {
    throw new Error('Seleccioná un médico válido.')
  }

  return mapMedico(data as MedicoRow)
}

async function readPacienteByIdOrThrow(id: string, methodName: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('pacientes')
    .select(PACIENTE_SELECT)
    .eq('id', id)
    .maybeSingle()

  handleSupabaseError(methodName, error)

  if (!data) {
    throw new Error('Seleccioná un paciente válido.')
  }

  return mapPaciente(data as PacienteRow)
}

async function updateMedicoAndRead(
  id: string,
  values: Record<string, unknown>,
  methodName = 'updateMedico',
) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('medicos')
    .update(values)
    .eq('id', id)
    .select(MEDICO_SELECT)
    .single()

  handleSupabaseWriteError(methodName, error, {
    duplicate: 'Ya existe un médico con esos datos.',
    permission: 'No tenés permisos para modificar médicos con este usuario.',
  })

  return mapMedico(data as MedicoRow)
}

async function updatePacienteAndRead(
  id: string,
  values: Record<string, unknown>,
  methodName = 'updatePaciente',
) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('pacientes')
    .update(values)
    .eq('id', id)
    .select(PACIENTE_SELECT)
    .single()

  handleSupabaseWriteError(methodName, error, {
    duplicate: 'Ya existe un paciente con ese DNI.',
    permission: 'No tenés permisos para modificar pacientes con este usuario.',
  })

  return mapPaciente(data as PacienteRow)
}

async function ensurePacienteDniIsAvailable(dni: string, excludeId?: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('pacientes').select('id').eq('dni', dni)

  handleSupabaseError('paciente.verificarDni', error)

  const duplicated = (data ?? []).some((item) => item.id !== excludeId)

  if (duplicated) {
    throw new Error('Ya existe un paciente con ese DNI.')
  }
}

async function ensureNoTurnoConflict(input: {
  medicoId: string
  fecha: string
  hora: string
  excludeId?: string
}) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('turnos')
    .select('id,hora,estado')
    .eq('medico_id', input.medicoId)
    .eq('fecha', input.fecha)

  handleSupabaseError('turno.conflicto', error)

  const conflict = (data ?? []).some((turno) => {
    const estado = normalizeTurnoEstado(turno.estado)
    return (
      turno.id !== input.excludeId &&
      normalizeTimeValue(turno.hora) === input.hora &&
      !['cancelado', 'ausente', 'reprogramado'].includes(estado)
    )
  })

  if (conflict) {
    throw new Error('Ya existe un turno para este médico en ese horario.')
  }
}

async function validateTurnoInputForSupabase(input: TurnoInputForUpdate, current?: TurnoDetallado) {
  const medicoId = requireText(input.medico_id ?? current?.medico_id, 'Seleccioná un médico.')
  const pacienteId = requireText(input.paciente_id ?? current?.paciente_id, 'Seleccioná un paciente.')
  const fecha = requireText(input.fecha ?? current?.fecha, 'La fecha es obligatoria.')
  const hora = requireText(input.hora ?? current?.hora, 'La hora es obligatoria.').slice(0, 5)
  const obraSocial = requireText(
    input.obra_social ?? current?.obra_social,
    'La obra social es obligatoria.',
  )

  assertDateKey(fecha)
  assertTimeValue(hora)

  const [medico, paciente] = await Promise.all([
    readMedicoByIdOrThrow(medicoId, 'turno.medico'),
    readPacienteByIdOrThrow(pacienteId, 'turno.paciente'),
  ])
  const changedMedico = !current || current.medico_id !== medicoId
  const changedPaciente = !current || current.paciente_id !== pacienteId

  if (changedMedico && !medico.activo) {
    throw new Error('No se puede crear o reasignar un turno a un médico inactivo.')
  }

  if (changedPaciente && !paciente.activo) {
    throw new Error('No se puede crear o reasignar un turno a un paciente inactivo.')
  }

  if (input.estado && !TURNO_ESTADOS.includes(input.estado)) {
    throw new Error('Seleccioná un estado válido.')
  }

  return {
    medico,
    paciente,
    medicoId,
    pacienteId,
    fecha,
    hora,
    obraSocial,
  }
}

async function updateTurnoAndRead(id: string, values: Record<string, unknown>, methodName: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('turnos')
    .update(values)
    .eq('id', id)
    .select(TURNO_SELECT)
    .single()

  handleSupabaseWriteError(methodName, error)

  return mapTurno(data as TurnoRow)
}

async function finishOtherCurrentAttendances(
  medicoId: string,
  fecha: string,
  excludeTurnoId: string,
  completedAt: string,
) {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('turnos')
    .update({
      estado: 'finalizado',
      completed_at: completedAt,
      updated_at: completedAt,
    })
    .eq('medico_id', medicoId)
    .eq('fecha', fecha)
    .eq('estado', 'en_atencion')
    .neq('id', excludeTurnoId)

  handleSupabaseWriteError('finishOtherCurrentAttendances', error)
}

async function applyTurnoEstadoSupabase(id: string, estado: TurnoEstado) {
  await ensureCurrentUserForWrite('actualizar turnos')

  if (!TURNO_ESTADOS.includes(estado)) {
    throw new Error('Seleccioná un estado válido.')
  }

  const turno = await readTurnoById(id, 'cambiarEstadoTurno.turno')
  const now = new Date().toISOString()
  const shouldCreateCallEvent = estado === 'en_atencion' && turno.estado !== 'en_atencion'
  const shouldSetCompletedAt = estado === 'finalizado' || estado === 'ausente'
  const shouldAppendAbsentNote = estado === 'ausente' && turno.estado !== 'ausente'

  if (shouldCreateCallEvent) {
    // Regla central: por médico y fecha solo queda un turno en atención.
    await finishOtherCurrentAttendances(turno.medico_id, turno.fecha, turno.id, now)
  }

  const updatedTurno = await updateTurnoAndRead(
    id,
    {
      estado,
      started_at: estado === 'en_atencion' ? turno.started_at ?? now : turno.started_at,
      completed_at: shouldSetCompletedAt ? now : estado === 'en_atencion' ? null : turno.completed_at,
      llamado_count: shouldCreateCallEvent
        ? (turno.llamado_count ?? 0) + 1
        : turno.llamado_count ?? 0,
      notas: shouldAppendAbsentNote
        ? appendTurnoNote(turno.notas, `Marcado como ausente el ${formatNowForNote()}.`)
        : turno.notas,
      updated_at: now,
    },
    'cambiarEstadoTurno',
  )

  if (shouldCreateCallEvent) {
    await createTurneroEvent(updatedTurno, 'CALL')
  }

  return updatedTurno
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

  updateAppSettings: async (input) => {
    const supabase = getSupabaseClient()
    const userId = await getCurrentUserIdForAction('modificar configuración')
    const settings = normalizeAppSettingsInput(input, await supabaseApi.getAppSettings())
    const { data, error } = await supabase
      .from('app_settings')
      .upsert(
        {
          id: true,
          horario_inicio: settings.horarioInicio,
          horario_fin: settings.horarioFin,
          slot_duracion: settings.slotDuracion,
          obras_sociales: settings.obrasSociales,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select('horario_inicio,horario_fin,slot_duracion,obras_sociales')
      .single()

    handleSupabaseWriteError('updateAppSettings', error, {
      permission: 'No tenés permisos para modificar la configuración con este usuario.',
    })

    const row = data as AppSettingsRow

    return {
      horarioInicio: normalizeTimeValue(row.horario_inicio) || settings.horarioInicio,
      horarioFin: normalizeTimeValue(row.horario_fin) || settings.horarioFin,
      slotDuracion: normalizeSlotDuration(row.slot_duracion),
      obrasSociales: normalizeObrasSociales(row.obras_sociales),
    }
  },

  resetAppSettings: async () => {
    const supabase = getSupabaseClient()
    const userId = await getCurrentUserIdForAction('restaurar configuración')
    const { data, error } = await supabase
      .from('app_settings')
      .upsert(
        {
          id: true,
          horario_inicio: DEFAULT_APP_SETTINGS.horarioInicio,
          horario_fin: DEFAULT_APP_SETTINGS.horarioFin,
          slot_duracion: DEFAULT_APP_SETTINGS.slotDuracion,
          obras_sociales: DEFAULT_APP_SETTINGS.obrasSociales,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select('horario_inicio,horario_fin,slot_duracion,obras_sociales')
      .single()

    handleSupabaseWriteError('resetAppSettings', error, {
      permission: 'No tenés permisos para restaurar la configuración con este usuario.',
    })

    const row = data as AppSettingsRow

    return {
      horarioInicio: normalizeTimeValue(row.horario_inicio) || DEFAULT_APP_SETTINGS.horarioInicio,
      horarioFin: normalizeTimeValue(row.horario_fin) || DEFAULT_APP_SETTINGS.horarioFin,
      slotDuracion: normalizeSlotDuration(row.slot_duracion),
      obrasSociales: normalizeObrasSociales(row.obras_sociales),
    }
  },

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

  updateTurneroSettings: async (input) => {
    const supabase = getSupabaseClient()
    const userId = await getCurrentUserIdForAction('modificar configuración del turnero')
    const current = await supabaseApi.getTurneroSettings()
    const nextSettings = {
      dingEnabled: input.dingEnabled ?? current.dingEnabled,
      highContrastEnabled: input.highContrastEnabled ?? current.highContrastEnabled,
    }
    const { data, error } = await supabase
      .from('turnero_settings')
      .upsert(
        {
          id: true,
          ding_enabled: nextSettings.dingEnabled,
          high_contrast_enabled: nextSettings.highContrastEnabled,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select('ding_enabled,high_contrast_enabled')
      .single()

    handleSupabaseWriteError('updateTurneroSettings', error, {
      permission: 'No tenés permisos para modificar la configuración del turnero con este usuario.',
    })

    const row = data as TurneroSettingsRow

    return {
      dingEnabled: row.ding_enabled ?? nextSettings.dingEnabled,
      highContrastEnabled: row.high_contrast_enabled ?? nextSettings.highContrastEnabled,
    }
  },

  resetTurneroSettings: async () => {
    const supabase = getSupabaseClient()
    const userId = await getCurrentUserIdForAction('restaurar configuración del turnero')
    const { data, error } = await supabase
      .from('turnero_settings')
      .upsert(
        {
          id: true,
          ding_enabled: DEFAULT_TURNERO_SETTINGS.dingEnabled,
          high_contrast_enabled: DEFAULT_TURNERO_SETTINGS.highContrastEnabled,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select('ding_enabled,high_contrast_enabled')
      .single()

    handleSupabaseWriteError('resetTurneroSettings', error, {
      permission: 'No tenés permisos para restaurar la configuración del turnero con este usuario.',
    })

    const row = data as TurneroSettingsRow

    return {
      dingEnabled: row.ding_enabled ?? DEFAULT_TURNERO_SETTINGS.dingEnabled,
      highContrastEnabled:
        row.high_contrast_enabled ?? DEFAULT_TURNERO_SETTINGS.highContrastEnabled,
    }
  },

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
      .select(MEDICO_SELECT)
      .eq('id', id)
      .maybeSingle()

    handleSupabaseError('getMedicoById', error)

    return data ? mapMedico(data as MedicoRow) : null
  },

  createMedico: async (input) => {
    await ensureCurrentUserForWrite('crear médicos')

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
      .select(MEDICO_SELECT)
      .single()

    if (error?.code === '42501') {
      throw new Error('No tenés permisos para crear médicos con este usuario.')
    }

    handleSupabaseWriteError('createMedico', error, {
      duplicate: 'Ya existe un médico con esos datos.',
    })

    return mapMedico(data as MedicoRow)
  },

  updateMedico: async (id, input: MedicoInputForUpdate) => {
    await ensureCurrentUserForWrite('modificar médicos')

    const medico = await readMedicoByIdOrThrow(id, 'updateMedico.medico')
    const updatedMedico = await updateMedicoAndRead(id, {
      nombre: input.nombre === undefined ? medico.nombre : requireText(input.nombre, 'El nombre es obligatorio.'),
      especialidad:
        input.especialidad === undefined
          ? medico.especialidad
          : requireText(input.especialidad, 'La especialidad es obligatoria.'),
      consultorio:
        input.consultorio === undefined
          ? medico.consultorio
          : requireText(input.consultorio, 'El consultorio es obligatorio.'),
      matricula: input.matricula === undefined ? medico.matricula ?? '' : input.matricula?.trim() ?? '',
      telefono: input.telefono === undefined ? medico.telefono ?? null : compactOptional(input.telefono),
      email: input.email === undefined ? medico.email ?? null : compactOptional(input.email),
      obras_sociales:
        input.obras_sociales === undefined
          ? medico.obras_sociales ?? []
          : toStringArray(input.obras_sociales),
      dias_disponibles:
        input.dias_disponibles === undefined
          ? medico.dias_disponibles ?? []
          : toStringArray(input.dias_disponibles),
      activo: input.activo ?? medico.activo,
    })

    if (updatedMedico.consultorio !== medico.consultorio) {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('turnos')
        .update({ consultorio_cache: updatedMedico.consultorio })
        .eq('medico_id', id)

      handleSupabaseWriteError('updateMedico.turnosConsultorio', error)
    }

    return updatedMedico
  },

  toggleMedico: async (id) => {
    await ensureCurrentUserForWrite('cambiar estado de médicos')

    const medico = await readMedicoByIdOrThrow(id, 'toggleMedico.medico')
    return updateMedicoAndRead(id, { activo: !medico.activo }, 'toggleMedico')
  },

  deleteMedico: async (id) => {
    await ensureCurrentUserForWrite('eliminar médicos')

    const supabase = getSupabaseClient()
    const { data: turnos, error: turnosError } = await supabase
      .from('turnos')
      .select('id')
      .eq('medico_id', id)
      .limit(1)

    handleSupabaseError('deleteMedico.turnos', turnosError)

    if ((turnos ?? []).length) {
      throw new Error('No se puede eliminar porque tiene turnos registrados. Podés desactivarlo.')
    }

    const { error } = await supabase.from('medicos').delete().eq('id', id)

    handleSupabaseWriteError('deleteMedico', error, {
      permission: 'No tenés permisos para eliminar médicos con este usuario.',
    })

    return true
  },

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
    await ensurePacienteDniIsAvailable(dni)

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
      .select(PACIENTE_SELECT)
      .single()

    handleSupabaseWriteError('createPaciente', error, {
      duplicate: 'Ya existe un paciente con ese DNI.',
    })

    return mapPaciente(data as PacienteRow)
  },

  updatePaciente: async (id, input: PacienteInputForUpdate) => {
    await ensureCurrentUserForWrite('modificar pacientes')

    const paciente = await readPacienteByIdOrThrow(id, 'updatePaciente.paciente')
    const dni = input.dni === undefined ? paciente.dni : requireText(input.dni, 'El DNI es obligatorio.')

    if (dni !== paciente.dni) {
      await ensurePacienteDniIsAvailable(dni, id)
    }

    return updatePacienteAndRead(id, {
      nombre: input.nombre === undefined ? paciente.nombre : requireText(input.nombre, 'El nombre es obligatorio.'),
      apellido:
        input.apellido === undefined
          ? paciente.apellido
          : requireText(input.apellido, 'El apellido es obligatorio.'),
      dni,
      obra_social:
        input.obra_social === undefined
          ? paciente.obra_social
          : requireText(input.obra_social, 'La obra social es obligatoria.'),
      telefono: input.telefono === undefined ? paciente.telefono ?? null : compactOptional(input.telefono),
      email: input.email === undefined ? paciente.email ?? null : compactOptional(input.email),
      notas: input.notas === undefined ? paciente.notas ?? null : compactOptional(input.notas),
      fecha_nacimiento:
        input.fecha_nacimiento === undefined
          ? paciente.fecha_nacimiento ?? null
          : input.fecha_nacimiento || null,
      fecha_alta:
        input.fecha_alta === undefined ? paciente.fecha_alta ?? null : input.fecha_alta || null,
      activo: input.activo ?? paciente.activo,
    })
  },

  togglePaciente: async (id) => {
    await ensureCurrentUserForWrite('cambiar estado de pacientes')

    const paciente = await readPacienteByIdOrThrow(id, 'togglePaciente.paciente')
    return updatePacienteAndRead(id, { activo: !paciente.activo }, 'togglePaciente')
  },

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
    const medicoId = requireText(input.medico_id, 'Seleccioná un médico.')
    const pacienteId = requireText(input.paciente_id, 'Seleccioná un paciente.')
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
      .select(MEDICO_SELECT)
      .eq('id', medicoId)
      .maybeSingle()

    handleSupabaseError('createTurno.medico', medicoError)

    if (!medicoData) {
      throw new Error('Seleccioná un médico válido.')
    }

    const medico = mapMedico(medicoData as MedicoRow)

    if (!medico.activo) {
      throw new Error('No se puede crear un turno a un médico inactivo.')
    }

    const { data: pacienteData, error: pacienteError } = await supabase
      .from('pacientes')
      .select(PACIENTE_SELECT)
      .eq('id', pacienteId)
      .maybeSingle()

    handleSupabaseError('createTurno.paciente', pacienteError)

    if (!pacienteData) {
      throw new Error('Seleccioná un paciente válido.')
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
      throw new Error('Ya existe un turno para este médico en ese horario.')
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
      .select(TURNO_SELECT)
      .single()

    if (error?.code === '42501') {
      throw new Error('No tenés permisos para crear turnos con este usuario.')
    }

    if (error?.code === '23503') {
      throw new Error('Seleccioná un médico y un paciente válidos.')
    }

    handleSupabaseWriteError('createTurno', error, {
      duplicate: 'Ya existe un turno con esos datos.',
    })

    return mapTurno(data as TurnoRow)
  },

  updateTurno: async (id, input) => {
    await ensureCurrentUserForWrite('actualizar turnos')

    const turno = await readTurnoById(id, 'updateTurno.turno')
    const validatedTurno = await validateTurnoInputForSupabase(input, turno)
    const statusChanged = Boolean(input.estado && input.estado !== turno.estado)
    const dateTimeChanged =
      validatedTurno.medicoId !== turno.medico_id ||
      validatedTurno.fecha !== turno.fecha ||
      validatedTurno.hora !== turno.hora.slice(0, 5)
    const now = new Date().toISOString()

    if (dateTimeChanged) {
      await ensureNoTurnoConflict({
        medicoId: validatedTurno.medicoId,
        fecha: validatedTurno.fecha,
        hora: validatedTurno.hora,
        excludeId: id,
      })
    }

    if (!statusChanged && turno.estado === 'en_atencion' && dateTimeChanged) {
      await finishOtherCurrentAttendances(validatedTurno.medicoId, validatedTurno.fecha, id, now)
    }

    const updatedTurno = await updateTurnoAndRead(
      id,
      {
        medico_id: validatedTurno.medicoId,
        paciente_id: validatedTurno.pacienteId,
        fecha: validatedTurno.fecha,
        hora: validatedTurno.hora,
        obra_social: validatedTurno.obraSocial,
        consultorio_cache: validatedTurno.medico.consultorio,
        notas: input.notas === undefined ? turno.notas : compactOptional(input.notas),
        updated_at: now,
      },
      'updateTurno',
    )

    if (statusChanged && input.estado) {
      return applyTurnoEstadoSupabase(updatedTurno.id, input.estado)
    }

    return updatedTurno
  },

  cambiarEstadoTurno: async (id, estado) => applyTurnoEstadoSupabase(id, estado),

  cancelarTurno: async (id) => applyTurnoEstadoSupabase(id, 'cancelado'),

  marcarAusenteTurno: async (id) => applyTurnoEstadoSupabase(id, 'ausente'),

  reprogramarTurno: async (id, input) => {
    await ensureCurrentUserForWrite('reprogramar turnos')

    const fecha = requireText(input.fecha, 'La fecha es obligatoria.')
    const hora = requireText(input.hora, 'La hora es obligatoria.').slice(0, 5)

    assertDateKey(fecha)
    assertTimeValue(hora)
    assertTimeWithinSettings(hora, await supabaseApi.getAppSettings())

    const turno = await readTurnoById(id, 'reprogramarTurno.turno')

    if (['finalizado', 'cancelado', 'ausente'].includes(turno.estado)) {
      throw new Error('Este turno ya está cerrado y no se puede reprogramar.')
    }

    await ensureNoTurnoConflict({
      medicoId: turno.medico_id,
      fecha,
      hora,
      excludeId: id,
    })

    const motivo = input.motivo?.trim()
    const originalDateTime = `${formatDateKeyForNote(turno.fecha)} ${turno.hora.slice(0, 5)}`
    const note = `Reprogramado desde ${originalDateTime}.${motivo ? ` Motivo: ${motivo}` : ''}`

    return updateTurnoAndRead(
      id,
      {
        fecha,
        hora,
        estado: 'pendiente',
        started_at: null,
        completed_at: null,
        reprogramado_count: (turno.reprogramado_count ?? 0) + 1,
        notas: appendTurnoNote(turno.notas, note),
        updated_at: new Date().toISOString(),
      },
      'reprogramarTurno',
    )
  },

  posponerTurno: async (id, input) => {
    await ensureCurrentUserForWrite('posponer turnos')

    const turno = await readTurnoById(id, 'posponerTurno.turno')

    if (!['pendiente', 'en_atencion'].includes(turno.estado)) {
      throw new Error('Solo se pueden posponer turnos pendientes o en atención.')
    }

    const currentMinutes = parseTimeToMinutes(turno.hora)

    if (currentMinutes === null) {
      throw new Error('El turno no tiene una hora válida para posponer.')
    }

    const settings = await supabaseApi.getAppSettings()
    const turnosDelDia = await supabaseApi.listTurnos({
      medico_id: turno.medico_id,
      fecha: turno.fecha,
    })
    const nextMinutes =
      input.opcion === 'fin_dia'
        ? Math.max(
            ...turnosDelDia
              .map((item) => parseTimeToMinutes(item.hora))
              .filter((value): value is number => value !== null),
            currentMinutes,
          ) + (settings.slotDuracion || 10)
        : currentMinutes + Number(input.opcion)
    const nextHora = formatMinutes(Math.min(nextMinutes, 23 * 60 + 59))
    const motivo = input.motivo?.trim()
    const optionLabel =
      input.opcion === 'fin_dia' ? 'al final del día' : `${input.opcion} minutos`
    const note = `Pospuesto ${optionLabel}.${motivo ? ` Motivo: ${motivo}` : ''}`

    assertTimeValue(nextHora)

    return updateTurnoAndRead(
      id,
      {
        hora: nextHora,
        estado: 'pendiente',
        started_at: null,
        completed_at: null,
        pospuesto_count: (turno.pospuesto_count ?? 0) + 1,
        notas: appendTurnoNote(turno.notas, note),
        updated_at: new Date().toISOString(),
      },
      'posponerTurno',
    )
  },

  siguienteTurno: async (medicoId) => {
    await ensureCurrentUserForWrite('llamar turnos')

    const today = todayKey()
    const now = new Date().toISOString()
    const turnosDelMedicoHoy = await supabaseApi.listTurnos({
      medico_id: medicoId,
      fecha: today,
    })
    const turnosActuales = turnosDelMedicoHoy.filter((turno) => turno.estado === 'en_atencion')
    const siguiente = turnosDelMedicoHoy.find((turno) => turno.estado === 'pendiente')
    let turnoFinalizado: TurnoDetallado | null = null
    let turnoLlamado: TurnoDetallado | null = null

    if (turnosActuales.length) {
      await finishOtherCurrentAttendances(medicoId, today, '__sin_excluir__', now)
      turnoFinalizado = await readTurnoById(turnosActuales[0].id, 'siguienteTurno.finalizado')
    }

    if (siguiente) {
      turnoLlamado = await updateTurnoAndRead(
        siguiente.id,
        {
          estado: 'en_atencion',
          started_at: now,
          completed_at: null,
          llamado_count: (siguiente.llamado_count ?? 0) + 1,
          updated_at: now,
        },
        'siguienteTurno.llamar',
      )
      await createTurneroEvent(turnoLlamado, 'CALL')
    }

    return {
      turnoFinalizado,
      turnoLlamado,
      turnosFinalizados: turnosActuales.length,
    }
  },

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

  rellamarTurno: async (turnoId) => {
    await ensureCurrentUserForWrite('rellamar pacientes')

    const turno = await readTurnoById(turnoId, 'rellamarTurno.turno')

    if (turno.estado !== 'en_atencion') {
      throw new Error('Solo se puede rellamar un turno en atención.')
    }

    const updatedTurno = await updateTurnoAndRead(
      turno.id,
      {
        llamado_count: (turno.llamado_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      },
      'rellamarTurno',
    )
    const event = await createTurneroEvent(updatedTurno, 'RECALL')

    return {
      turno: updatedTurno,
      event,
    }
  },

  resetDemoData: async () => throwReadOnly('resetDemoData'),

  reset: async () => throwReadOnly('reset'),
}
