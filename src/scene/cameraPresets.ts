export type Vec3 = [number, number, number]

export interface CameraPreset {
  name: string
  position: Vec3
  target: Vec3
}

// Placeholder values, assuming the stage is centered near the origin, units are
// meters, and the audience sits toward +z. Once the real scan is loaded, frame each
// view by orbiting and use "Copy current view" to grab exact numbers.
export const CAMERA_PRESETS: CameraPreset[] = [
  { name: 'Front row center', position: [0, 1.2, 4], target: [0, 1.5, -3] },
  { name: 'Middle center', position: [0, 2, 10], target: [0, 1.5, -3] },
  { name: 'Back row center', position: [0, 3.5, 18], target: [0, 1.5, -3] },
  { name: 'House left', position: [-6, 1.5, 8], target: [0, 1.5, -3] },
  { name: 'House right', position: [6, 1.5, 8], target: [0, 1.5, -3] },
  { name: 'Overhead', position: [0, 15, 0.01], target: [0, 0, -3] },
]

export const DEFAULT_PRESET = CAMERA_PRESETS[1]
