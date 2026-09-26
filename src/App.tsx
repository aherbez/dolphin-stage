import { useRef, useState } from 'react'
import { Alert, Box, Divider, Paper, Stack, Typography } from '@mui/material'
import type { CameraControls } from '@react-three/drei'
import { Scene } from './scene/Scene.tsx'
import { STAGE_URL } from './scene/Stage.tsx'
import { CameraPresetsSection } from './components/CameraPresetsSection.tsx'

const PANEL_WIDTH = 320

export default function App() {
  const controlsRef = useRef<CameraControls>(null)
  const [stageError, setStageError] = useState<Error | null>(null)

  return (
    <Box sx={{ position: 'fixed', inset: 0, display: 'flex' }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Scene controlsRef={controlsRef} onStageError={setStageError} />
      </Box>
      <Paper
        square
        elevation={2}
        sx={{ width: PANEL_WIDTH, flexShrink: 0, overflowY: 'auto', p: 2 }}
      >
        <Stack spacing={2} divider={<Divider />}>
          <Typography variant="h6">Dolphin Stage</Typography>
          {stageError && (
            <Alert severity="warning">
              Couldn't load the stage model from <code>{STAGE_URL}</code>.
            </Alert>
          )}
          <CameraPresetsSection controlsRef={controlsRef} />
        </Stack>
      </Paper>
    </Box>
  )
}
