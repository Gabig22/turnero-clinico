export type UserRole = 'admin_general' | 'supervisor' | 'doctor' | 'public'

export type Medico = {
  id: string
  nombre: string
  especialidad: string
  consultorio: string
  activo: boolean
  matricula?: string
  obras_sociales?: string[]
  dias_disponibles?: string[]
  telefono?: string
  email?: string
}

export type Paciente = {
  id: string
  nombre: string
  apellido: string
  dni: string
  obra_social: string
  telefono?: string
  email?: string | null
  notas?: string | null
  activo: boolean
  fecha_nacimiento?: string | null
  fecha_alta?: string | null
  created_at?: string
}

export type TurnoEstado =
  | 'pendiente'
  | 'en_atencion'
  | 'finalizado'
  | 'cancelado'
  | 'pospuesto'
  | 'ausente'
  | 'reprogramado'

export type Turno = {
  id: string
  medico_id: string
  paciente_id: string
  fecha: string
  hora: string
  estado: TurnoEstado
  obra_social: string
  consultorio_cache?: string
  notas?: string | null
  llamado_count?: number
  pospuesto_count?: number
  started_at?: string | null
  completed_at?: string | null
  created_at?: string
  updated_at?: string
}

export type TurneroEvent = {
  id: string
  turno_id: string
  medico_id: string
  accion: 'CALL' | 'RECALL'
  consultorio?: string
  paciente_display?: string
  llamado_nro?: number
  created_at: string
}

export type TurnoDetallado = Turno & {
  medico?: Medico
  paciente?: Paciente
}

export type AppSettings = {
  horarioInicio: string
  horarioFin: string
  slotDuracion: 15 | 20 | 30 | 40
  obrasSociales: string[]
}

export type TurneroSettings = {
  dingEnabled: boolean
  highContrastEnabled: boolean
}

export type MockDatabase = {
  medicos: Medico[]
  pacientes: Paciente[]
  turnos: Turno[]
  turnero_events: TurneroEvent[]
}
