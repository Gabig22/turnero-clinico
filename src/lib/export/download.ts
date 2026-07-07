function downloadBlob(filename: string, blob: Blob) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

function escapeCsvValue(value: unknown) {
  const text = String(value ?? '')
  const escaped = text.replace(/"/g, '""')

  return `"${escaped}"`
}

export function exportToCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) {
    return ''
  }

  const headers = Object.keys(rows[0])
  const lines = [
    headers.map(escapeCsvValue).join(';'),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(';')),
  ]

  return `\uFEFF${lines.join('\r\n')}`
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8',
  })

  downloadBlob(filename, blob)
}

export function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  const blob = new Blob([exportToCsv(rows)], {
    type: 'text/csv;charset=utf-8',
  })

  downloadBlob(filename, blob)
}
