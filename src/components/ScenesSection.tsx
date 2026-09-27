import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { selectCurrentScene, useFlatsStore, type Scene } from '../flats/flatsStore.ts'

function RenameField({ scene, onDone }: { scene: Scene; onDone: () => void }) {
  const renameScene = useFlatsStore((s) => s.renameScene)
  const [name, setName] = useState(scene.name)

  const commit = () => {
    const trimmed = name.trim()
    if (trimmed) renameScene(scene.id, trimmed)
    onDone()
  }

  return (
    <TextField
      size="small"
      fullWidth
      autoFocus
      value={name}
      onChange={(e) => setName(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') onDone()
      }}
      slotProps={{ htmlInput: { 'aria-label': 'Scene name' } }}
      sx={{ my: 0.5 }}
    />
  )
}

export function ScenesSection() {
  const scenes = useFlatsStore((s) => s.scenes)
  const currentId = useFlatsStore((s) => selectCurrentScene(s).id)
  const switchScene = useFlatsStore((s) => s.switchScene)
  const addScene = useFlatsStore((s) => s.addScene)
  const duplicateScene = useFlatsStore((s) => s.duplicateScene)
  const deleteScene = useFlatsStore((s) => s.deleteScene)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<Scene | null>(null)
  const canDelete = scenes.length > 1

  // Empty scenes go straight away; ones with set pieces ask first
  const requestDelete = (scene: Scene) => {
    if (scene.flats.length) setConfirming(scene)
    else deleteScene(scene.id)
  }

  return (
    <Stack spacing={1}>
      <List dense disablePadding>
        {scenes.map((scene) =>
          scene.id === renamingId ? (
            <ListItem key={scene.id} disablePadding>
              <RenameField scene={scene} onDone={() => setRenamingId(null)} />
            </ListItem>
          ) : (
            <ListItem
              key={scene.id}
              disablePadding
              secondaryAction={
                <>
                  <Tooltip title="Rename">
                    <IconButton size="small" aria-label={`Rename ${scene.name}`} onClick={() => setRenamingId(scene.id)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {/* The span keeps the tooltip working while the button is disabled */}
                  <Tooltip title={canDelete ? 'Delete' : "The last scene can't be deleted"}>
                    <span>
                      <IconButton
                        size="small"
                        edge="end"
                        aria-label={`Delete ${scene.name}`}
                        disabled={!canDelete}
                        onClick={() => requestDelete(scene)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              }
            >
              <ListItemButton
                selected={scene.id === currentId}
                onClick={() => switchScene(scene.id)}
                onDoubleClick={() => setRenamingId(scene.id)}
                sx={{ pr: 10 }}
              >
                <ListItemText
                  primary={scene.name}
                  secondary={`${scene.flats.length} set piece${scene.flats.length === 1 ? '' : 's'}`}
                  slotProps={{ primary: { noWrap: true } }}
                />
              </ListItemButton>
            </ListItem>
          ),
        )}
      </List>
      <Button size="small" startIcon={<AddIcon />} onClick={() => setRenamingId(addScene())}>
        New scene
      </Button>
      <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => setRenamingId(duplicateScene())}>
        Duplicate current scene
      </Button>
      <Dialog open={confirming !== null} onClose={() => setConfirming(null)}>
        <DialogTitle>Delete “{confirming?.name}”?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Its {confirming?.flats.length} set piece{confirming?.flats.length === 1 ? '' : 's'} will be removed. Images
            stay in the library. This can't be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirming(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (confirming) deleteScene(confirming.id)
              setConfirming(null)
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
