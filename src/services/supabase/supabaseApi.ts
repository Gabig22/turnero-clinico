import type { mockApi } from '@/services/mock/mockApi'

type SupabaseApi = typeof mockApi

function throwNotImplemented(methodName: string): never {
  throw new Error(
    `Supabase API todavía no está implementada (${methodName}). Usá VITE_APP_DATA_MODE=mock hasta completar las fases S2-S5.`,
  )
}

export const supabaseApi = new Proxy(
  {},
  {
    get: (_target, property) => {
      const methodName = typeof property === 'string' ? property : String(property)

      return () => throwNotImplemented(methodName)
    },
  },
) as SupabaseApi
