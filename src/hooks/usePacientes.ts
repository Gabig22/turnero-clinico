import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryKeys } from '@/hooks/queryKeys'
import { dataApi, type PacienteFilters, type PacienteInput } from '@/services/dataApi'

function invalidatePacienteQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.pacientes.all })
  void queryClient.invalidateQueries({ queryKey: queryKeys.turnos.all })
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
  void queryClient.invalidateQueries({ queryKey: queryKeys.turnero })
}

export function usePacientes(filters: PacienteFilters = {}) {
  return useQuery({
    queryKey: queryKeys.pacientes.list(filters),
    queryFn: () => dataApi.listPacientes(filters),
  })
}

export function useCrearPaciente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: PacienteInput) => dataApi.createPaciente(input),
    onSuccess: () => {
      toast.success('Paciente creado correctamente.')
      invalidatePacienteQueries(queryClient)
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
      dataApi.updatePaciente(id, input),
    onSuccess: () => {
      toast.success('Paciente actualizado correctamente.')
      invalidatePacienteQueries(queryClient)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el paciente.')
    },
  })
}

export function useTogglePaciente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => dataApi.togglePaciente(id),
    onSuccess: (paciente) => {
      toast.success(paciente.activo ? 'Paciente activado.' : 'Paciente desactivado.')
      invalidatePacienteQueries(queryClient)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo cambiar el estado del paciente.')
    },
  })
}
