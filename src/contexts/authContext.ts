import type { Session, User } from '@supabase/supabase-js'
import { createContext } from 'react'

export type AuthRole = 'admin_general' | 'doctor' | 'secretaria_medico'

export type AuthProfile = {
  id: string
  email: string | null
  nombre: string
  role: AuthRole
  activo: boolean
}

export type AuthContextValue = {
  error: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isMockMode: boolean
  medicoAccessIds: string[]
  profile: AuthProfile | null
  refreshProfile: () => Promise<void>
  session: Session | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  user: User | null
}

export const mockAuthValue: AuthContextValue = {
  error: null,
  isAuthenticated: true,
  isLoading: false,
  isMockMode: true,
  medicoAccessIds: [],
  profile: null,
  refreshProfile: async () => undefined,
  session: null,
  signIn: async () => undefined,
  signOut: async () => undefined,
  user: null,
}

export const AuthContext = createContext<AuthContextValue | null>(null)
