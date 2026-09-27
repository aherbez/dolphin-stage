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
  addView: (position: Vec3, target: Vec3) => void
  removeView: (id: string) => void
}

// User-saved camera views, kept in localStorage
export const useSavedViewsStore = create<SavedViewsState>()(
  persist(
    (set) => ({
      views: [],
      nextNumber: 1,
      addView: (position, target) =>
        set((s) => ({
          views: [
            ...s.views,
            {
              id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
              name: `Saved view ${s.nextNumber}`,
              position,
              target,
            },
          ],
          nextNumber: s.nextNumber + 1,
        })),
      removeView: (id) => set((s) => ({ views: s.views.filter((v) => v.id !== id) })),
    }),
    { name: 'dolphin-stage:saved-views' },
  ),
)
