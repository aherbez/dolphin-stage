import { loadImageBlob } from './imageStore.ts'

/** Decodes a stored image into pixels, scaled down to fit within `maxSize` if given. */
export async function decodeImageData(id: string, maxSize = Infinity): Promise<ImageData> {
  const blob = await loadImageBlob(id)
  if (!blob) throw new Error(`Image ${id} is missing from storage`)
  const bitmap = await createImageBitmap(blob)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  return ctx.getImageData(0, 0, width, height)
}

// Small decoded copies for thumbnails and the editor preview, cached so React's use() gets
// stable promises and slider changes don't re-decode
const previewCache = new Map<string, Promise<ImageData>>()

export function loadPreviewImageData(id: string, maxSize: number) {
  const key = `${id}@${maxSize}`
  let promise = previewCache.get(key)
  if (!promise) {
    promise = decodeImageData(id, maxSize)
    previewCache.set(key, promise)
  }
  return promise
}

export function forgetPreviews(id: string) {
  for (const key of previewCache.keys()) if (key.startsWith(`${id}@`)) previewCache.delete(key)
}
