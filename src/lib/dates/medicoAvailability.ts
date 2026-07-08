import type { Medico } from '@/types'

export function getWeekdayCode(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)

  if (!year || !month || !day) {
    return ''
  }

  const weekday = new Date(year, month - 1, day).getDay()
  return ['D', 'L', 'Ma', 'Mi', 'J', 'V', 'S'][weekday] ?? ''
}

export function medicoDoesNotWorkOnDate(medico: Medico | undefined, dateKey: string) {
  const diasDisponibles = medico?.dias_disponibles ?? []

  if (!medico || !diasDisponibles.length) {
    return false
  }

  return !diasDisponibles.includes(getWeekdayCode(dateKey))
}
