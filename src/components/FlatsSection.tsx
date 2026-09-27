import { useState, type RefObject } from 'react'
import {
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CollectionsIcon from '@mui/icons-material/Collections'
import DeleteIcon from '@mui/icons-material/Delete'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import type { CameraControls } from '@react-three/drei'
import { selectFlats, useFlatsStore, useFlatsUiStore, type Flat } from '../flats/flatsStore.ts'
import type { LibraryImage } from '../images/libraryStore.ts'
import { placementFacingCamera } from '../flats/placement.ts'
import { useSettingsStore } from '../settingsStore.ts'
import { useHotkeys } from '../hooks/useHotkeys.ts'
import { LengthInput } from './LengthInput.tsx'
import { ImageLibraryDialog } from './ImageLibraryDialog.tsx'

// New flats start at a standard 8' height; width follows the image's aspect ratio
const DEFAULT_HEIGHT = 2.4384

const MODES = [
  { value: 'translate', label: 'Move', key: 'm' },
  { value: 'rotate', label: 'Rotate', key: 'r' },
  { value: 'scale', label: 'Scale', key: 's' },
] as const

function SelectedFlatDetails({ flat }: { flat: Flat }) {
  const units = useSettingsStore((s) => s.units)
  const mode = useFlatsUiStore((s) => s.mode)
  const setMode = useFlatsUiStore((s) => s.setMode)
  const dragScale = useFlatsUiStore((s) => s.dragScale)
  const updateFlat = useFlatsStore((s) => s.updateFlat)
  const resizeFlat = useFlatsStore((s) => s.resizeFlat)

  useHotkeys(Object.fromEntries(MODES.map((m) => [m.key, () => setMode(m.value)])))

  // Include any scale drag in progress so the fields track the gizmo live
  const width = flat.width * dragScale[0]
  const height = flat.height * dragScale[1]
  const locked = flat.aspectLocked

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack spacing={1}>
        <Typography variant="subtitle2" noWrap>
          {flat.name}
        </Typography>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Typography variant="overline">Dimensions</Typography>
          <Tooltip title={locked ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}>
            <IconButton
              size="small"
              aria-label="Lock aspect ratio"
              aria-pressed={locked}
              color={locked ? 'primary' : 'default'}
              onClick={() => updateFlat(flat.id, { aspectLocked: !locked })}
            >
              {locked ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
        {(['width', 'height'] as const).map((dim) => (
          <Stack key={dim} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="body2" sx={{ width: 48, flexShrink: 0, textTransform: 'capitalize' }}>
              {dim}
            </Typography>
            <LengthInput
              value={dim === 'width' ? width : height}
              units={units}
              label={dim === 'width' ? 'Width' : 'Height'}
              onChange={(meters) => resizeFlat(flat.id, { [dim]: meters })}
            />
          </Stack>
        ))}
        <ToggleButtonGroup
          size="small"
          exclusive
          fullWidth
          value={mode}
          onChange={(_, value) => value && setMode(value)}
        >
          {MODES.map((m) => (
            <Tooltip key={m.value} title={`${m.label} (${m.key.toUpperCase()})`}>
              <ToggleButton value={m.value}>{m.label}</ToggleButton>
            </Tooltip>
          ))}
        </ToggleButtonGroup>
      </Stack>
    </Paper>
  )
}

export function FlatsSection({ controlsRef }: { controlsRef: RefObject<CameraControls | null> }) {
  const flats = useFlatsStore(selectFlats)
  const addFlat = useFlatsStore((s) => s.addFlat)
  const removeFlat = useFlatsStore((s) => s.removeFlat)
  const selectedId = useFlatsUiStore((s) => s.selectedId)
  const select = useFlatsUiStore((s) => s.select)
  const [library, setLibrary] = useState<'closed' | 'pick' | 'manage'>('closed')

  const selected = flats.find((f) => f.id === selectedId)

  const addToStage = (image: LibraryImage) => {
    const controls = controlsRef.current
    if (!controls) return
    const id = crypto.randomUUID()
    addFlat({
      id,
      name: image.name,
      imageId: image.id,
      width: (DEFAULT_HEIGHT * image.width) / image.height,
      height: DEFAULT_HEIGHT,
      aspectLocked: true,
      ...placementFacingCamera(controls),
    })
    select(id)
    setLibrary('closed')
  }

  return (
    <Stack spacing={1}>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setLibrary('pick')}>
        Add flat
      </Button>
      <Button size="small" startIcon={<CollectionsIcon />} onClick={() => setLibrary('manage')}>
        Manage images
      </Button>
      <ImageLibraryDialog
        open={library !== 'closed'}
        onClose={() => setLibrary('closed')}
        onAddToStage={library === 'pick' ? addToStage : undefined}
      />
      {selected && <SelectedFlatDetails flat={selected} />}
      {flats.length > 0 && (
        <List dense disablePadding>
          {flats.map((f) => (
            <ListItem
              key={f.id}
              disablePadding
              secondaryAction={
                <IconButton size="small" edge="end" aria-label="Delete" onClick={() => removeFlat(f.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemButton
                selected={f.id === selectedId}
                onClick={() => select(f.id === selectedId ? null : f.id)}
                sx={{ pr: 6 }}
              >
                <ListItemText primary={f.name} slotProps={{ primary: { noWrap: true } }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Stack>
  )
}
