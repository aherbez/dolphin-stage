import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Units = 'imperial' | 'metric'

interface SettingsState {
  units: Units
  setUnits: (units: Units) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      units: 'imperial',
      setUnits: (units) => set({ units }),
    }),
    { name: 'dolphin-stage:settings' },
  ),
)
