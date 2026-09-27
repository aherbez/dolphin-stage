import { Suspense, use, useRef, useState, type ChangeEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import DeleteIcon from '@mui/icons-material/Delete'
import { useFlatsStore } from '../flats/flatsStore.ts'
import { loadPreviewImageData } from '../images/imageData.ts'
import { deleteLibraryImage, importImageFiles } from '../images/library.ts'
import { useLibraryStore, type LibraryImage } from '../images/libraryStore.ts'
import { ErrorBoundary } from '../scene/ErrorBoundary.tsx'
import { ImageCanvas } from './ImageCanvas.tsx'
import { KnockoutEditor } from './KnockoutEditor.tsx'

const THUMB_SIZE = 240

function Thumbnail({ image }: { image: LibraryImage }) {
  const source = use(loadPreviewImageData(image.id, THUMB_SIZE))
  return <ImageCanvas source={source} knockout={image.knockout} sx={{ maxHeight: '100%', m: 'auto' }} />
}

const tileFallback = (text: string) => (
  <Typography variant="caption" color="text.secondary" sx={{ m: 'auto' }}>
    {text}
  </Typography>
)

function ImageTile({ image, selected, onClick }: { image: LibraryImage; selected: boolean; onClick: () => void }) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        flexDirection: 'column',
        alignItems: 'stretch',
        borderRadius: 1,
        outline: 2,
        outlineColor: selected ? 'primary.main' : 'transparent',
        p: 0.5,
      }}
    >
      <Box sx={{ height: 96, display: 'flex' }}>
        <ErrorBoundary fallback={tileFallback('Missing')}>
          <Suspense fallback={<CircularProgress size={20} sx={{ m: 'auto' }} />}>
            <Thumbnail image={image} />
          </Suspense>
        </ErrorBoundary>
      </Box>
      <Typography variant="caption" noWrap sx={{ mt: 0.5 }}>
        {image.name}
      </Typography>
    </ButtonBase>
  )
}

interface ImageLibraryDialogProps {
  open: boolean
  onClose: () => void
  /** When given, the dialog is used to pick an image for a new flat */
  onAddToStage?: (image: LibraryImage) => void
}

export function ImageLibraryDialog({ open, onClose, onAddToStage }: ImageLibraryDialogProps) {
  const images = useLibraryStore((s) => s.images)
  const flats = useFlatsStore((s) => s.flats)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fall back to the first image if nothing (or a deleted image) is selected
  const selected = images.find((img) => img.id === selectedId) ?? images[0]
  const usedBy = selected ? flats.filter((f) => f.imageId === selected.id).length : 0

  const onFilesChosen = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])]
    e.target.value = '' // allow choosing the same file again
    if (!files.length) return
    setBusy(true)
    setError(null)
    const { added, failed } = await importImageFiles(files)
    setBusy(false)
    if (added.length) setSelectedId(added[added.length - 1].id)
    if (failed.length) setError(`Couldn't add ${failed.map((n) => `"${n}"`).join(', ')}. Is it an image?`)
  }

  const confirmDelete = async () => {
    if (!selected) return
    setConfirmingDelete(false)
    await deleteLibraryImage(selected.id)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{ paper: { sx: { height: '85vh' } } }}
    >
      <DialogTitle>{onAddToStage ? 'Add a flat' : 'Image library'}</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', p: 0, overflow: 'hidden' }}>
        <Stack spacing={1.5} sx={{ width: 260, flexShrink: 0, p: 2, overflowY: 'auto', borderRight: 1, borderColor: 'divider' }}>
          <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={onFilesChosen} />
          <Button
            variant="outlined"
            startIcon={<AddPhotoAlternateIcon />}
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? 'Uploading…' : 'Upload image'}
          </Button>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            {images.map((img) => (
              <ImageTile
                key={img.id}
                image={img}
                selected={img.id === selected?.id}
                onClick={() => setSelectedId(img.id)}
              />
            ))}
          </Box>
        </Stack>
        <Box sx={{ flex: 1, minWidth: 0, p: 2, overflowY: 'auto' }}>
          {selected ? (
            <ErrorBoundary key={selected.id} fallback={<Alert severity="error">This image's data is missing from storage.</Alert>}>
              <Suspense fallback={<CircularProgress sx={{ display: 'block', m: 'auto', mt: 8 }} />}>
                <KnockoutEditor key={selected.id} image={selected} />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 8 }}>
              Upload an image to get started.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {selected && (
          <Button color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmingDelete(true)}>
            Delete image
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>{onAddToStage ? 'Cancel' : 'Done'}</Button>
        {onAddToStage && (
          <Button variant="contained" disabled={!selected} onClick={() => selected && onAddToStage(selected)}>
            Add to stage
          </Button>
        )}
      </DialogActions>

      <Dialog open={confirmingDelete} onClose={() => setConfirmingDelete(false)}>
        <DialogTitle>Delete “{selected?.name}”?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {usedBy > 0
              ? `${usedBy} flat${usedBy === 1 ? ' uses' : 's use'} this image and will also be removed. `
              : ''}
            This can't be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmingDelete(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}
