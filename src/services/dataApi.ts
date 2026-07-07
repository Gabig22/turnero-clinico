import { APP_DATA_MODE } from '@/config/dataMode'
import { mockApi } from '@/services/mock/mockApi'
import { supabaseApi } from '@/services/supabase/supabaseApi'

export type DataApi = typeof mockApi

export const dataApi: DataApi = APP_DATA_MODE === 'supabase' ? supabaseApi : mockApi

export type {
  AppSettingsInput,
  MedicoFilters,
  MedicoInput,
  PacienteFilters,
  PacienteInput,
  PosponerTurnoInput,
  ReprogramarTurnoInput,
  TurneroSettingsInput,
  TurnoConflictInput,
  TurnoFilters,
  TurnoInput,
} from '@/services/mock/mockApi'
