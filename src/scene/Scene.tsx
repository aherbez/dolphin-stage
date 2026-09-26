import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Grid, OrbitControls } from '@react-three/drei'
import type { Mesh } from 'three'

function SpinningBox({ spinning }: { spinning: boolean }) {
  const ref = useRef<Mesh>(null)
  useFrame((_, delta) => {
    if (spinning && ref.current) ref.current.rotation.y += delta
  })
  return (
    <mesh ref={ref} position={[0, 0.5, 0]} castShadow>
      <boxGeometry />
      <meshStandardMaterial color="#4fc3f7" />
    </mesh>
  )
}

export function Scene({ spinning }: { spinning: boolean }) {
  return (
    <Canvas shadows camera={{ position: [3, 2, 4], fov: 50 }}>
      <color attach="background" args={['#121212']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={2} castShadow />
      <SpinningBox spinning={spinning} />
      <Grid infiniteGrid sectionColor="#444" cellColor="#2a2a2a" fadeDistance={30} />
      <OrbitControls makeDefault />
    </Canvas>
  )
}
