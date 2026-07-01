import { useCallback, useState } from 'react'

import { getDemoRole, setDemoRole } from '@/app/config'
import type { UserRole } from '@/types'

export function useDemoRole() {
  const [role, setRoleState] = useState<UserRole>(() => getDemoRole())

  const updateRole = useCallback((nextRole: UserRole) => {
    setDemoRole(nextRole)
    setRoleState(nextRole)
  }, [])

  return {
    role,
    setRole: updateRole,
    isDoctor: role === 'doctor',
  }
}
