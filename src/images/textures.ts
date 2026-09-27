import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from 'three'
import { decodeImageData } from './imageData.ts'
import { applyKnockout, bleedEdgeColors } from './knockout.ts'
import type { LibraryImage } from './libraryStore.ts'

async function buildTexture(image: LibraryImage) {
  const pixels = applyKnockout(await decodeImageData(image.id), image.knockout)
  bleedEdgeColors(pixels)

  // Textures sample bottom-up, so flip rows (DataTexture ignores flipY)
  const { width, height, data } = pixels
  const rowBytes = width * 4
  const flipped = new Uint8Array(data.length)
  for (let y = 0; y < height; y++) {
    flipped.set(data.subarray(y * rowBytes, (y + 1) * rowBytes), (height - 1 - y) * rowBytes)
  }

  // A DataTexture keeps the colors under transparent pixels (a canvas would zero them)
  const texture = new DataTexture(flipped, width, height, RGBAFormat, UnsignedByteType)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = LinearFilter
  texture.minFilter = LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

// One texture per image, rebuilt when its knockout settings change
const cache = new Map<string, { key: string; promise: Promise<DataTexture> }>()

/** The flat texture for an image with its current knockout applied; stable per settings for React's use(). */
export function loadImageTexture(image: LibraryImage) {
  const key = JSON.stringify(image.knockout)
  const entry = cache.get(image.id)
  if (entry?.key === key) return entry.promise

  const promise = buildTexture(image)
  cache.set(image.id, { key, promise })
  // Free the previous version's GPU memory once the replacement is ready
  if (entry) promise.finally(() => entry.promise.then((t) => t.dispose(), () => {}))
  return promise
}

export function disposeImageTexture(id: string) {
  cache.get(id)?.promise.then((t) => t.dispose(), () => {})
  cache.delete(id)
}
