import { useEffect } from 'react'
import {
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useMeasureStore } from '../measure/measureStore.ts'
import { distance, formatLength } from '../measure/units.ts'

export function MeasureSection() {
  const {
    measurements,
    selectedId,
    units,
    placing,
    pendingStart,
    startMeasuring,
    cancelMeasuring,
    select,
    remove,
    toggleVisible,
    setUnits,
  } = useMeasureStore()

  useEffect(() => {
    if (!placing) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelMeasuring()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [placing, cancelMeasuring])

  return (
    <Stack spacing={1}>
      <ToggleButtonGroup
        size="small"
        exclusive
        fullWidth
        value={units}
        onChange={(_, value) => value && setUnits(value)}
      >
        <ToggleButton value="imperial">ft / in</ToggleButton>
        <ToggleButton value="metric">m</ToggleButton>
      </ToggleButtonGroup>
      {placing ? (
        <>
          <Button variant="contained" color="secondary" onClick={cancelMeasuring}>
            Cancel
          </Button>
          <Typography variant="body2" color="text.secondary">
            {pendingStart ? 'Click the end point.' : 'Click the start point.'} Esc to cancel.
          </Typography>
        </>
      ) : (
        <Button variant="contained" onClick={startMeasuring}>
          New measurement
        </Button>
      )}
      {measurements.length > 0 && (
        <List dense disablePadding>
          {measurements.map((m) => (
            <ListItem
              key={m.id}
              disablePadding
              secondaryAction={
                <>
                  <IconButton
                    size="small"
                    aria-label={m.visible ? 'Hide' : 'Show'}
                    onClick={() => toggleVisible(m.id)}
                  >
                    {m.visible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                  </IconButton>
                  <IconButton size="small" edge="end" aria-label="Delete" onClick={() => remove(m.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </>
              }
            >
              <ListItemButton
                selected={m.id === selectedId}
                onClick={() => select(m.id === selectedId ? null : m.id)}
                sx={{ pr: 10 }}
              >
                <ListItemText
                  primary={m.name}
                  secondary={formatLength(distance(m.start, m.end), units)}
                  sx={{ opacity: m.visible ? 1 : 0.5 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Stack>
  )
}
