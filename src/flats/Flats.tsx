import { Suspense, use, useRef, type ReactNode, type RefObject } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { TransformControls } from '@react-three/drei'
import { DoubleSide, type DataTexture, type Group } from 'three'
import { useMeasureStore } from '../measure/measureStore.ts'
import { useFlatsStore, useFlatsUiStore, type Flat } from './flatsStore.ts'
import { useLibraryStore, type LibraryImage } from '../images/libraryStore.ts'
import { loadImageTexture } from '../images/textures.ts'
import { ErrorBoundary } from '../scene/ErrorBoundary.tsx'

// Pointer travel (px) between down and up beyond which a click counts as an orbit drag
const DRAG_THRESHOLD = 4
const MIN_SCALE = 0.01

/** A 1×1 plane whose origin is the center of its bottom edge. */
function UnitPlane({ children }: { children: ReactNode }) {
  return (
    <mesh position={[0, 0.5, 0]}>
      <planeGeometry />
      {children}
    </mesh>
  )
}

function Placeholder() {
  return (
    <UnitPlane>
      <meshBasicMaterial color="#666" side={DoubleSide} />
    </UnitPlane>
  )
}

function TexturedPlane({ texture }: { texture: DataTexture }) {
  return (
    <UnitPlane>
      {/* Unlit so the artwork shows its true colors; alphaTest turns transparent (knocked-out) areas into hard cut-outs */}
      <meshBasicMaterial map={texture} side={DoubleSide} alphaTest={0.5} toneMapped={false} />
    </UnitPlane>
  )
}

function ImageSurface({ image }: { image: LibraryImage }) {
  return <TexturedPlane texture={use(loadImageTexture(image))} />
}

function FlatSurface({ imageId }: { imageId: string }) {
  const image = useLibraryStore((s) => s.images.find((img) => img.id === imageId))
  return image ? <ImageSurface image={image} /> : <Placeholder />
}

function FlatObject({ flat }: { flat: Flat }) {
  const groupRef = useRef<Group>(null)
  const selected = useFlatsUiStore((s) => s.selectedId === flat.id)
  const mode = useFlatsUiStore((s) => s.mode)
  const select = useFlatsUiStore((s) => s.select)
  const setDragScale = useFlatsUiStore((s) => s.setDragScale)
  const updateFlat = useFlatsStore((s) => s.updateFlat)
  // While measuring, clicks pass through to the measure tool instead of selecting
  const measuring = useMeasureStore((s) => s.placing)

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (e.delta <= DRAG_THRESHOLD) select(flat.id)
  }

  const onObjectChange = () => {
    const group = groupRef.current
    if (!group || mode !== 'scale') return
    const { scale } = group
    if (flat.aspectLocked) {
      // Keep the proportions: follow whichever handle moved furthest
      scale.setScalar(Math.max(MIN_SCALE, Math.abs(scale.x - 1) > Math.abs(scale.y - 1) ? scale.x : scale.y))
    } else {
      scale.set(Math.max(MIN_SCALE, scale.x), Math.max(MIN_SCALE, scale.y), 1)
    }
    setDragScale([scale.x, scale.y])
  }

  // Commit the gizmo's result to the store when a drag ends; scale folds into the size
  const onMouseUp = () => {
    const group = groupRef.current
    if (!group) return
    updateFlat(flat.id, {
      position: group.position.toArray(),
      rotationY: group.rotation.y,
      width: flat.width * group.scale.x,
      height: flat.height * group.scale.y,
    })
    group.scale.setScalar(1)
    setDragScale([1, 1])
  }

  return (
    <>
      <group
        ref={groupRef}
        position={flat.position}
        rotation={[0, flat.rotationY, 0]}
        onClick={measuring ? undefined : onClick}
      >
        <group scale={[flat.width, flat.height, 1]}>
          <ErrorBoundary fallback={<Placeholder />}>
            <Suspense fallback={<Placeholder />}>
              <FlatSurface imageId={flat.imageId} />
            </Suspense>
          </ErrorBoundary>
        </group>
      </group>
      {selected && !measuring && (
        <TransformControls
          object={groupRef as RefObject<Group>}
          mode={mode}
          // Flats stand upright: rotate about the vertical axis only, and scale in the plane
          showX={mode !== 'rotate'}
          showZ={mode === 'translate'}
          space={mode === 'translate' ? 'world' : 'local'}
          onObjectChange={onObjectChange}
          onMouseUp={onMouseUp}
        />
      )}
    </>
  )
}

export function Flats() {
  const flats = useFlatsStore((s) => s.flats)
  return flats.map((flat) => <FlatObject key={flat.id} flat={flat} />)
}
