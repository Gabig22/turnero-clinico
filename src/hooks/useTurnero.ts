import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

import { queryKeys } from '@/hooks/queryKeys'
import { mockApi } from '@/services/mock'

export function useTurnero() {
  return useQuery({
    queryKey: queryKeys.turnero,
    queryFn: async () => {
      const fechaHoy = format(new Date(), 'yyyy-MM-dd')
      const [turnosHoy, eventos] = await Promise.all([
        mockApi.listTurnos({ fecha: fechaHoy }),
        mockApi.listTurneroEvents(),
      ])

      return {
        fechaHoy,
        turnosHoy,
        eventos,
        enAtencion: turnosHoy.filter((turno) => turno.estado === 'en_atencion'),
      }
    },
    refetchInterval: 10_000,
  })
}
