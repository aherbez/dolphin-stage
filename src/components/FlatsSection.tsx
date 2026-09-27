import { useRef, useState, type ChangeEvent, type RefObject } from 'react'
import {
  Alert,
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
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import DeleteIcon from '@mui/icons-material/Delete'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import type { CameraControls } from '@react-three/drei'
import { useFlatsStore, useFlatsUiStore, type Flat } from '../flats/flatsStore.ts'
import { prepareImage, saveImage } from '../flats/imageStore.ts'
import { placementFacingCamera } from '../flats/placement.ts'
import { useSettingsStore } from '../settingsStore.ts'
import { useHotkeys } from '../hooks/useHotkeys.ts'
import { LengthInput } from './LengthInput.tsx'

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
  const { flats, addFlat, removeFlat } = useFlatsStore()
  const selectedId = useFlatsUiStore((s) => s.selectedId)
  const select = useFlatsUiStore((s) => s.select)
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = flats.find((f) => f.id === selectedId)

  const onFilesChosen = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])]
    e.target.value = '' // allow choosing the same file again
    const controls = controlsRef.current
    if (!files.length || !controls) return

    setBusy(true)
    setError(null)
    for (const file of files) {
      try {
        const image = await prepareImage(file)
        const imageId = crypto.randomUUID()
        await saveImage(imageId, image.blob)
        const id = crypto.randomUUID()
        addFlat({
          id,
          name: file.name.replace(/\.[^.]+$/, ''),
          imageId,
          width: (DEFAULT_HEIGHT * image.width) / image.height,
          height: DEFAULT_HEIGHT,
          aspectLocked: true,
          ...placementFacingCamera(controls),
        })
        select(id)
      } catch (err) {
        console.error(err)
        setError(`Couldn't add "${file.name}". Is it an image?`)
      }
    }
    setBusy(false)
  }

  return (
    <Stack spacing={1}>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={onFilesChosen} />
      <Button
        variant="contained"
        startIcon={<AddPhotoAlternateIcon />}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? 'Adding…' : 'Add flat from image'}
      </Button>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
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
