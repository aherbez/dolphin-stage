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
  /** Image width / height; the flat always keeps this ratio */
  aspect: number
  /** Height in meters; width is height * aspect */
  height: number
  /** Center of the bottom edge */
  position: Vec3
  /** Rotation about the vertical axis, in radians */
  rotationY: number
}

export type FlatUpdate = Partial<Pick<Flat, 'position' | 'rotationY' | 'height'>>

interface FlatsState {
  flats: Flat[]
  addFlat: (flat: Flat) => void
  updateFlat: (id: string, update: FlatUpdate) => void
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
    },
  ),
)

export type TransformMode = 'translate' | 'rotate' | 'scale'

interface FlatsUiState {
  selectedId: string | null
  mode: TransformMode
  /** Uniform scale applied while a scale drag is in progress, committed to height on release */
  dragScale: number
  select: (id: string | null) => void
  setMode: (mode: TransformMode) => void
  setDragScale: (scale: number) => void
}

// Selection and editing state; not persisted
export const useFlatsUiStore = create<FlatsUiState>()((set) => ({
  selectedId: null,
  mode: 'translate',
  dragScale: 1,
  select: (id) => set({ selectedId: id, dragScale: 1 }),
  setMode: (mode) => set({ mode }),
  setDragScale: (dragScale) => set({ dragScale }),
}))
