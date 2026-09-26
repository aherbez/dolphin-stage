import { useState, type RefObject } from 'react'
import { Button, Snackbar, Stack, Typography } from '@mui/material'
import { Vector3 } from 'three'
import type { CameraControls } from '@react-three/drei'
import { CAMERA_PRESETS, type CameraPreset } from '../scene/cameraPresets.ts'

const round = (v: Vector3) => v.toArray().map((n) => Number(n.toFixed(2)))

export function CameraPresetsSection({
  controlsRef,
}: {
  controlsRef: RefObject<CameraControls | null>
}) {
  const [copied, setCopied] = useState(false)

  const goTo = (preset: CameraPreset) => {
    controlsRef.current?.setLookAt(...preset.position, ...preset.target, true)
  }

  const copyCurrentView = async () => {
    const controls = controlsRef.current
    if (!controls) return
    const position = round(controls.getPosition(new Vector3()))
    const target = round(controls.getTarget(new Vector3()))
    const snippet = `{ name: 'New view', position: [${position.join(', ')}], target: [${target.join(', ')}] },`
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
  }

  return (
    <Stack spacing={1}>
      <Typography variant="overline">Audience views</Typography>
      {CAMERA_PRESETS.map((preset) => (
        <Button key={preset.name} variant="outlined" onClick={() => goTo(preset)}>
          {preset.name}
        </Button>
      ))}
      <Button size="small" onClick={copyCurrentView}>
        Copy current view
      </Button>
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="View copied to clipboard"
      />
    </Stack>
  )
}
