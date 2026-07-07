import { formatDateDisplay, todayISO } from '@/lib/dates/displayDate'
import {
  readBackupMetadata,
  writeBackupMetadata,
  type BackupMetadata,
} from '@/lib/storage/backupMetadataStorage'
import {
  clearDoctorDemoSelectedId,
  readDoctorDemoSelectedId,
  writeDoctorDemoSelectedId,
} from '@/lib/storage/doctorDemoStorage'
import { MOCK_STORAGE_KEY, readMockStorage, writeMockStorage } from '@/lib/storage/mockStorage'
import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_TURNERO_SETTINGS,
  readAppSettings,
  readTurneroSettings,
  writeAppSettings,
  writeTurneroSettings,
} from '@/lib/storage/settingsStorage'
import type {
  AppSettings,
  Medico,
  MockDatabase,
  Paciente,
  TurneroEvent,
  TurneroSettings,
  Turno,
  TurnoEstado,
} from '@/types'

type BackupMetadataPayload = {
  app_name: 'turnero-clinico'
  schemaVersion: 1
  exported_at: string
}

export type TurneroBackup = MockDatabase & {
  metadata: BackupMetadataPayload
  app_settings: AppSettings
  turnero_settings: TurneroSettings
  doctor_demo_selected_id: string | null
}

export type DemoDataStatus = {
  medicos: number
  pacientes: number
  turnos: number
  turneroEvents: number
  lastImportedAt: string | null
  storageBytes: number
}

const estadoLabels: Record<TurnoEstado, string> = {
  pendiente: 'Pendiente',
  en_atencion: 'En atención',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
  pospuesto: 'Pospuesto',
  ausente: 'Ausente',
  reprogramado: 'Reprogramado',
}

const slotDurations: AppSettings['slotDuracion'][] = [15, 20, 30, 40]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readArray<T>(record: Record<string, unknown>, key: string, label: string) {
  const value = record[key]

  if (!Array.isArray(value)) {
    throw new Error(`El backup no incluye ${label}.`)
  }

  return value as T[]
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback
  }

  const normalized = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)

  return normalized.length ? normalized : fallback
}

function normalizeAppSettings(value: unknown): AppSettings {
  if (!isRecord(value)) {
    return DEFAULT_APP_SETTINGS
  }

  const slotDuracion = slotDurations.includes(value.slotDuracion as AppSettings['slotDuracion'])
    ? (value.slotDuracion as AppSettings['slotDuracion'])
    : DEFAULT_APP_SETTINGS.slotDuracion

  return {
    horarioInicio:
      typeof value.horarioInicio === 'string'
        ? value.horarioInicio
        : DEFAULT_APP_SETTINGS.horarioInicio,
    horarioFin:
      typeof value.horarioFin === 'string' ? value.horarioFin : DEFAULT_APP_SETTINGS.horarioFin,
    slotDuracion,
    obrasSociales: normalizeStringArray(value.obrasSociales, DEFAULT_APP_SETTINGS.obrasSociales),
  }
}

function normalizeTurneroSettings(value: unknown): TurneroSettings {
  if (!isRecord(value)) {
    return DEFAULT_TURNERO_SETTINGS
  }

  return {
    dingEnabled:
      typeof value.dingEnabled === 'boolean'
        ? value.dingEnabled
        : DEFAULT_TURNERO_SETTINGS.dingEnabled,
    highContrastEnabled:
      typeof value.highContrastEnabled === 'boolean'
        ? value.highContrastEnabled
        : DEFAULT_TURNERO_SETTINGS.highContrastEnabled,
  }
}

function normalizeMetadata(value: unknown): BackupMetadataPayload {
  if (!isRecord(value)) {
    return {
      app_name: 'turnero-clinico',
      schemaVersion: 1,
      exported_at: new Date().toISOString(),
    }
  }

  return {
    app_name: 'turnero-clinico',
    schemaVersion: 1,
    exported_at:
      typeof value.exported_at === 'string' ? value.exported_at : new Date().toISOString(),
  }
}

function formatMaybeDate(value?: string | null) {
  return value ? formatDateDisplay(value) : ''
}

function getPacienteDisplay(paciente?: Paciente) {
  return paciente ? `${paciente.apellido}, ${paciente.nombre}` : 'Paciente sin datos'
}

function calculateBytes(value: unknown) {
  const text = JSON.stringify(value)

  if (typeof Blob !== 'undefined') {
    return new Blob([text]).size
  }

  return new TextEncoder().encode(text).length
}

export async function parseBackupFile(file: File) {
  if (!file.name.toLocaleLowerCase('es-AR').endsWith('.json')) {
    throw new Error('Seleccioná un archivo .json de backup.')
  }

  try {
    return JSON.parse(await file.text()) as unknown
  } catch {
    throw new Error('No se pudo leer el archivo de backup.')
  }
}

export function validateBackupShape(data: unknown): TurneroBackup {
  if (!isRecord(data)) {
    throw new Error('El archivo no tiene el formato esperado.')
  }

  const medicos = readArray<Medico>(data, 'medicos', 'la lista de médicos')
  const pacientes = readArray<Paciente>(data, 'pacientes', 'la lista de pacientes')
  const turnos = readArray<Turno>(data, 'turnos', 'la lista de turnos')
  const turneroEvents = Array.isArray(data.turnero_events)
    ? (data.turnero_events as TurneroEvent[])
    : []
  const doctorDemoSelectedId =
    typeof data.doctor_demo_selected_id === 'string' && data.doctor_demo_selected_id.trim()
      ? data.doctor_demo_selected_id.trim()
      : null

  return {
    metadata: normalizeMetadata(data.metadata),
    medicos,
    pacientes,
    turnos,
    turnero_events: turneroEvents,
    app_settings: normalizeAppSettings(data.app_settings),
    turnero_settings: normalizeTurneroSettings(data.turnero_settings),
    doctor_demo_selected_id: doctorDemoSelectedId,
  }
}

export const backupApi = {
  createBackupPayload: (): TurneroBackup => {
    const database = readMockStorage()

    return {
      metadata: {
        app_name: 'turnero-clinico',
        schemaVersion: 1,
        exported_at: new Date().toISOString(),
      },
      ...database,
      app_settings: readAppSettings(),
      turnero_settings: readTurneroSettings(),
      doctor_demo_selected_id: readDoctorDemoSelectedId(),
    }
  },

  getBackupFilename: () => `turnero-clinico-backup-${todayISO()}.json`,

  importBackup: (backup: TurneroBackup) => {
    const database: MockDatabase = {
      medicos: backup.medicos,
      pacientes: backup.pacientes,
      turnos: backup.turnos,
      turnero_events: backup.turnero_events,
    }

    writeMockStorage(database)
    writeAppSettings(backup.app_settings)
    writeTurneroSettings(backup.turnero_settings)

    if (
      backup.doctor_demo_selected_id &&
      database.medicos.some((medico) => medico.id === backup.doctor_demo_selected_id)
    ) {
      writeDoctorDemoSelectedId(backup.doctor_demo_selected_id)
    } else {
      clearDoctorDemoSelectedId()
    }

    writeBackupMetadata({
      ...readBackupMetadata(),
      last_imported_at: new Date().toISOString(),
    })

    return database
  },

  getDemoDataStatus: (): DemoDataStatus => {
    const database = readMockStorage()
    const appSettings = readAppSettings()
    const turneroSettings = readTurneroSettings()
    const selectedDoctorId = readDoctorDemoSelectedId()
    const backupMetadata = readBackupMetadata()
    const storageSnapshot = {
      [MOCK_STORAGE_KEY]: database,
      app_settings: appSettings,
      turnero_settings: turneroSettings,
      doctor_demo_selected_id: selectedDoctorId,
      backup_metadata: backupMetadata,
    }

    return {
      medicos: database.medicos.length,
      pacientes: database.pacientes.length,
      turnos: database.turnos.length,
      turneroEvents: database.turnero_events.length,
      lastImportedAt: backupMetadata.last_imported_at ?? null,
      storageBytes: calculateBytes(storageSnapshot),
    }
  },

  getBackupMetadata: (): BackupMetadata => readBackupMetadata(),

  getTurnosCsvRows: () => {
    const database = readMockStorage()
    const medicos = new Map(database.medicos.map((medico) => [medico.id, medico]))
    const pacientes = new Map(database.pacientes.map((paciente) => [paciente.id, paciente]))

    return database.turnos
      .slice()
      .sort((a, b) => {
        const dateComparison = a.fecha.localeCompare(b.fecha)
        return dateComparison !== 0 ? dateComparison : a.hora.localeCompare(b.hora)
      })
      .map((turno) => {
        const paciente = pacientes.get(turno.paciente_id)
        const medico = medicos.get(turno.medico_id)

        return {
          fecha: formatDateDisplay(turno.fecha),
          hora: turno.hora.slice(0, 5),
          paciente: getPacienteDisplay(paciente),
          dni: paciente?.dni ?? '',
          obra_social: turno.obra_social,
          médico: medico?.nombre ?? 'Médico sin datos',
          consultorio: turno.consultorio_cache ?? medico?.consultorio ?? '',
          estado: estadoLabels[turno.estado],
          notas: turno.notas ?? '',
        }
      })
  },

  getPacientesCsvRows: () => {
    const database = readMockStorage()

    return database.pacientes
      .slice()
      .sort((a, b) =>
        `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es'),
      )
      .map((paciente) => ({
        apellido: paciente.apellido,
        nombre: paciente.nombre,
        dni: paciente.dni,
        obra_social: paciente.obra_social,
        telefono: paciente.telefono ?? '',
        email: paciente.email ?? '',
        fecha_nacimiento: formatMaybeDate(paciente.fecha_nacimiento),
        fecha_alta: formatMaybeDate(paciente.fecha_alta),
        activo: paciente.activo ? 'Activo' : 'Inactivo',
        notas: paciente.notas ?? '',
      }))
  },

  getMedicosCsvRows: () => {
    const database = readMockStorage()

    return database.medicos
      .slice()
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      .map((medico) => ({
        nombre: medico.nombre,
        especialidad: medico.especialidad,
        consultorio: medico.consultorio,
        matricula: medico.matricula ?? '',
        telefono: medico.telefono ?? '',
        email: medico.email ?? '',
        obras_sociales: medico.obras_sociales?.join(', ') ?? '',
        dias_disponibles: medico.dias_disponibles?.join(', ') ?? '',
        activo: medico.activo ? 'Activo' : 'Inactivo',
      }))
  },
}
