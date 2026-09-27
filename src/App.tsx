import { useRef, useState } from 'react'
import { Alert, Box, Paper, Typography } from '@mui/material'
import type { CameraControls } from '@react-three/drei'
import { Scene } from './scene/Scene.tsx'
import { STAGE_URL } from './scene/Stage.tsx'
import { CameraPresetsSection } from './components/CameraPresetsSection.tsx'
import { MeasureSection } from './components/MeasureSection.tsx'
import { PanelSection } from './components/PanelSection.tsx'
import { useMeasureStore } from './measure/measureStore.ts'

const PANEL_WIDTH = 320

export default function App() {
  const controlsRef = useRef<CameraControls>(null)
  const [stageError, setStageError] = useState<Error | null>(null)
  const placing = useMeasureStore((s) => s.placing)

  return (
    <Box sx={{ position: 'fixed', inset: 0, display: 'flex' }}>
      <Box sx={{ flex: 1, minWidth: 0, cursor: placing ? 'crosshair' : 'auto' }}>
        <Scene controlsRef={controlsRef} onStageError={setStageError} />
      </Box>
      <Paper
        square
        elevation={2}
        sx={{ width: PANEL_WIDTH, flexShrink: 0, overflowY: 'auto' }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Dolphin Stage</Typography>
          {stageError && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Couldn't load the stage model from <code>{STAGE_URL}</code>.
            </Alert>
          )}
        </Box>
        <PanelSection title="Camera views">
          <CameraPresetsSection controlsRef={controlsRef} />
        </PanelSection>
        <PanelSection title="Measurements">
          <MeasureSection />
        </PanelSection>
      </Paper>
    </Box>
  )
}
