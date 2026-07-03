export function formatConsultorioCompact(consultorio?: string | null) {
  const value = (consultorio ?? '').trim()
  const compactValue = value.replace(/^consultorio\s*/i, '').trim()

  if (!compactValue || compactValue === '-') {
    return compactValue || '-'
  }

  const upperValue = compactValue.toLocaleUpperCase('es-AR')

  return upperValue.startsWith('C') ? upperValue : `C${compactValue}`
}
