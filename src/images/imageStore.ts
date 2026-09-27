import { del, get, set } from 'idb-keyval'
import { idbStore } from '../storage/idb.ts'

// Longest edge of stored images; phone photos are often 4000px+, which wastes storage and GPU memory
const MAX_IMAGE_SIZE = 2048

const imageKey = (id: string) => `image:${id}`

// Stored as raw bytes rather than a Blob: browsers keep IndexedDB Blobs as separate backing
// files, which some engines have handled unreliably. Bytes live inside the record itself.
interface StoredImage {
  type: string
  data: ArrayBuffer
}

export interface PreparedImage {
  blob: Blob
  width: number
  height: number
}

/** Decodes an uploaded image, downscales it if needed, and re-encodes it (WebP keeps transparency). */
export async function prepareImage(file: File): Promise<PreparedImage> {
  // createImageBitmap applies EXIF orientation, so phone photos come out upright
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_IMAGE_SIZE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = new OffscreenCanvas(width, height)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  // Browsers that can't encode WebP (Safari) fall back to PNG
  const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.9 })
  return { blob, width, height }
}

/** Stores an image's original bytes. */
export async function saveImage(id: string, blob: Blob) {
  const stored: StoredImage = { type: blob.type, data: await blob.arrayBuffer() }
  await set(imageKey(id), stored, idbStore)
  // Ask the browser not to evict our data under storage pressure; it may silently decline
  navigator.storage?.persist?.()
}

/** Loads an image's original bytes, or null if they're missing from storage. */
export async function loadImageBlob(id: string): Promise<Blob | null> {
  const stored = await get<StoredImage | Blob>(imageKey(id), idbStore)
  if (!stored) return null
  // Early builds stored Blobs directly
  return stored instanceof Blob ? stored : new Blob([stored.data], { type: stored.type })
}

export function deleteImage(id: string) {
  return del(imageKey(id), idbStore)
}
