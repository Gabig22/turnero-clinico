import { useEffect, useId, useRef, useState } from 'react'

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

function formatDateDraft(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

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
  const calendarInputRef = useRef<HTMLInputElement | null>(null)
  const [draft, setDraft] = useState(() => (value ? formatDateDisplay(value) : ''))
  const [internalError, setInternalError] = useState('')

  useEffect(() => {
    setDraft(value ? formatDateDisplay(value) : '')

    if (value) {
      setInternalError('')
    }
  }, [value])

  const updateValue = (nextDisplayValue: string) => {
    const formattedDisplayValue = formatDateDraft(nextDisplayValue)

    setDraft(formattedDisplayValue)
    setInternalError('')

    if (!formattedDisplayValue.trim()) {
      onChange('')
      return
    }

    const parsedDate = parseDisplayDate(formattedDisplayValue)

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

  const openNativeCalendar = () => {
    if (disabled) {
      return
    }

    const input = calendarInputRef.current

    if (!input) {
      return
    }

    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker()
      } catch {
        input.focus()
      }
      return
    }

    input.focus()
  }

  const visibleError = error ?? internalError
  const input = (
    <>
      <input
        className={cn('form-input', className)}
        disabled={disabled}
        id={inputId}
        inputMode="numeric"
        maxLength={10}
        onBlur={handleBlur}
        onClick={openNativeCalendar}
        onFocus={openNativeCalendar}
        onChange={(event) => updateValue(event.target.value)}
        placeholder={placeholder}
        value={draft}
      />
      <input
        aria-hidden="true"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value)
          setInternalError('')
        }}
        ref={calendarInputRef}
        tabIndex={-1}
        type="date"
        value={value}
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
