import { useGLTF } from "@react-three/drei";

export const STAGE_URL = `${import.meta.env.BASE_URL}models/stage.glb`;

export function Stage() {
  const { scene } = useGLTF(STAGE_URL);
  return <primitive object={scene} />;
}

useGLTF.preload(STAGE_URL);
