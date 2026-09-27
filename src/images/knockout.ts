export type RGB = [number, number, number]

export interface KnockoutSettings {
  enabled: boolean
  /** 0–100: how far (as % of the RGB color range) a pixel may be from the key color and still be removed */
  threshold: number
  /** Only remove matching pixels connected to the image border (keeps same-colored areas inside the artwork) */
  contiguous: boolean
  /** Background color to remove; null means detect it from the image border */
  keyColor: RGB | null
}

export const DEFAULT_KNOCKOUT: KnockoutSettings = {
  enabled: false,
  threshold: 20,
  contiguous: true,
  keyColor: null,
}

const MAX_DISTANCE = Math.sqrt(3 * 255 * 255)

/** The most common color along the image border (ignoring transparent pixels). */
export function detectBackgroundColor({ data, width, height }: ImageData): RGB {
  // Bucket colors coarsely (4 bits per channel) so near-identical shades count together
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>()
  const visit = (x: number, y: number) => {
    const i = (y * width + x) * 4
    if (data[i + 3] < 128) return
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]]
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
    const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
    bucket.n++
    bucket.r += r
    bucket.g += g
    bucket.b += b
    buckets.set(key, bucket)
  }
  for (let x = 0; x < width; x++) {
    visit(x, 0)
    visit(x, height - 1)
  }
  for (let y = 1; y < height - 1; y++) {
    visit(0, y)
    visit(width - 1, y)
  }
  let best: { n: number; r: number; g: number; b: number } | undefined
  for (const bucket of buckets.values()) if (!best || bucket.n > best.n) best = bucket
  if (!best) return [255, 255, 255]
  return [Math.round(best.r / best.n), Math.round(best.g / best.n), Math.round(best.b / best.n)]
}

/** Returns a copy of `source` with the background made transparent according to `settings`. */
export function applyKnockout(source: ImageData, settings: KnockoutSettings): ImageData {
  const { width, height, data } = source
  const out = new ImageData(new Uint8ClampedArray(data), width, height)
  if (!settings.enabled) return out

  const [kr, kg, kb] = settings.keyColor ?? detectBackgroundColor(source)
  const limit = (settings.threshold / 100) * MAX_DISTANCE
  const limitSq = limit * limit
  const count = width * height
  const matches = new Uint8Array(count)
  for (let p = 0; p < count; p++) {
    const i = p * 4
    const dr = data[i] - kr
    const dg = data[i + 1] - kg
    const db = data[i + 2] - kb
    // Already-transparent pixels count as background so the fill can pass through them
    matches[p] = dr * dr + dg * dg + db * db <= limitSq || data[i + 3] === 0 ? 1 : 0
  }

  if (!settings.contiguous) {
    for (let p = 0; p < count; p++) if (matches[p]) out.data[p * 4 + 3] = 0
    return out
  }

  // Flood fill from every border pixel through matching pixels
  const removed = new Uint8Array(count)
  const stack = new Int32Array(count)
  let top = 0
  const push = (p: number) => {
    if (matches[p] && !removed[p]) {
      removed[p] = 1
      stack[top++] = p
    }
  }
  for (let x = 0; x < width; x++) {
    push(x)
    push((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    push(y * width)
    push(y * width + width - 1)
  }
  while (top > 0) {
    const p = stack[--top]
    out.data[p * 4 + 3] = 0
    const x = p % width
    if (x > 0) push(p - 1)
    if (x < width - 1) push(p + 1)
    if (p >= width) push(p - width)
    if (p < count - width) push(p + width)
  }
  return out
}

/**
 * Copies the colors of opaque edge pixels outward into neighboring transparent pixels (in place).
 * Transparent pixels otherwise keep the old background color (or black, after a canvas round
 * trip), which texture filtering blends into a visible fringe around cut-out edges.
 */
export function bleedEdgeColors(image: ImageData, passes = 4) {
  const { width, height, data } = image
  const count = width * height
  let solid = new Uint8Array(count)
  for (let p = 0; p < count; p++) solid[p] = data[p * 4 + 3] > 0 ? 1 : 0

  for (let pass = 0; pass < passes; pass++) {
    const next = solid.slice()
    let changed = false
    for (let p = 0; p < count; p++) {
      if (solid[p]) continue
      const x = p % width
      let n = 0
      let r = 0
      let g = 0
      let b = 0
      const take = (q: number) => {
        if (!solid[q]) return
        n++
        r += data[q * 4]
        g += data[q * 4 + 1]
        b += data[q * 4 + 2]
      }
      if (x > 0) take(p - 1)
      if (x < width - 1) take(p + 1)
      if (p >= width) take(p - width)
      if (p < count - width) take(p + width)
      if (!n) continue
      data[p * 4] = r / n
      data[p * 4 + 1] = g / n
      data[p * 4 + 2] = b / n
      next[p] = 1
      changed = true
    }
    solid = next
    if (!changed) break
  }
}
