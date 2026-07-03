import { format } from 'date-fns'

import type { Turno, TurnoEstado } from '@/types'

export const turnoEstadoOptions: Array<{ value: TurnoEstado; label: string }> = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_atencion', label: 'En atención' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'pospuesto', label: 'Pospuesto' },
  { value: 'ausente', label: 'Ausente' },
  { value: 'reprogramado', label: 'Reprogramado' },
]

export const openExpiredEstados: TurnoEstado[] = ['pendiente', 'en_atencion', 'pospuesto']

export function todayKey() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function isTurnoVencidoPendienteDeCierre(turno: Pick<Turno, 'fecha' | 'estado'>) {
  return turno.fecha < todayKey() && openExpiredEstados.includes(turno.estado)
}
