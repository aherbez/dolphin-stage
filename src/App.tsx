import { useState } from 'react'
import { Box, Paper, Stack, Switch, FormControlLabel, Typography } from '@mui/material'
import { Scene } from './scene/Scene.tsx'

export default function App() {
  const [spinning, setSpinning] = useState(true)

  return (
    <Box sx={{ position: 'fixed', inset: 0 }}>
      <Scene spinning={spinning} />
      <Paper sx={{ position: 'absolute', top: 16, left: 16, p: 2 }}>
        <Stack spacing={1}>
          <Typography variant="h6">Dolphin Stage</Typography>
          <FormControlLabel
            control={<Switch checked={spinning} onChange={(e) => setSpinning(e.target.checked)} />}
            label="Spin"
          />
        </Stack>
      </Paper>
    </Box>
  )
}
