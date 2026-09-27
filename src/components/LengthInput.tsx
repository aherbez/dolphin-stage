import { useRef, useState } from 'react'
import { InputAdornment, Stack, TextField } from '@mui/material'
import type { Units } from '../settingsStore.ts'

const METERS_PER_INCH = 0.0254
// Smallest length the inputs will accept, in meters
const MIN_LENGTH = 0.01

function parseNumber(text: string) {
  const trimmed = text.trim().replace(',', '.')
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isFinite(n) && n >= 0 ? n : null
}

const formatNumber = (value: number, decimals: number) => String(Number(value.toFixed(decimals)))

/** Splits meters into whole feet and inches (to 1/100"). */
function toFeetInches(meters: number) {
  const totalInches = Math.round((meters / METERS_PER_INCH) * 100) / 100
  const feet = Math.floor(totalInches / 12)
  return { feet, inches: Math.round((totalInches - feet * 12) * 100) / 100 }
}

interface NumberFieldProps {
  value: number
  decimals: number
  unit: string
  label: string
  onCommit: (value: number) => void
  onFocus?: () => void
}

/**
 * A numeric text field that keeps the user's raw text while focused (so typing isn't
 * reformatted mid-edit) and commits each valid value as it's typed.
 */
function NumberField({ value, decimals, unit, label, onCommit, onFocus }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <TextField
      size="small"
      value={draft ?? formatNumber(value, decimals)}
      onFocus={onFocus}
      onChange={(e) => {
        setDraft(e.target.value)
        const n = parseNumber(e.target.value)
        if (n !== null) onCommit(n)
      }}
      onBlur={() => setDraft(null)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
      sx={{ flex: 1, minWidth: 0 }}
      slotProps={{
        input: { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> },
        htmlInput: { inputMode: 'decimal', 'aria-label': label },
      }}
    />
  )
}

interface LengthInputProps {
  /** Length in meters */
  value: number
  units: Units
  /** Accessible name, e.g. "Width" */
  label: string
  onChange: (meters: number) => void
}

/** Feet + inches side by side for imperial; a single centimeters field for metric. */
export function LengthInput({ value, units, label, onChange }: LengthInputProps) {
  // While editing one of feet/inches, the other part stays as it was when editing began.
  // Otherwise typing e.g. 14" would roll over into the feet mid-edit and skew later keystrokes.
  const baseRef = useRef(toFeetInches(value))
  const commit = (meters: number) => {
    if (meters >= MIN_LENGTH) onChange(meters)
  }

  if (units === 'metric') {
    return (
      <NumberField
        value={value * 100}
        decimals={1}
        unit="cm"
        label={`${label} in centimeters`}
        onCommit={(cm) => commit(cm / 100)}
      />
    )
  }

  const { feet, inches } = toFeetInches(value)
  const captureBase = () => {
    baseRef.current = toFeetInches(value)
  }
  return (
    <Stack direction="row" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
      <NumberField
        value={feet}
        decimals={2}
        unit="ft"
        label={`${label} feet`}
        onFocus={captureBase}
        onCommit={(ft) => commit((ft * 12 + baseRef.current.inches) * METERS_PER_INCH)}
      />
      <NumberField
        value={inches}
        decimals={2}
        unit="in"
        label={`${label} inches`}
        onFocus={captureBase}
        onCommit={(inch) => commit((baseRef.current.feet * 12 + inch) * METERS_PER_INCH)}
      />
    </Stack>
  )
}
