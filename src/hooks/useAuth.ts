import { useContext } from 'react'

import { AuthContext, type AuthProfile, type AuthRole } from '@/contexts/authContext'

export type { AuthProfile, AuthRole }

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.')
  }

  return context
}
