export const queryKeys = {
  medicos: {
    all: ['medicos'] as const,
    detail: (id: string) => ['medicos', id] as const,
  },
  pacientes: {
    all: ['pacientes'] as const,
    list: (filters: unknown) => ['pacientes', filters] as const,
  },
  turnos: {
    all: ['turnos'] as const,
    list: (filters: unknown) => ['turnos', filters] as const,
  },
  dashboard: ['dashboard'] as const,
  turnero: ['turnero'] as const,
  turneroEvents: ['turnero-events'] as const,
}
