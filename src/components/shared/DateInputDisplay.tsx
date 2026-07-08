import { useEffect, useId, useMemo, useState } from 'react'

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
  isDateDisabled?: (dateKey: string) => boolean
  disabledDateMessage?: string
}

type CalendarDay = {
  date: Date
  dateKey: string
  isCurrentMonth: boolean
}

const invalidDateMessage = 'Ingresá una fecha válida en formato DD/MM/AAAA'
const defaultDisabledDateMessage = 'La fecha seleccionada no está disponible.'
const weekdayLabels = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D']

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

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function dateFromKey(dateKey?: string) {
  if (!dateKey) {
    return null
  }

  const [year, month, day] = dateKey.split('-').map(Number)

  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}

function firstDayOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function buildCalendarDays(monthDate: Date): CalendarDay[] {
  const firstDay = firstDayOfMonth(monthDate)
  const mondayOffset = (firstDay.getDay() + 6) % 7
  const calendarStart = new Date(firstDay)
  calendarStart.setDate(firstDay.getDate() - mondayOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart)
    date.setDate(calendarStart.getDate() + index)

    return {
      date,
      dateKey: toDateKey(date),
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
    }
  })
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
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
  isDateDisabled,
  disabledDateMessage = defaultDisabledDateMessage,
}: DateInputDisplayProps) {
  const inputId = useId()
  const [draft, setDraft] = useState(() => (value ? formatDateDisplay(value) : ''))
  const [internalError, setInternalError] = useState('')
  const [isCalendarOpen, setCalendarOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() =>
    firstDayOfMonth(dateFromKey(value) ?? new Date()),
  )
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth])

  useEffect(() => {
    setDraft(value ? formatDateDisplay(value) : '')

    if (value) {
      setInternalError('')
      const nextDate = dateFromKey(value)

      if (nextDate) {
        setVisibleMonth(firstDayOfMonth(nextDate))
      }
    }
  }, [value])

  const isUnavailable = (dateKey: string) => Boolean(isDateDisabled?.(dateKey))

  const updateValue = (nextDisplayValue: string) => {
    const formattedDisplayValue = formatDateDraft(nextDisplayValue)

    setDraft(formattedDisplayValue)
    setInternalError('')

    if (!formattedDisplayValue.trim()) {
      onChange('')
      return
    }

    const parsedDate = parseDisplayDate(formattedDisplayValue)

    if (!parsedDate) {
      return
    }

    if (isUnavailable(parsedDate)) {
      setInternalError(disabledDateMessage)
      onChange('')
      return
    }

    onChange(parsedDate)
  }

  const handleBlur = () => {
    setCalendarOpen(false)
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

    if (isUnavailable(parsedDate)) {
      setInternalError(disabledDateMessage)
      onChange('')
      return
    }

    setDraft(formatDateDisplay(parsedDate))
    setInternalError('')
    onChange(parsedDate)
  }

  const selectDate = (dateKey: string) => {
    if (isUnavailable(dateKey)) {
      return
    }

    setDraft(formatDateDisplay(dateKey))
    setInternalError('')
    onChange(dateKey)
    setCalendarOpen(false)
  }

  const visibleError = error ?? internalError
  const todayKey = toDateKey(new Date())
  const input = (
    <div className="relative">
      <input
        className={cn('form-input', className)}
        disabled={disabled}
        id={inputId}
        inputMode="numeric"
        maxLength={10}
        onBlur={handleBlur}
        onChange={(event) => updateValue(event.target.value)}
        onClick={() => setCalendarOpen(true)}
        onFocus={() => setCalendarOpen(true)}
        placeholder={placeholder}
        value={draft}
      />

      {isCalendarOpen && !disabled ? (
        <div className="absolute left-0 top-full z-[80] mt-2 w-72 rounded-lg border border-border bg-card p-3 shadow-clinical">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              className="rounded-md border border-border px-2 py-1 text-sm font-semibold text-foreground hover:bg-accent"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setVisibleMonth((month) => addMonths(month, -1))}
              type="button"
            >
              ‹
            </button>
            <p className="text-sm font-bold capitalize text-foreground">
              {formatMonthLabel(visibleMonth)}
            </p>
            <button
              className="rounded-md border border-border px-2 py-1 text-sm font-semibold text-foreground hover:bg-accent"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
              type="button"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdayLabels.map((weekday) => (
              <div className="py-1 text-xs font-bold text-muted-foreground" key={weekday}>
                {weekday}
              </div>
            ))}

            {calendarDays.map((day) => {
              const unavailable = isUnavailable(day.dateKey)
              const selected = value === day.dateKey
              const isToday = todayKey === day.dateKey

              return (
                <button
                  className={cn(
                    'h-8 rounded-md text-sm font-semibold transition',
                    selected
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent',
                    isToday && !selected ? 'ring-1 ring-primary/40' : '',
                    !day.isCurrentMonth ? 'text-muted-foreground/60' : '',
                    unavailable
                      ? 'cursor-not-allowed bg-muted/60 text-muted-foreground/45 hover:bg-muted/60'
                      : '',
                  )}
                  disabled={unavailable}
                  key={day.dateKey}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectDate(day.dateKey)}
                  title={unavailable ? disabledDateMessage : formatDateDisplay(day.dateKey)}
                  type="button"
                >
                  {day.date.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {visibleError ? (
        <span className="mt-1 block text-xs font-medium text-destructive">{visibleError}</span>
      ) : null}
    </div>
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
