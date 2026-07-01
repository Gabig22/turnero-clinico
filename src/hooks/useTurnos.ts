import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryKeys } from '@/hooks/queryKeys'
import { mockApi, type TurnoFilters, type TurnoInput } from '@/services/mock/mockApi'
import type { TurnoEstado } from '@/types'

function invalidateClinicalQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.turnos.all })
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
  void queryClient.invalidateQueries({ queryKey: queryKeys.turnero })
  void queryClient.invalidateQueries({ queryKey: queryKeys.turneroEvents })
}

export function useTurnos(filters: TurnoFilters = {}) {
  return useQuery({
    queryKey: queryKeys.turnos.list(filters),
    queryFn: () => mockApi.listTurnos(filters),
  })
}

export function useCrearTurno() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: TurnoInput) => mockApi.createTurno(input),
    onSuccess: () => {
      toast.success('Turno creado correctamente.')
      invalidateClinicalQueries(queryClient)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el turno.')
    },
  })
}

export function useCambiarEstadoTurno() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: TurnoEstado }) =>
      mockApi.cambiarEstadoTurno(id, estado),
    onSuccess: () => {
      toast.success('Estado del turno actualizado.')
      invalidateClinicalQueries(queryClient)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el turno.')
    },
  })
}

export function useSiguienteTurno() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (medicoId: string) => mockApi.siguienteTurno(medicoId),
    onSuccess: ({ turnoFinalizado, turnoLlamado }) => {
      if (turnoLlamado?.paciente) {
        toast.success(
          `Llamado: ${turnoLlamado.paciente.apellido}, ${turnoLlamado.paciente.nombre}.`,
        )
      } else if (turnoFinalizado) {
        toast.info('Turno finalizado. No quedan turnos pendientes para este médico.')
      } else {
        toast.info('No hay turnos pendientes para este médico.')
      }

      invalidateClinicalQueries(queryClient)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo llamar al siguiente turno.')
    },
  })
}
