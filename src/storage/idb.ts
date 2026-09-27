import { createStore, del, get, set } from 'idb-keyval'
import { createJSONStorage } from 'zustand/middleware'

/** The app's single IndexedDB object store, shared by images and persisted state. */
export const idbStore = createStore('dolphin-stage', 'keyval')

/** zustand `persist` storage backed by IndexedDB, for state too large for localStorage. */
export const idbStateStorage = createJSONStorage(() => ({
  getItem: async (name: string) => (await get<string>(name, idbStore)) ?? null,
  setItem: (name: string, value: string) => set(name, value, idbStore),
  removeItem: (name: string) => del(name, idbStore),
}))
