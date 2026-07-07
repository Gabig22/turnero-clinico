import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryKeys } from '@/hooks/queryKeys'
import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_TURNERO_SETTINGS,
} from '@/lib/storage/settingsStorage'
import {
  dataApi,
  type AppSettingsInput,
  type TurneroSettingsInput,
} from '@/services/dataApi'

export function useAppSettings() {
  return useQuery({
    queryKey: queryKeys.settings.app,
    queryFn: () => dataApi.getAppSettings(),
    placeholderData: DEFAULT_APP_SETTINGS,
  })
}

export function useUpdateAppSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AppSettingsInput) => dataApi.updateAppSettings(input),
    onSuccess: () => {
      toast.success('Configuración guardada correctamente.')
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.app })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la configuración.')
    },
  })
}

export function useResetAppSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => dataApi.resetAppSettings(),
    onSuccess: () => {
      toast.success('Configuración restaurada correctamente.')
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.app })
    },
    onError: () => {
      toast.error('No se pudo restaurar la configuración.')
    },
  })
}

export function useTurneroSettings() {
  return useQuery({
    queryKey: queryKeys.settings.turnero,
    queryFn: () => dataApi.getTurneroSettings(),
    placeholderData: DEFAULT_TURNERO_SETTINGS,
  })
}

export function useUpdateTurneroSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: TurneroSettingsInput) => dataApi.updateTurneroSettings(input),
    onSuccess: () => {
      toast.success('Configuración del turnero guardada.')
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.turnero })
      void queryClient.invalidateQueries({ queryKey: queryKeys.turnero })
    },
    onError: () => {
      toast.error('No se pudo guardar la configuración del turnero.')
    },
  })
}

export function useResetTurneroSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => dataApi.resetTurneroSettings(),
    onSuccess: () => {
      toast.success('Turnero restaurado correctamente.')
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.turnero })
      void queryClient.invalidateQueries({ queryKey: queryKeys.turnero })
    },
    onError: () => {
      toast.error('No se pudo restaurar la configuración del turnero.')
    },
  })
}
