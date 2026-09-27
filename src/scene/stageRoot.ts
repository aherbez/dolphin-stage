import { createRef } from 'react'
import type { Object3D } from 'three'

/** The loaded stage model, for raycasting against it outside of R3F events. */
export const stageRoot = createRef<Object3D>()
