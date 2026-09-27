import { use, useMemo, useState } from 'react'
import {
  Box,
  Button,
  FormControlLabel,
  Slider,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material'
import ColorizeIcon from '@mui/icons-material/Colorize'
import { loadPreviewImageData } from '../images/imageData.ts'
import { detectBackgroundColor, type KnockoutSettings, type RGB } from '../images/knockout.ts'
import { useLibraryStore, type LibraryImage } from '../images/libraryStore.ts'
import { ImageCanvas } from './ImageCanvas.tsx'

const PREVIEW_SIZE = 720

const toCss = ([r, g, b]: RGB) => `rgb(${r} ${g} ${b})`

/** Background-removal controls with a live preview. Mount with key={image.id}. */
export function KnockoutEditor({ image }: { image: LibraryImage }) {
  const source = use(loadPreviewImageData(image.id, PREVIEW_SIZE))
  const setKnockout = useLibraryStore((s) => s.setKnockout)
  // Local copy so the slider can preview live; saved (and flats rebuilt) when a change is committed
  const [draft, setDraft] = useState(image.knockout)
  const [picking, setPicking] = useState(false)
  const detected = useMemo(() => detectBackgroundColor(source), [source])

  const commit = (next: KnockoutSettings) => {
    setDraft(next)
    setKnockout(image.id, next)
  }

  const pickColor = (x: number, y: number) => {
    const i = (y * source.width + x) * 4
    commit({ ...draft, enabled: true, keyColor: [source.data[i], source.data[i + 1], source.data[i + 2]] })
    setPicking(false)
  }

  const keyColor = draft.keyColor ?? detected

  return (
    <Stack spacing={2} sx={{ height: '100%' }}>
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ImageCanvas
          source={source}
          knockout={draft}
          onPixelClick={picking ? pickColor : undefined}
          sx={{ maxHeight: '100%', objectFit: 'contain' }}
        />
      </Box>
      {picking && (
        <Typography variant="body2" color="primary" sx={{ textAlign: 'center' }}>
          Click the background in the image above
        </Typography>
      )}
      <FormControlLabel
        control={<Switch checked={draft.enabled} onChange={(e) => commit({ ...draft, enabled: e.target.checked })} />}
        label="Remove background"
      />
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Typography variant="body2" sx={{ width: 110, flexShrink: 0 }}>
          Threshold
        </Typography>
        <Slider
          disabled={!draft.enabled}
          value={draft.threshold}
          min={0}
          max={100}
          valueLabelDisplay="auto"
          onChange={(_, value) => setDraft({ ...draft, threshold: value as number })}
          onChangeCommitted={(_, value) => commit({ ...draft, threshold: value as number })}
          aria-label="Threshold"
        />
      </Stack>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Typography variant="body2" sx={{ width: 110, flexShrink: 0 }}>
          Background color
        </Typography>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
            bgcolor: toCss(keyColor),
            flexShrink: 0,
          }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          {draft.keyColor ? 'Picked' : 'Auto-detected'}
        </Typography>
        {draft.keyColor && (
          <Button size="small" onClick={() => commit({ ...draft, keyColor: null })}>
            Auto
          </Button>
        )}
        <Tooltip title="Pick the background color from the image">
          <Button
            size="small"
            variant={picking ? 'contained' : 'outlined'}
            startIcon={<ColorizeIcon />}
            onClick={() => setPicking(!picking)}
          >
            Pick
          </Button>
        </Tooltip>
      </Stack>
      <FormControlLabel
        disabled={!draft.enabled}
        control={
          <Switch checked={draft.contiguous} onChange={(e) => commit({ ...draft, contiguous: e.target.checked })} />
        }
        label="Only remove background touching the edges"
      />
    </Stack>
  )
}
