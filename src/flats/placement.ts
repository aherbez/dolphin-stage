import { Raycaster, Vector3 } from 'three'
import type { CameraControls } from '@react-three/drei'
import type { Vec3 } from '../scene/cameraPresets.ts'
import { stageRoot } from '../scene/stageRoot.ts'

const DOWN = new Vector3(0, -1, 0)

/**
 * Where to put a new flat: under the point the camera orbits around, dropped onto the
 * stage surface below it, and turned to face the camera.
 */
export function placementFacingCamera(controls: CameraControls): { position: Vec3; rotationY: number } {
  const target = controls.getTarget(new Vector3())
  const camera = controls.getPosition(new Vector3())

  const raycaster = new Raycaster(target, DOWN)
  // three-mesh-bvh (set up by <Bvh>) can stop at the first hit
  Object.assign(raycaster, { firstHitOnly: true })
  const hit = stageRoot.current && raycaster.intersectObject(stageRoot.current, true)[0]
  const y = hit ? hit.point.y : 0

  return {
    position: [target.x, y, target.z],
    rotationY: Math.atan2(camera.x - target.x, camera.z - target.z),
  }
}
