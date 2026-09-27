import { useState } from 'react'
import {
  Box,
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
  Tooltip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import EditIcon from '@mui/icons-material/Edit'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { selectCurrentScene, useFlatsStore, type Scene } from '../flats/flatsStore.ts'
import { InlineRenameField } from './InlineRenameField.tsx'

const HANDLE_WIDTH = 28

interface SceneRowProps {
  scene: Scene
  current: boolean
  renaming: boolean
  canDelete: boolean
  onStartRename: () => void
  onEndRename: () => void
  onDelete: () => void
}

function SceneRow({ scene, current, renaming, canDelete, onStartRename, onEndRename, onDelete }: SceneRowProps) {
  const switchScene = useFlatsStore((s) => s.switchScene)
  const renameScene = useFlatsStore((s) => s.renameScene)
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: scene.id,
  })

  // Inline style rather than sx: the transform changes every frame while dragging
  const rowStyle = { transform: CSS.Translate.toString(transform), transition }
  // Lift the dragged row above its neighbors
  const rowSx = isDragging ? { position: 'relative', zIndex: 1, bgcolor: 'background.paper', boxShadow: 4 } : {}

  if (renaming) {
    return (
      <ListItem ref={setNodeRef} disablePadding style={rowStyle} sx={rowSx}>
        <Box sx={{ width: HANDLE_WIDTH, flexShrink: 0 }} />
        <InlineRenameField
          initialName={scene.name}
          label="Scene name"
          onRename={(name) => renameScene(scene.id, name)}
          onDone={onEndRename}
        />
      </ListItem>
    )
  }

  return (
    <ListItem
      ref={setNodeRef}
      disablePadding
      style={rowStyle}
      sx={rowSx}
      secondaryAction={
        <>
          <Tooltip title="Rename">
            <IconButton size="small" aria-label={`Rename ${scene.name}`} onClick={onStartRename}>
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
                onClick={onDelete}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </>
      }
    >
      {/* Only the handle starts a drag, so clicking the row still switches scenes */}
      <IconButton
        ref={setActivatorNodeRef}
        size="small"
        disableRipple
        aria-label={`Reorder ${scene.name}`}
        {...attributes}
        {...listeners}
        sx={{
          width: HANDLE_WIDTH,
          flexShrink: 0,
          borderRadius: 1,
          color: 'text.secondary',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
      >
        <DragIndicatorIcon fontSize="small" />
      </IconButton>
      <ListItemButton
        selected={current}
        onClick={() => switchScene(scene.id)}
        onDoubleClick={onStartRename}
        sx={{ pl: 1, pr: 10 }}
      >
        <ListItemText
          primary={scene.name}
          secondary={`${scene.flats.length} set piece${scene.flats.length === 1 ? '' : 's'}`}
          slotProps={{ primary: { noWrap: true } }}
        />
      </ListItemButton>
    </ListItem>
  )
}

export function ScenesSection() {
  const scenes = useFlatsStore((s) => s.scenes)
  const currentId = useFlatsStore((s) => selectCurrentScene(s).id)
  const addScene = useFlatsStore((s) => s.addScene)
  const duplicateScene = useFlatsStore((s) => s.duplicateScene)
  const deleteScene = useFlatsStore((s) => s.deleteScene)
  const moveScene = useFlatsStore((s) => s.moveScene)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<Scene | null>(null)
  const canDelete = scenes.length > 1

  const sensors = useSensors(
    // A small threshold keeps plain clicks on the handle from starting a drag
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Screen reader announcements by scene name rather than internal id
  const nameOf = (id: string | number) => scenes.find((scene) => scene.id === id)?.name ?? 'scene'
  const positionOf = (id: string | number) => scenes.findIndex((scene) => scene.id === id) + 1
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nameOf(active.id)} moved to position ${positionOf(over.id)} of ${scenes.length}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `${nameOf(active.id)} dropped at position ${positionOf(over.id)} of ${scenes.length}.` : undefined,
    onDragCancel: ({ active }) => `Reordering cancelled. ${nameOf(active.id)} was not moved.`,
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) moveScene(String(active.id), String(over.id))
  }

  // Empty scenes go straight away; ones with set pieces ask first
  const requestDelete = (scene: Scene) => {
    if (scene.flats.length) setConfirming(scene)
    else deleteScene(scene.id)
  }

  return (
    <Stack spacing={1}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        accessibility={{ announcements }}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={scenes.map((scene) => scene.id)} strategy={verticalListSortingStrategy}>
          <List dense disablePadding>
            {scenes.map((scene) => (
              <SceneRow
                key={scene.id}
                scene={scene}
                current={scene.id === currentId}
                renaming={scene.id === renamingId}
                canDelete={canDelete}
                onStartRename={() => setRenamingId(scene.id)}
                onEndRename={() => setRenamingId(null)}
                onDelete={() => requestDelete(scene)}
              />
            ))}
          </List>
        </SortableContext>
      </DndContext>
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
