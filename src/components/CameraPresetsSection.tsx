import type { RefObject } from 'react'
import { Button, IconButton, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { Vector3 } from 'three'
import type { CameraControls } from '@react-three/drei'
import { CAMERA_PRESETS, type CameraPreset, type Vec3 } from '../scene/cameraPresets.ts'
import { useSavedViewsStore } from '../scene/savedViewsStore.ts'

const round = (v: Vector3) => v.toArray().map((n) => Number(n.toFixed(3))) as Vec3

export function CameraPresetsSection({
  controlsRef,
}: {
  controlsRef: RefObject<CameraControls | null>
}) {
  const { views, addView, removeView } = useSavedViewsStore()

  const goTo = (preset: CameraPreset) => {
    controlsRef.current?.setLookAt(...preset.position, ...preset.target, true)
  }

  const saveCurrentView = () => {
    const controls = controlsRef.current
    if (!controls) return
    addView(round(controls.getPosition(new Vector3())), round(controls.getTarget(new Vector3())))
  }

  return (
    <Stack spacing={1}>
      {CAMERA_PRESETS.map((preset) => (
        <Button key={preset.name} variant="outlined" onClick={() => goTo(preset)}>
          {preset.name}
        </Button>
      ))}
      {views.length > 0 && (
        <Typography variant="overline" sx={{ pt: 1 }}>
          Saved views
        </Typography>
      )}
      {views.map((view) => (
        <Stack key={view.id} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Button variant="outlined" sx={{ flex: 1 }} onClick={() => goTo(view)}>
            {view.name}
          </Button>
          <IconButton size="small" aria-label={`Delete ${view.name}`} onClick={() => removeView(view.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={saveCurrentView}>
        Save current view
      </Button>
    </Stack>
  )
}
