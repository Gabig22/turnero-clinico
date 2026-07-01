import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryKeys } from '@/hooks/queryKeys'
import { mockApi, type PacienteFilters, type PacienteInput } from '@/services/mock/mockApi'

export function usePacientes(filters: PacienteFilters = {}) {
  return useQuery({
    queryKey: queryKeys.pacientes.list(filters),
    queryFn: () => mockApi.listPacientes(filters),
  })
}

export function useCrearPaciente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: PacienteInput) => mockApi.createPaciente(input),
    onSuccess: () => {
      toast.success('Paciente creado correctamente.')
      void queryClient.invalidateQueries({ queryKey: queryKeys.pacientes.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el paciente.')
    },
  })
}

export function useActualizarPaciente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PacienteInput> }) =>
      mockApi.updatePaciente(id, input),
    onSuccess: () => {
      toast.success('Paciente actualizado correctamente.')
      void queryClient.invalidateQueries({ queryKey: queryKeys.pacientes.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.turnos.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      void queryClient.invalidateQueries({ queryKey: queryKeys.turnero })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el paciente.')
    },
  })
}
