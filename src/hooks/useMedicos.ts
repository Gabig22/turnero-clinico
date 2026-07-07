import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryKeys } from '@/hooks/queryKeys'
import { dataApi, type MedicoFilters, type MedicoInput } from '@/services/dataApi'

function invalidateMedicoQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.medicos.all })
  void queryClient.invalidateQueries({ queryKey: queryKeys.turnos.all })
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
  void queryClient.invalidateQueries({ queryKey: queryKeys.turnero })
}

export function useMedicos(filters: MedicoFilters = {}) {
  return useQuery({
    queryKey: [...queryKeys.medicos.all, filters],
    queryFn: () => dataApi.listMedicos(filters),
  })
}

export function useMedico(id: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: queryKeys.medicos.detail(id),
    queryFn: () => dataApi.getMedicoById(id),
  })
}

export function useCrearMedico() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: MedicoInput) => dataApi.createMedico(input),
    onSuccess: () => {
      toast.success('Médico creado correctamente.')
      invalidateMedicoQueries(queryClient)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el médico.')
    },
  })
}

export function useActualizarMedico() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MedicoInput> }) =>
      dataApi.updateMedico(id, input),
    onSuccess: () => {
      toast.success('Médico actualizado correctamente.')
      invalidateMedicoQueries(queryClient)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el médico.')
    },
  })
}

export function useToggleMedico() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => dataApi.toggleMedico(id),
    onSuccess: (medico) => {
      toast.success(medico.activo ? 'Médico activado.' : 'Médico desactivado.')
      invalidateMedicoQueries(queryClient)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo cambiar el estado del médico.')
    },
  })
}
