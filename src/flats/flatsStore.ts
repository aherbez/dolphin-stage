import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Vec3 } from '../scene/cameraPresets.ts'
import { idbStateStorage } from '../storage/idb.ts'
import { deleteImage } from './imageStore.ts'

export interface Flat {
  id: string
  name: string
  /** Key of the image in IndexedDB (see imageStore.ts) */
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

interface FlatsState {
  flats: Flat[]
  addFlat: (flat: Flat) => void
  updateFlat: (id: string, update: FlatUpdate) => void
  /** Sets width and/or height, adjusting the other to match if the aspect ratio is locked */
  resizeFlat: (id: string, size: { width?: number; height?: number }) => void
  removeFlat: (id: string) => void
}

// Flats persist to IndexedDB alongside their images
export const useFlatsStore = create<FlatsState>()(
  persist(
    (set, get) => ({
      flats: [],
      addFlat: (flat) => set((s) => ({ flats: [...s.flats, flat] })),
      updateFlat: (id, update) =>
        set((s) => ({ flats: s.flats.map((f) => (f.id === id ? { ...f, ...update } : f)) })),
      resizeFlat: (id, { width, height }) =>
        set((s) => ({
          flats: s.flats.map((f) => {
            if (f.id !== id) return f
            const ratio = f.width / f.height
            if (f.aspectLocked && width !== undefined) return { ...f, width, height: width / ratio }
            if (f.aspectLocked && height !== undefined) return { ...f, height, width: height * ratio }
            return { ...f, width: width ?? f.width, height: height ?? f.height }
          }),
        })),
      removeFlat: (id) => {
        const flat = get().flats.find((f) => f.id === id)
        set((s) => ({ flats: s.flats.filter((f) => f.id !== id) }))
        if (flat) deleteImage(flat.imageId)
      },
    }),
    {
      name: 'dolphin-stage:flats',
      storage: idbStateStorage,
      partialize: ({ flats }) => ({ flats }),
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as { flats: Record<string, unknown>[] }
        if (version < 1) {
          // v0 stored the image's aspect ratio and a height; width was derived
          state.flats = state.flats.map(({ aspect, ...f }) => ({
            ...f,
            width: (aspect as number) * (f.height as number),
            aspectLocked: true,
          }))
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
