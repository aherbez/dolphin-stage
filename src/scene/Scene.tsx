import { Component, Suspense, useEffect, type ReactNode, type RefObject } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import { Stage } from './Stage.tsx'
import { DEFAULT_PRESET } from './cameraPresets.ts'

class LoadErrorBoundary extends Component<
  { onError: (error: Error) => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    this.props.onError(error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

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
  return (
    <Canvas camera={{ fov: 50 }}>
      <color attach="background" args={['#121212']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={2} />
      <LoadErrorBoundary onError={onStageError}>
        <Suspense fallback={null}>
          <Stage />
        </Suspense>
      </LoadErrorBoundary>
      <CameraControls ref={controlsRef} makeDefault />
      <InitialView />
    </Canvas>
  )
}
