import { useFlatsStore } from '../flats/flatsStore.ts'
import { forgetPreviews, decodeImageData } from './imageData.ts'
import { deleteImage, prepareImage, saveImage } from './imageStore.ts'
import { DEFAULT_KNOCKOUT } from './knockout.ts'
import { useLibraryStore, type LibraryImage } from './libraryStore.ts'
import { disposeImageTexture } from './textures.ts'

/** Adds uploaded files to the library. Returns the added images and the names of files that failed. */
export async function importImageFiles(files: File[]) {
  const added: LibraryImage[] = []
  const failed: string[] = []
  for (const file of files) {
    try {
      const { blob, width, height } = await prepareImage(file)
      const image: LibraryImage = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^.]+$/, ''),
        width,
        height,
        knockout: DEFAULT_KNOCKOUT,
      }
      await saveImage(image.id, blob)
      useLibraryStore.getState().addImage(image)
      added.push(image)
    } catch (err) {
      console.error(err)
      failed.push(file.name)
    }
  }
  return { added, failed }
}

/** Removes an image, every flat that uses it, and its stored bytes. */
export async function deleteLibraryImage(id: string) {
  useFlatsStore.getState().removeFlatsWithImage(id)
  useLibraryStore.getState().removeImage(id)
  disposeImageTexture(id)
  forgetPreviews(id)
  await deleteImage(id)
}

function hydrated(store: typeof useLibraryStore | typeof useFlatsStore) {
  if (store.persist.hasHydrated()) return Promise.resolve()
  return new Promise<void>((resolve) => {
    const unsubscribe = store.persist.onFinishHydration(() => {
      unsubscribe()
      resolve()
    })
  })
}

let reconciling: Promise<void> | undefined

/**
 * Creates library entries for images that flats use but the library doesn't know about
 * (flats made before the library existed). Safe to call repeatedly; runs once.
 */
export function reconcileLibrary() {
  reconciling ??= (async () => {
    await Promise.all([hydrated(useLibraryStore), hydrated(useFlatsStore)])
    const known = new Set(useLibraryStore.getState().images.map((img) => img.id))
    const flats = useFlatsStore.getState().scenes.flatMap((scene) => scene.flats)
    for (const flat of flats) {
      if (known.has(flat.imageId)) continue
      known.add(flat.imageId)
      try {
        const { width, height } = await decodeImageData(flat.imageId)
        useLibraryStore.getState().addImage({
          id: flat.imageId,
          name: flat.name,
          width,
          height,
          knockout: DEFAULT_KNOCKOUT,
        })
      } catch (err) {
        console.error(err)
      }
    }
  })()
  return reconciling
}
