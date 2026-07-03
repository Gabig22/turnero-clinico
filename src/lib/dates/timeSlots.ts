export function parseTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null
  }

  return hours * 60 + minutes
}

export function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`
}

export function generateTimeOptions(
  horarioInicio: string,
  horarioFin: string,
  slotDuracion: number,
  fallback = '09:00',
) {
  const start = parseTimeToMinutes(horarioInicio)
  const end = parseTimeToMinutes(horarioFin)

  if (start === null || end === null || start >= end) {
    return [fallback]
  }

  const options: string[] = []

  for (let current = start; current < end; current += slotDuracion) {
    options.push(formatMinutes(current))
  }

  return options
}
