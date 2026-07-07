import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { IS_MOCK_AUTH_MODE, IS_SUPABASE_AUTH_MODE } from '@/config/dataMode'
import {
  AuthContext,
  mockAuthValue,
  type AuthContextValue,
  type AuthProfile,
  type AuthRole,
} from '@/contexts/authContext'
import { getSupabaseClient, hasSupabaseConfig } from '@/services/supabase/client'

type AuthProviderProps = {
  children: ReactNode
}

function isAuthRole(value: unknown): value is AuthRole {
  return value === 'admin_general' || value === 'doctor' || value === 'secretaria_medico'
}

function mapProfileRow(row: unknown): AuthProfile | null {
  if (!row || typeof row !== 'object') {
    return null
  }

  const record = row as Record<string, unknown>
  const id = typeof record.id === 'string' ? record.id : ''
  const role = isAuthRole(record.role) ? record.role : null

  if (!id || !role) {
    return null
  }

  return {
    id,
    email: typeof record.email === 'string' ? record.email : null,
    nombre: typeof record.nombre === 'string' ? record.nombre : '',
    role,
    activo: typeof record.activo === 'boolean' ? record.activo : true,
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [medicoAccessIds, setMedicoAccessIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(IS_SUPABASE_AUTH_MODE)
  const [error, setError] = useState<string | null>(null)

  const loadMedicoAccess = useCallback(async (nextProfile: AuthProfile | null) => {
    if (!nextProfile || nextProfile.role === 'admin_general') {
      setMedicoAccessIds([])
      return
    }

    try {
      const supabase = getSupabaseClient()
      const { data, error: accessError } = await supabase
        .from('user_medico_access')
        .select('medico_id')
        .eq('user_id', nextProfile.id)

      if (accessError) {
        setMedicoAccessIds([])
        setError(
          'Perfil cargado, pero no pudimos leer los médicos asignados. Revisá user_medico_access y sus policies.',
        )
        return
      }

      setMedicoAccessIds(
        (data ?? [])
          .map((item) => item.medico_id)
          .filter((medicoId): medicoId is string => typeof medicoId === 'string'),
      )
    } catch (accessError) {
      setMedicoAccessIds([])
      setError(
        accessError instanceof Error
          ? accessError.message
          : 'No pudimos cargar los médicos asignados.',
      )
    }
  }, [])

  const loadProfile = useCallback(async (nextSession: Session | null) => {
    if (!IS_SUPABASE_AUTH_MODE || !nextSession?.user) {
      setProfile(null)
      setMedicoAccessIds([])
      return
    }

    try {
      setError(null)
      const supabase = getSupabaseClient()
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('id,email,nombre,role,activo')
        .eq('id', nextSession.user.id)
        .maybeSingle()

      if (profileError) {
        setProfile(null)
        setError(
          'Sesión iniciada, pero no pudimos leer el perfil. Revisá la tabla profiles y sus policies.',
        )
        return
      }

      const nextProfile = mapProfileRow(data)

      if (!nextProfile) {
        setProfile(null)
        setMedicoAccessIds([])
        setError(
          'Sesión iniciada, pero no encontramos un perfil activo para este usuario. Creá la fila correspondiente en profiles.',
        )
        return
      }

      setProfile(nextProfile)
      await loadMedicoAccess(nextProfile)
    } catch (profileError) {
      setProfile(null)
      setMedicoAccessIds([])
      setError(
        profileError instanceof Error
          ? profileError.message
          : 'No pudimos cargar el perfil del usuario.',
      )
    }
  }, [loadMedicoAccess])

  useEffect(() => {
    if (IS_MOCK_AUTH_MODE) {
      return undefined
    }

    if (!hasSupabaseConfig()) {
      setIsLoading(false)
      setError(
        'Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. Configuralas o usá VITE_APP_DATA_MODE=mock.',
      )
      return undefined
    }

    const supabase = getSupabaseClient()
    let isMounted = true

    supabase.auth
      .getSession()
      .then(async ({ data, error: sessionError }) => {
        if (!isMounted) {
          return
        }

        if (sessionError) {
          setError(sessionError.message)
        }

        const currentSession = data.session
        setSession(currentSession)
        await loadProfile(currentSession)
      })
      .catch((sessionError: unknown) => {
        if (!isMounted) {
          return
        }

        setError(
          sessionError instanceof Error ? sessionError.message : 'No pudimos leer la sesión.',
        )
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      void loadProfile(nextSession)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    if (IS_MOCK_AUTH_MODE) {
      return
    }

    const supabase = getSupabaseClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      throw signInError
    }

    setError(null)
    setSession(data.session)
    await loadProfile(data.session)
  }, [loadProfile])

  const signOut = useCallback(async () => {
    if (IS_MOCK_AUTH_MODE) {
      return
    }

    const supabase = getSupabaseClient()
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      throw signOutError
    }

    setError(null)
    setSession(null)
    setProfile(null)
    setMedicoAccessIds([])
  }, [])

  const refreshProfile = useCallback(async () => {
    await loadProfile(session)
  }, [loadProfile, session])

  const value = useMemo<AuthContextValue>(() => {
    if (IS_MOCK_AUTH_MODE) {
      return mockAuthValue
    }

    return {
      error,
      isAuthenticated: Boolean(session),
      isLoading,
      isMockMode: false,
      medicoAccessIds,
      profile,
      refreshProfile,
      session,
      signIn,
      signOut,
      user: session?.user ?? null,
    }
  }, [error, isLoading, medicoAccessIds, profile, refreshProfile, session, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
