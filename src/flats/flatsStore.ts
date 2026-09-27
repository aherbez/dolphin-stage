import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Vec3 } from '../scene/cameraPresets.ts'
import { idbStateStorage } from '../storage/idb.ts'

export interface Flat {
  id: string
  name: string
  /** The library image shown on the flat (see images/libraryStore.ts) */
  imageId: string
  /** Size in meters */
  width: number
  height: number
  /** When true, resizing keeps the current width:height ratio */
  aspectLocked: boolean
  /** Center of the bottom edge */
  position: Vec3
  /** Rotation about the vertical axis, in radians */
  rotationY: number
}

export type FlatUpdate = Partial<Pick<Flat, 'position' | 'rotationY' | 'width' | 'height' | 'aspectLocked'>>

/** A named arrangement of set pieces */
export interface Scene {
  id: string
  name: string
  flats: Flat[]
}

interface FlatsState {
  scenes: Scene[]
  currentSceneId: string
  // Flat actions apply to the current scene
  addFlat: (flat: Flat) => void
  updateFlat: (id: string, update: FlatUpdate) => void
  /** Sets width and/or height, adjusting the other to match if the aspect ratio is locked */
  resizeFlat: (id: string, size: { width?: number; height?: number }) => void
  removeFlat: (id: string) => void
  /** Removes flats showing an image from every scene */
  removeFlatsWithImage: (imageId: string) => void
  /** Adds an empty scene and switches to it; returns its id */
  addScene: () => string
  /** Copies the current scene (placed right after it) and switches to the copy; returns its id */
  duplicateScene: () => string
  renameScene: (id: string, name: string) => void
  /** Deletes a scene unless it's the last one; deleting the current scene switches to a neighbor */
  deleteScene: (id: string) => void
  /** Moves a scene to where another scene currently is in the list */
  moveScene: (id: string, toId: string) => void
  switchScene: (id: string) => void
}

const newScene = (name: string, flats: Flat[] = []): Scene => ({ id: crypto.randomUUID(), name, flats })

/** The current scene; falls back to the first so there's always one. */
export const selectCurrentScene = (s: FlatsState) =>
  s.scenes.find((scene) => scene.id === s.currentSceneId) ?? s.scenes[0]

export const selectFlats = (s: FlatsState) => selectCurrentScene(s).flats

/** First unused "Scene N" name */
function nextSceneName(scenes: Scene[]) {
  const names = new Set(scenes.map((scene) => scene.name))
  let n = scenes.length + 1
  while (names.has(`Scene ${n}`)) n++
  return `Scene ${n}`
}

const initialScene = newScene('Scene 1')

// Scenes (and their flats) persist to IndexedDB alongside the images
export const useFlatsStore = create<FlatsState>()(
  persist(
    (set, get) => {
      /** Replaces the current scene's flats with `fn(flats)` */
      const updateCurrent = (fn: (flats: Flat[]) => Flat[]) =>
        set((s) => {
          const current = selectCurrentScene(s)
          return {
            scenes: s.scenes.map((scene) => (scene === current ? { ...scene, flats: fn(scene.flats) } : scene)),
          }
        })

      return {
        scenes: [initialScene],
        currentSceneId: initialScene.id,

        addFlat: (flat) => updateCurrent((flats) => [...flats, flat]),
        updateFlat: (id, update) =>
          updateCurrent((flats) => flats.map((f) => (f.id === id ? { ...f, ...update } : f))),
        resizeFlat: (id, { width, height }) =>
          updateCurrent((flats) =>
            flats.map((f) => {
              if (f.id !== id) return f
              const ratio = f.width / f.height
              if (f.aspectLocked && width !== undefined) return { ...f, width, height: width / ratio }
              if (f.aspectLocked && height !== undefined) return { ...f, height, width: height * ratio }
              return { ...f, width: width ?? f.width, height: height ?? f.height }
            }),
          ),
        removeFlat: (id) => updateCurrent((flats) => flats.filter((f) => f.id !== id)),
        removeFlatsWithImage: (imageId) =>
          set((s) => ({
            scenes: s.scenes.map((scene) => ({ ...scene, flats: scene.flats.filter((f) => f.imageId !== imageId) })),
          })),

        addScene: () => {
          const scene = newScene(nextSceneName(get().scenes))
          set((s) => ({ scenes: [...s.scenes, scene] }))
          get().switchScene(scene.id)
          return scene.id
        },
        duplicateScene: () => {
          const original = selectCurrentScene(get())
          const copy = newScene(
            `${original.name} (copy)`,
            original.flats.map((f) => ({ ...f, id: crypto.randomUUID() })),
          )
          set((s) => {
            const scenes = [...s.scenes]
            scenes.splice(scenes.indexOf(original) + 1, 0, copy)
            return { scenes }
          })
          get().switchScene(copy.id)
          return copy.id
        },
        renameScene: (id, name) =>
          set((s) => ({ scenes: s.scenes.map((scene) => (scene.id === id ? { ...scene, name } : scene)) })),
        deleteScene: (id) => {
          const { scenes } = get()
          const index = scenes.findIndex((scene) => scene.id === id)
          if (index < 0 || scenes.length <= 1) return
          if (id === selectCurrentScene(get()).id) {
            get().switchScene((scenes[index + 1] ?? scenes[index - 1]).id)
          }
          set((s) => ({ scenes: s.scenes.filter((scene) => scene.id !== id) }))
        },
        moveScene: (id, toId) =>
          set((s) => {
            const from = s.scenes.findIndex((scene) => scene.id === id)
            const to = s.scenes.findIndex((scene) => scene.id === toId)
            if (from < 0 || to < 0 || from === to) return s
            const scenes = [...s.scenes]
            scenes.splice(to, 0, ...scenes.splice(from, 1))
            return { scenes }
          }),
        switchScene: (id) => {
          if (id === selectCurrentScene(get()).id) return
          // The selected flat belongs to the old scene
          useFlatsUiStore.getState().select(null)
          set({ currentSceneId: id })
        },
      }
    },
    {
      name: 'dolphin-stage:flats',
      storage: idbStateStorage,
      partialize: ({ scenes, currentSceneId }) => ({ scenes, currentSceneId }),
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>
        if (version < 1) {
          // v0 stored the image's aspect ratio and a height; width was derived
          state.flats = (state.flats as Record<string, unknown>[]).map(({ aspect, ...f }) => ({
            ...f,
            width: (aspect as number) * (f.height as number),
            aspectLocked: true,
          }))
        }
        if (version < 2) {
          // v1 had a single set of flats; it becomes the first scene
          const scene = newScene('Scene 1', state.flats as Flat[])
          return { scenes: [scene], currentSceneId: scene.id } as unknown as FlatsState
        }
        return state as unknown as FlatsState
      },
    },
  ),
)

export type TransformMode = 'translate' | 'rotate' | 'scale'

interface FlatsUiState {
  selectedId: string | null
  mode: TransformMode
  /** [x, y] scale applied while a scale drag is in progress, committed to the size on release */
  dragScale: [number, number]
  select: (id: string | null) => void
  setMode: (mode: TransformMode) => void
  setDragScale: (scale: [number, number]) => void
}

// Selection and editing state; not persisted
export const useFlatsUiStore = create<FlatsUiState>()((set) => ({
  selectedId: null,
  mode: 'translate',
  dragScale: [1, 1],
  select: (id) => set({ selectedId: id, dragScale: [1, 1] }),
  setMode: (mode) => set({ mode }),
  setDragScale: (dragScale) => set({ dragScale }),
}))
