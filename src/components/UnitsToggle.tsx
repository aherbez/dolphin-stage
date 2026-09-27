import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useSettingsStore } from '../settingsStore.ts'

export function UnitsToggle() {
  const units = useSettingsStore((s) => s.units)
  const setUnits = useSettingsStore((s) => s.setUnits)
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={units}
      onChange={(_, value) => value && setUnits(value)}
      aria-label="Units"
    >
      <ToggleButton value="imperial">ft / in</ToggleButton>
      <ToggleButton value="metric">m</ToggleButton>
    </ToggleButtonGroup>
  )
}
