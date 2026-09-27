import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { idbStateStorage } from '../storage/idb.ts'
import type { KnockoutSettings } from './knockout.ts'

export interface LibraryImage {
  /** Also the key of the original image bytes in IndexedDB (see imageStore.ts) */
  id: string
  name: string
  /** Pixel size of the stored original */
  width: number
  height: number
  knockout: KnockoutSettings
}

interface LibraryState {
  images: LibraryImage[]
  addImage: (image: LibraryImage) => void
  setKnockout: (id: string, knockout: KnockoutSettings) => void
  removeImage: (id: string) => void
}

// Image metadata persists to IndexedDB alongside the image bytes
export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      images: [],
      addImage: (image) => set((s) => ({ images: [...s.images, image] })),
      setKnockout: (id, knockout) =>
        set((s) => ({ images: s.images.map((img) => (img.id === id ? { ...img, knockout } : img)) })),
      removeImage: (id) => set((s) => ({ images: s.images.filter((img) => img.id !== id) })),
    }),
    {
      name: 'dolphin-stage:images',
      storage: idbStateStorage,
      partialize: ({ images }) => ({ images }),
    },
  ),
)
