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
  Typography,
} from '@mui/material'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import DeleteIcon from '@mui/icons-material/Delete'
import type { CameraControls } from '@react-three/drei'
import { useFlatsStore, useFlatsUiStore, type Flat } from '../flats/flatsStore.ts'
import { prepareImage, saveImage } from '../flats/imageStore.ts'
import { placementFacingCamera } from '../flats/placement.ts'
import { formatLength } from '../measure/units.ts'
import { useSettingsStore } from '../settingsStore.ts'

// New flats start at a standard 8' height; width follows the image's aspect ratio
const DEFAULT_HEIGHT = 2.4384

function SelectedFlatDetails({ flat }: { flat: Flat }) {
  const units = useSettingsStore((s) => s.units)
  const mode = useFlatsUiStore((s) => s.mode)
  const setMode = useFlatsUiStore((s) => s.setMode)
  const dragScale = useFlatsUiStore((s) => s.dragScale)
  const height = flat.height * dragScale

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack spacing={1}>
        <Typography variant="subtitle2" noWrap>
          {flat.name}
        </Typography>
        <Typography variant="body2">
          {formatLength(height * flat.aspect, units)} W × {formatLength(height, units)} H
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          fullWidth
          value={mode}
          onChange={(_, value) => value && setMode(value)}
        >
          <ToggleButton value="translate">Move</ToggleButton>
          <ToggleButton value="rotate">Rotate</ToggleButton>
          <ToggleButton value="scale">Scale</ToggleButton>
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
        const { blob, width, height } = await prepareImage(file)
        const imageId = crypto.randomUUID()
        await saveImage(imageId, blob)
        const id = crypto.randomUUID()
        addFlat({
          id,
          name: file.name.replace(/\.[^.]+$/, ''),
          imageId,
          aspect: width / height,
          height: DEFAULT_HEIGHT,
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
