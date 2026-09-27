import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CameraPreset, Vec3 } from './cameraPresets.ts'

export interface SavedView extends CameraPreset {
  id: string
}

interface SavedViewsState {
  views: SavedView[]
  /** Used to name new views; persisted so names aren't reused after a delete */
  nextNumber: number
  /** Saves a view and returns its id */
  addView: (position: Vec3, target: Vec3) => string
  renameView: (id: string, name: string) => void
  removeView: (id: string) => void
}

// User-saved camera views, kept in localStorage
export const useSavedViewsStore = create<SavedViewsState>()(
  persist(
    (set) => ({
      views: [],
      nextNumber: 1,
      addView: (position, target) => {
        const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
        set((s) => ({
          views: [...s.views, { id, name: `Saved view ${s.nextNumber}`, position, target }],
          nextNumber: s.nextNumber + 1,
        }))
        return id
      },
      renameView: (id, name) => set((s) => ({ views: s.views.map((v) => (v.id === id ? { ...v, name } : v)) })),
      removeView: (id) => set((s) => ({ views: s.views.filter((v) => v.id !== id) })),
    }),
    { name: 'dolphin-stage:saved-views' },
  ),
)
