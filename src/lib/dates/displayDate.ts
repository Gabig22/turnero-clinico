const displayDatePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/

export function formatDateDisplay(dateString: string) {
  const [year, month, day] = dateString.split('-')

  if (!year || !month || !day) {
    return dateString
  }

  return `${day}/${month}/${year}`
}

export function parseDisplayDate(value: string) {
  const match = value.trim().match(displayDatePattern)

  if (!match) {
    return null
  }

  const [, day, month, year] = match
  const isoDate = `${year}-${month}-${day}`

  return isValidDateKey(isoDate) ? isoDate : null
}

export function isValidDisplayDate(value: string) {
  return parseDisplayDate(value) !== null
}

export function isValidDateKey(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) {
    return false
  }

  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))

  return (
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)
  )
}
