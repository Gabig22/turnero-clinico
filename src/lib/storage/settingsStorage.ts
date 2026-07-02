import type { AppSettings, TurneroSettings } from '@/types'

export const APP_SETTINGS_KEY = 'app_settings'
export const TURNERO_SETTINGS_KEY = 'turnero_settings'

export const DEFAULT_APP_SETTINGS: AppSettings = {
  horarioInicio: '09:00',
  horarioFin: '17:30',
  slotDuracion: 30,
  obrasSociales: ['OSDE', 'Swiss Medical', 'IAPS', 'IPS', 'PAMI', 'Galeno', 'Particular'],
}

export const DEFAULT_TURNERO_SETTINGS: TurneroSettings = {
  dingEnabled: true,
  highContrastEnabled: false,
}

const validSlotDurations = [15, 20, 30, 40] as const

function isBrowser() {
  return typeof window !== 'undefined'
}

function normalizeObrasSociales(values: unknown) {
  if (!Array.isArray(values)) {
    return DEFAULT_APP_SETTINGS.obrasSociales
  }

  const seen = new Set<string>()
  const normalized = values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLocaleLowerCase('es-AR')

      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })

  return normalized.length ? normalized : DEFAULT_APP_SETTINGS.obrasSociales
}

function normalizeAppSettings(value: Partial<AppSettings> | null | undefined): AppSettings {
  const slotDuracion = validSlotDurations.includes(
    value?.slotDuracion as AppSettings['slotDuracion'],
  )
    ? (value?.slotDuracion as AppSettings['slotDuracion'])
    : DEFAULT_APP_SETTINGS.slotDuracion

  return {
    horarioInicio: value?.horarioInicio || DEFAULT_APP_SETTINGS.horarioInicio,
    horarioFin: value?.horarioFin || DEFAULT_APP_SETTINGS.horarioFin,
    slotDuracion,
    obrasSociales: normalizeObrasSociales(value?.obrasSociales),
  }
}

function normalizeTurneroSettings(
  value: Partial<TurneroSettings> | null | undefined,
): TurneroSettings {
  return {
    dingEnabled: value?.dingEnabled ?? DEFAULT_TURNERO_SETTINGS.dingEnabled,
    highContrastEnabled:
      value?.highContrastEnabled ?? DEFAULT_TURNERO_SETTINGS.highContrastEnabled,
  }
}

function readStorageValue<T>(key: string, fallback: T) {
  if (!isBrowser()) {
    return fallback
  }

  const storedValue = window.localStorage.getItem(key)

  if (!storedValue) {
    window.localStorage.setItem(key, JSON.stringify(fallback))
    return fallback
  }

  try {
    return JSON.parse(storedValue) as T
  } catch {
    window.localStorage.setItem(key, JSON.stringify(fallback))
    return fallback
  }
}

function writeStorageValue<T>(key: string, value: T) {
  if (!isBrowser()) {
    return value
  }

  window.localStorage.setItem(key, JSON.stringify(value))
  return value
}

export function readAppSettings() {
  const storedSettings = readStorageValue<Partial<AppSettings>>(
    APP_SETTINGS_KEY,
    DEFAULT_APP_SETTINGS,
  )
  const settings = normalizeAppSettings(storedSettings)

  return writeStorageValue(APP_SETTINGS_KEY, settings)
}

export function writeAppSettings(input: Partial<AppSettings>) {
  const settings = normalizeAppSettings({
    ...readAppSettings(),
    ...input,
  })

  return writeStorageValue(APP_SETTINGS_KEY, settings)
}

export function resetAppSettings() {
  return writeStorageValue(APP_SETTINGS_KEY, DEFAULT_APP_SETTINGS)
}

export function readTurneroSettings() {
  const storedSettings = readStorageValue<Partial<TurneroSettings>>(
    TURNERO_SETTINGS_KEY,
    DEFAULT_TURNERO_SETTINGS,
  )
  const settings = normalizeTurneroSettings(storedSettings)

  return writeStorageValue(TURNERO_SETTINGS_KEY, settings)
}

export function writeTurneroSettings(input: Partial<TurneroSettings>) {
  const settings = normalizeTurneroSettings({
    ...readTurneroSettings(),
    ...input,
  })

  return writeStorageValue(TURNERO_SETTINGS_KEY, settings)
}

export function resetTurneroSettings() {
  return writeStorageValue(TURNERO_SETTINGS_KEY, DEFAULT_TURNERO_SETTINGS)
}
