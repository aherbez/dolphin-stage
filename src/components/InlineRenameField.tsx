import { useState } from 'react'
import { TextField } from '@mui/material'

interface InlineRenameFieldProps {
  initialName: string
  /** Accessible name for the input, e.g. "Scene name" */
  label: string
  /** Called with the trimmed new name (only if non-empty) */
  onRename: (name: string) => void
  /** Called when editing ends, whether committed or cancelled */
  onDone: () => void
}

/** A focused, pre-selected text field for renaming in place. Enter or blur saves; Escape cancels. */
export function InlineRenameField({ initialName, label, onRename, onDone }: InlineRenameFieldProps) {
  const [name, setName] = useState(initialName)

  const commit = () => {
    const trimmed = name.trim()
    if (trimmed) onRename(trimmed)
    onDone()
  }

  return (
    <TextField
      size="small"
      fullWidth
      autoFocus
      value={name}
      onChange={(e) => setName(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') onDone()
      }}
      slotProps={{ htmlInput: { 'aria-label': label } }}
      sx={{ my: 0.5 }}
    />
  )
}
