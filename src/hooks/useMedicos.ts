import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/hooks/queryKeys'
import { mockApi } from '@/services/mock'

export function useMedicos() {
  return useQuery({
    queryKey: queryKeys.medicos.all,
    queryFn: mockApi.listMedicos,
  })
}

export function useMedico(id: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: queryKeys.medicos.detail(id),
    queryFn: () => mockApi.getMedicoById(id),
  })
}
