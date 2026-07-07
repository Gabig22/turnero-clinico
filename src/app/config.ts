import type { UserRole } from '@/types'

export const APP_MODE = 'mock' as const
export const DEFAULT_DEMO_ROLE: UserRole = 'admin_general'
export const DEMO_ROLE_STORAGE_KEY = 'turnero_demo_role'

const VALID_ROLES: UserRole[] = [
  'admin_general',
  'supervisor',
  'doctor',
  'secretaria_medico',
  'public',
]

export function isUserRole(value: string | null): value is UserRole {
  return VALID_ROLES.includes(value as UserRole)
}

export function getDemoRole(): UserRole {
  if (typeof window === 'undefined') {
    return DEFAULT_DEMO_ROLE
  }

  const storedRole = window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY)
  return isUserRole(storedRole) ? storedRole : DEFAULT_DEMO_ROLE
}

export function setDemoRole(role: UserRole) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(DEMO_ROLE_STORAGE_KEY, role)
}
