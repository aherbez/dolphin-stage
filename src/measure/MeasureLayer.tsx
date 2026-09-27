import { useMemo, type ReactNode } from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import type { Vec3 } from '../scene/cameraPresets.ts'
import { useMeasureStore, type Measurement } from './measureStore.ts'
import { distance, formatLength } from './units.ts'
import { useSettingsStore } from '../settingsStore.ts'

const DEFAULT_COLOR = '#ffb300'
const SELECTED_COLOR = '#00e5ff'
const DOT_RADIUS = 0.03
// Pointer travel (px) between down and up beyond which a click counts as an orbit drag
const DRAG_THRESHOLD = 4
// Draw markers on top of the scan so they're never hidden inside it
const ON_TOP = 999

/** Wraps the geometry that measurements can snap to and handles the clicks. */
export function MeasureTarget({ children }: { children: ReactNode }) {
  const placing = useMeasureStore((s) => s.placing)
  const hasStart = useMeasureStore((s) => s.pendingStart !== null)
  const placePoint = useMeasureStore((s) => s.placePoint)
  const setHoverPoint = useMeasureStore((s) => s.setHoverPoint)

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    // Only the nearest hit counts
    e.stopPropagation()
    if (e.delta > DRAG_THRESHOLD) return
    placePoint(e.point.toArray())
  }

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHoverPoint(e.point.toArray())
  }

  return (
    <group
      onClick={placing ? onClick : undefined}
      onPointerMove={placing && hasStart ? onPointerMove : undefined}
    >
      {children}
    </group>
  )
}

function Dot({ position, color }: { position: Vec3; color: string }) {
  return (
    <mesh position={position} renderOrder={ON_TOP}>
      <sphereGeometry args={[DOT_RADIUS, 16, 16]} />
      <meshBasicMaterial color={color} depthTest={false} />
    </mesh>
  )
}

function Segment({ start, end, color }: { start: Vec3; end: Vec3; color: string }) {
  return (
    <Line points={[start, end]} color={color} lineWidth={2} depthTest={false} renderOrder={ON_TOP} />
  )
}

function Label({ start, end }: { start: Vec3; end: Vec3 }) {
  const units = useSettingsStore((s) => s.units)
  // By default drei's Html attaches to R3F's event target, which isn't connected until
  // after the Canvas first renders (and flips during StrictMode's effect re-runs). A label
  // mounted that early (e.g. restored on page load) gets its React root recreated
  // mid-render and loses its content. Pinning it to the canvas's parent keeps it stable.
  const gl = useThree((s) => s.gl)
  const portal = useMemo(() => ({ current: gl.domElement.parentElement! }), [gl])
  const mid: Vec3 = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2]
  return (
    <Html position={mid} center portal={portal} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          padding: '2px 6px',
          borderRadius: 4,
          font: '12px system-ui, sans-serif',
          whiteSpace: 'nowrap',
        }}
      >
        {formatLength(distance(start, end), units)}
      </div>
    </Html>
  )
}

function SavedMeasurement({ measurement, selected }: { measurement: Measurement; selected: boolean }) {
  const color = selected ? SELECTED_COLOR : DEFAULT_COLOR
  return (
    <group>
      <Dot position={measurement.start} color={color} />
      <Dot position={measurement.end} color={color} />
      <Segment start={measurement.start} end={measurement.end} color={color} />
      <Label start={measurement.start} end={measurement.end} />
    </group>
  )
}

function PendingMeasurement() {
  const start = useMeasureStore((s) => s.pendingStart)
  const hover = useMeasureStore((s) => s.hoverPoint)
  if (!start) return null
  return (
    <group>
      <Dot position={start} color={DEFAULT_COLOR} />
      {hover && (
        <>
          <Segment start={start} end={hover} color={DEFAULT_COLOR} />
          <Label start={start} end={hover} />
        </>
      )}
    </group>
  )
}

/** Renders saved measurements plus the one currently being placed. */
export function Measurements() {
  const measurements = useMeasureStore((s) => s.measurements)
  const selectedId = useMeasureStore((s) => s.selectedId)
  return (
    <>
      {measurements
        .filter((m) => m.visible)
        .map((m) => (
          <SavedMeasurement key={m.id} measurement={m} selected={m.id === selectedId} />
        ))}
      <PendingMeasurement />
    </>
  )
}
