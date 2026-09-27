import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Vec3 } from '../scene/cameraPresets.ts'

export interface Measurement {
  id: number
  name: string
  start: Vec3
  end: Vec3
  visible: boolean
}

interface MeasureState {
  measurements: Measurement[]
  /** Used for ids and default names; persisted so they aren't reused after a reload */
  nextId: number
  selectedId: number | null
  /** True while the user is placing the points of a new measurement */
  placing: boolean
  /** First point of the measurement being placed */
  pendingStart: Vec3 | null
  /** Latest point under the cursor while placing the second point */
  hoverPoint: Vec3 | null

  startMeasuring: () => void
  cancelMeasuring: () => void
  placePoint: (point: Vec3) => void
  setHoverPoint: (point: Vec3) => void
  select: (id: number | null) => void
  remove: (id: number) => void
  toggleVisible: (id: number) => void
}

export const useMeasureStore = create<MeasureState>()(
  persist(
    (set, get) => ({
      measurements: [],
      nextId: 1,
      selectedId: null,
      placing: false,
      pendingStart: null,
      hoverPoint: null,

      startMeasuring: () => set({ placing: true, pendingStart: null, hoverPoint: null }),
      cancelMeasuring: () => set({ placing: false, pendingStart: null, hoverPoint: null }),

      placePoint: (point) => {
        const { pendingStart, measurements, nextId } = get()
        if (!pendingStart) {
          set({ pendingStart: point, hoverPoint: point })
          return
        }
        const id = nextId
        set({
          measurements: [
            ...measurements,
            { id, name: `Measurement ${id}`, start: pendingStart, end: point, visible: true },
          ],
          nextId: id + 1,
          selectedId: id,
          placing: false,
          pendingStart: null,
          hoverPoint: null,
        })
      },

      setHoverPoint: (point) => set({ hoverPoint: point }),

      select: (id) => set({ selectedId: id }),

      remove: (id) =>
        set((s) => ({
          measurements: s.measurements.filter((m) => m.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        })),

      toggleVisible: (id) =>
        set((s) => ({
          measurements: s.measurements.map((m) => (m.id === id ? { ...m, visible: !m.visible } : m)),
        })),

    }),
    {
      // Saved measurements are kept in localStorage; in-progress placement and selection are not
      name: 'dolphin-stage:measurements',
      partialize: ({ measurements, nextId }) => ({ measurements, nextId }),
    },
  ),
)
