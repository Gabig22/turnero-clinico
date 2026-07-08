import { useMemo, useState } from 'react'

import { cn } from '@/lib/utils/cn'

type TimeSlotPickerProps = {
  value?: string
  onChange: (value: string) => void
  timeOptions: string[]
  title?: string
  description?: string
  emptyMessage?: string
  isLoading?: boolean
  disabled?: boolean
}

function formatTimeDraft(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)

  if (digits.length <= 2) {
    return digits
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

export function TimeSlotPicker({
  value = '',
  onChange,
  timeOptions,
  title = 'Horarios disponibles',
  description,
  emptyMessage = 'No quedan horarios disponibles.',
  isLoading = false,
  disabled = false,
}: TimeSlotPickerProps) {
  const [isOpen, setOpen] = useState(false)
  const options = useMemo(
    () => Array.from(new Set(timeOptions)).sort((a, b) => a.localeCompare(b)),
    [timeOptions],
  )

  const updateValue = (nextValue: string) => {
    onChange(formatTimeDraft(nextValue))
  }

  const selectTime = (time: string) => {
    onChange(time)
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        className="form-input"
        disabled={disabled}
        inputMode="numeric"
        maxLength={5}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120)
        }}
        onChange={(event) => updateValue(event.target.value)}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        placeholder="HH:mm"
        value={value}
      />

      {isOpen && !disabled ? (
        <div className="absolute left-0 right-0 top-full z-[70] mt-2 overflow-hidden rounded-lg border border-border bg-card shadow-clinical">
          <div className="border-b border-border px-3 py-2">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>

          {isLoading ? (
            <div className="px-3 py-4 text-sm text-muted-foreground">Cargando horarios...</div>
          ) : options.length ? (
            <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto p-2 sm:grid-cols-4">
              {options.map((time) => (
                <button
                  className={cn(
                    'rounded-md border px-2 py-2 text-sm font-semibold transition',
                    time === value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:border-primary hover:bg-accent',
                  )}
                  key={time}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectTime(time)}
                  type="button"
                >
                  {time}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3 py-4 text-sm text-muted-foreground">{emptyMessage}</div>
          )}
        </div>
      ) : null}
    </div>
  )
}
