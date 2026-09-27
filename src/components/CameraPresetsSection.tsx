import { useState, type RefObject } from 'react'
import {
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Tooltip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { Vector3 } from 'three'
import type { CameraControls } from '@react-three/drei'
import { CAMERA_PRESETS, type CameraPreset, type Vec3 } from '../scene/cameraPresets.ts'
import { useSavedViewsStore } from '../scene/savedViewsStore.ts'
import { InlineRenameField } from './InlineRenameField.tsx'

const round = (v: Vector3) => v.toArray().map((n) => Number(n.toFixed(3))) as Vec3

export function CameraPresetsSection({
  controlsRef,
}: {
  controlsRef: RefObject<CameraControls | null>
}) {
  const { views, addView, renameView, removeView } = useSavedViewsStore()
  const [renamingId, setRenamingId] = useState<string | null>(null)

  const goTo = (preset: CameraPreset) => {
    controlsRef.current?.setLookAt(...preset.position, ...preset.target, true)
  }

  const saveCurrentView = () => {
    const controls = controlsRef.current
    if (!controls) return
    // Start renaming right away so the new view can be named as it's saved
    setRenamingId(addView(round(controls.getPosition(new Vector3())), round(controls.getTarget(new Vector3()))))
  }

  return (
    <Stack spacing={1}>
      <List dense disablePadding>
        {CAMERA_PRESETS.map((preset) => (
          <ListItemButton key={preset.name} onClick={() => goTo(preset)}>
            <ListItemText primary={preset.name} />
          </ListItemButton>
        ))}
        {views.map((view) =>
          view.id === renamingId ? (
            <ListItem key={view.id} disablePadding>
              <InlineRenameField
                initialName={view.name}
                label="View name"
                onRename={(name) => renameView(view.id, name)}
                onDone={() => setRenamingId(null)}
              />
            </ListItem>
          ) : (
            <ListItem
              key={view.id}
              disablePadding
              secondaryAction={
                <>
                  <Tooltip title="Rename">
                    <IconButton size="small" aria-label={`Rename ${view.name}`} onClick={() => setRenamingId(view.id)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      edge="end"
                      aria-label={`Delete ${view.name}`}
                      onClick={() => removeView(view.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              }
            >
              <ListItemButton onClick={() => goTo(view)} onDoubleClick={() => setRenamingId(view.id)} sx={{ pr: 10 }}>
                <ListItemText primary={view.name} slotProps={{ primary: { noWrap: true } }} />
              </ListItemButton>
            </ListItem>
          ),
        )}
      </List>
      <Button size="small" startIcon={<AddIcon />} onClick={saveCurrentView}>
        Save current view
      </Button>
    </Stack>
  )
}
