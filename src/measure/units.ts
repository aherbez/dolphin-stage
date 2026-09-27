import type { Vec3 } from '../scene/cameraPresets.ts'
import type { Units } from '../settingsStore.ts'

const METERS_PER_INCH = 0.0254
const QUARTERS = ['', '¼', '½', '¾']

export function distance(a: Vec3, b: Vec3) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

/** Formats a length in meters (glTF's unit) as e.g. 12' 3½" or 3.74 m. */
export function formatLength(meters: number, units: Units) {
  if (units === 'metric') {
    return meters < 1 ? `${(meters * 100).toFixed(1)} cm` : `${meters.toFixed(2)} m`
  }
  const quarterInches = Math.round((meters / METERS_PER_INCH) * 4)
  const feet = Math.floor(quarterInches / 48)
  const remainder = quarterInches % 48
  const inches = `${Math.floor(remainder / 4)}${QUARTERS[remainder % 4]}"`
  return feet > 0 ? `${feet}' ${inches}` : inches
}
