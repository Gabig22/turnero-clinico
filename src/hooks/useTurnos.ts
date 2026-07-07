import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { queryKeys } from '@/hooks/queryKeys'
import {
  dataApi,
  type PosponerTurnoInput,
  type ReprogramarTurnoInput,
  type TurnoConflictInput,
  type TurnoFilters,
  type TurnoInput,
} from '@/services/dataApi'
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
    queryFn: () => dataApi.listTurnos(filters),
  })
}

export function useTurnosMedico(medicoId: string, fecha: string) {
  const filters = {
    medico_id: medicoId,
    fecha,
  }

  return useQuery({
    enabled: Boolean(medicoId && fecha),
    queryKey: queryKeys.turnos.list(filters),
    queryFn: () => dataApi.listTurnos(filters),
    initialData: [],
  })
}

export function useTurnosDeMedico(medicoId: string) {
  const filters = {
    medico_id: medicoId,
  }

  return useQuery({
    enabled: Boolean(medicoId),
    queryKey: queryKeys.turnos.list(filters),
    queryFn: () => dataApi.listTurnos(filters),
    initialData: [],
  })
}

export function useConfirmarConflictoTurno() {
  return useCallback(async (input: TurnoConflictInput) => {
    const conflict = await dataApi.findTurnoConflict(input)

    if (!conflict) {
      return true
    }

    return window.confirm(
      'Ya existe un turno para este médico en ese horario. ¿Querés guardarlo igualmente?',
    )
  }, [])
}

export function useCrearTurno() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: TurnoInput) => dataApi.createTurno(input),
    onSuccess: () => {
      toast.success('Turno creado correctamente.')
      invalidateClinicalQueries(queryClient)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el turno.')
    },
  })
}

export function useActualizarTurno() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TurnoInput> }) =>
      dataApi.updateTurno(id, input),
    onSuccess: () => {
      toast.success('Turno actualizado correctamente.')
      invalidateClinicalQueries(queryClient)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el turno.')
    },
  })
}

export function useCambiarEstadoTurno() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: TurnoEstado }) =>
      dataApi.cambiarEstadoTurno(id, estado),
    onSuccess: (turno) => {
      if (turno.estado === 'en_atencion') {
        toast.success('Paciente llamado correctamente.')
      } else if (turno.estado === 'finalizado') {
        toast.success('Turno finalizado.')
      } else if (turno.estado === 'ausente') {
        toast.success('Turno marcado como ausente.')
      } else if (turno.estado === 'reprogramado') {
        toast.success('Turno marcado como reprogramado.')
      } else {
        toast.success('Estado del turno actualizado.')
      }

      invalidateClinicalQueries(queryClient)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el turno.')
    },
  })
}

export function useCancelarTurno() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => dataApi.cancelarTurno(id),
    onSuccess: () => {
      toast.success('Turno cancelado.')
      invalidateClinicalQueries(queryClient)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo cancelar el turno.')
    },
  })
}

export function useMarcarAusenteTurno() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => dataApi.marcarAusenteTurno(id),
    onSuccess: () => {
      toast.success('Turno marcado como ausente.')
      invalidateClinicalQueries(queryClient)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo marcar el turno como ausente.')
    },
  })
}

export function useReprogramarTurno() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReprogramarTurnoInput }) =>
      dataApi.reprogramarTurno(id, input),
    onSuccess: () => {
      toast.success('Turno reprogramado correctamente.')
      invalidateClinicalQueries(queryClient)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo reprogramar el turno.')
    },
  })
}

export function usePosponerTurno() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PosponerTurnoInput }) =>
      dataApi.posponerTurno(id, input),
    onSuccess: () => {
      toast.success('Turno pospuesto correctamente.')
      invalidateClinicalQueries(queryClient)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo posponer el turno.')
    },
  })
}

export function useSiguienteTurno() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (medicoId: string) => dataApi.siguienteTurno(medicoId),
    onSuccess: ({ turnoLlamado }) => {
      if (turnoLlamado) {
        toast.success('Paciente llamado correctamente.')
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

export function useRellamarTurno() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (turnoId: string) => dataApi.rellamarTurno(turnoId),
    onSuccess: () => {
      toast.success('Paciente rellamado.')
      invalidateClinicalQueries(queryClient)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo rellamar al paciente.')
    },
  })
}
