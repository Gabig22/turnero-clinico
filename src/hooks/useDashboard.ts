import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'

import { queryKeys } from '@/hooks/queryKeys'
import { mockApi } from '@/services/mock'

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const fechaHoy = format(new Date(), 'yyyy-MM-dd')
      const [medicos, turnosHoy] = await Promise.all([
        mockApi.listMedicos(),
        mockApi.listTurnos({ fecha: fechaHoy }),
      ])
      const pacientesUnicos = new Set(turnosHoy.map((turno) => turno.paciente_id))

      return {
        fechaHoy,
        medicosActivos: medicos.filter((medico) => medico.activo).length,
        pacientesConTurnoHoy: pacientesUnicos.size,
        turnosDelDia: turnosHoy.length,
        pendientes: turnosHoy.filter((turno) => turno.estado === 'pendiente').length,
        enAtencion: turnosHoy.filter((turno) => turno.estado === 'en_atencion').length,
        finalizados: turnosHoy.filter((turno) => turno.estado === 'finalizado').length,
        medicos: medicos.map((medico) => ({
          medico,
          turnos: turnosHoy.filter((turno) => turno.medico_id === medico.id),
        })),
      }
    },
  })
}

export function useResetDemoData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: mockApi.resetDemoData,
    onSuccess: () => {
      toast.success('Demo reiniciada correctamente.')
      void queryClient.invalidateQueries()
    },
    onError: () => {
      toast.error('No se pudieron reiniciar los datos demo.')
    },
  })
}
