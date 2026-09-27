import { Suspense, useEffect, type RefObject } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Bvh, CameraControls } from '@react-three/drei'
import { Stage } from './Stage.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'
import { DEFAULT_PRESET } from './cameraPresets.ts'
import { MeasureTarget, Measurements } from '../measure/MeasureLayer.tsx'
import { Flats } from '../flats/Flats.tsx'
import { useFlatsUiStore } from '../flats/flatsStore.ts'

function InitialView() {
  const controls = useThree((s) => s.controls) as CameraControls | null
  useEffect(() => {
    controls?.setLookAt(...DEFAULT_PRESET.position, ...DEFAULT_PRESET.target, false)
  }, [controls])
  return null
}

interface SceneProps {
  controlsRef: RefObject<CameraControls | null>
  onStageError: (error: Error) => void
}

export function Scene({ controlsRef, onStageError }: SceneProps) {
  const selectFlat = useFlatsUiStore((s) => s.select)
  return (
    // Clicking empty space (or the stage outside measure mode) deselects
    <Canvas camera={{ fov: 50 }} onPointerMissed={() => selectFlat(null)}>
      <color attach="background" args={['#121212']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={2} />
      <MeasureTarget>
        <ErrorBoundary onError={onStageError}>
          <Suspense fallback={null}>
            {/* BVH keeps raycasts against the dense scan mesh fast enough for pointer-move */}
            <Bvh firstHitOnly>
              <Stage />
            </Bvh>
          </Suspense>
        </ErrorBoundary>
        <Flats />
      </MeasureTarget>
      <Measurements />
      <CameraControls ref={controlsRef} makeDefault />
      <InitialView />
    </Canvas>
  )
}
