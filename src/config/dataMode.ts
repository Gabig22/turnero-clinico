const DATA_MODES = ['mock', 'supabase'] as const
const AUTH_MODES = ['mock', 'supabase'] as const

export type AppDataMode = (typeof DATA_MODES)[number]
export type AppAuthMode = (typeof AUTH_MODES)[number]

function normalizeDataMode(value: unknown): AppDataMode {
  return DATA_MODES.includes(value as AppDataMode) ? (value as AppDataMode) : 'mock'
}

function normalizeAuthMode(value: unknown): AppAuthMode {
  return AUTH_MODES.includes(value as AppAuthMode) ? (value as AppAuthMode) : 'mock'
}

export const APP_DATA_MODE = normalizeDataMode(import.meta.env.VITE_APP_DATA_MODE)
export const APP_AUTH_MODE = normalizeAuthMode(
  import.meta.env.VITE_APP_AUTH_MODE ?? APP_DATA_MODE,
)

export const IS_MOCK_DATA_MODE = APP_DATA_MODE === 'mock'
export const IS_SUPABASE_DATA_MODE = APP_DATA_MODE === 'supabase'
export const IS_MOCK_AUTH_MODE = APP_AUTH_MODE === 'mock'
export const IS_SUPABASE_AUTH_MODE = APP_AUTH_MODE === 'supabase'
