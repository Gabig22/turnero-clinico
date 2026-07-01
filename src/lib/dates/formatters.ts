import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatFechaLarga(date = new Date()) {
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
}

export function formatFechaCorta(date = new Date()) {
  return format(date, 'dd/MM/yyyy', { locale: es })
}
