import { useEffect, useId, useState } from 'react'

import {
  formatDateDisplay,
  parseDisplayDate,
} from '@/lib/dates/displayDate'
import { cn } from '@/lib/utils/cn'

type DateInputDisplayProps = {
  value?: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  disabled?: boolean
  error?: string
  placeholder?: string
  className?: string
}

const invalidDateMessage = 'Ingresá una fecha válida en formato DD/MM/AAAA'

export function DateInputDisplay({
  value = '',
  onChange,
  label,
  required = false,
  disabled = false,
  error,
  placeholder = 'DD/MM/AAAA',
  className,
}: DateInputDisplayProps) {
  const inputId = useId()
  const [draft, setDraft] = useState(() => (value ? formatDateDisplay(value) : ''))
  const [internalError, setInternalError] = useState('')

  useEffect(() => {
    setDraft(value ? formatDateDisplay(value) : '')

    if (value) {
      setInternalError('')
    }
  }, [value])

  const updateValue = (nextDisplayValue: string) => {
    setDraft(nextDisplayValue)
    setInternalError('')

    if (!nextDisplayValue.trim()) {
      onChange('')
      return
    }

    const parsedDate = parseDisplayDate(nextDisplayValue)

    if (parsedDate) {
      onChange(parsedDate)
    }
  }

  const handleBlur = () => {
    const trimmedDraft = draft.trim()

    if (!trimmedDraft) {
      setInternalError(required ? invalidDateMessage : '')
      onChange('')
      return
    }

    const parsedDate = parseDisplayDate(trimmedDraft)

    if (!parsedDate) {
      setInternalError(invalidDateMessage)
      onChange('')
      return
    }

    setDraft(formatDateDisplay(parsedDate))
    setInternalError('')
    onChange(parsedDate)
  }

  const visibleError = error ?? internalError
  const input = (
    <>
      <input
        className={cn('form-input', className)}
        disabled={disabled}
        id={inputId}
        inputMode="numeric"
        onBlur={handleBlur}
        onChange={(event) => updateValue(event.target.value)}
        placeholder={placeholder}
        value={draft}
      />
      {visibleError ? (
        <span className="mt-1 block text-xs font-medium text-destructive">{visibleError}</span>
      ) : null}
    </>
  )

  if (!label) {
    return input
  }

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required ? ' *' : ''}
      </span>
      {input}
    </label>
  )
}
