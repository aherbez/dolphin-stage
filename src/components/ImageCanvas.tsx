import { useEffect, useMemo, useRef, type MouseEvent } from 'react'
import { Box, type SxProps, type Theme } from '@mui/material'
import { applyKnockout, type KnockoutSettings } from '../images/knockout.ts'

// Checkerboard behind images so transparent (knocked-out) areas are visible
const checkerboardSx: SxProps<Theme> = {
  backgroundColor: '#666',
  backgroundImage: 'conic-gradient(#555 25%, #777 0 50%, #555 0 75%, #777 0)',
  backgroundSize: '16px 16px',
}

interface ImageCanvasProps {
  source: ImageData
  knockout: KnockoutSettings
  /** Called with the source pixel coordinates of a click */
  onPixelClick?: (x: number, y: number) => void
  sx?: SxProps<Theme>
}

/** Draws `source` with the knockout applied, over a checkerboard. */
export function ImageCanvas({ source, knockout, onPixelClick, sx }: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const processed = useMemo(() => applyKnockout(source, knockout), [source, knockout])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = processed.width
    canvas.height = processed.height
    canvas.getContext('2d')!.putImageData(processed, 0, 0)
  }, [processed])

  const onClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!onPixelClick) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * source.width)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * source.height)
    onPixelClick(Math.min(x, source.width - 1), Math.min(y, source.height - 1))
  }

  return (
    <Box
      component="canvas"
      ref={canvasRef}
      onClick={onClick}
      sx={[
        checkerboardSx,
        { display: 'block', maxWidth: '100%', cursor: onPixelClick ? 'crosshair' : 'default' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  )
}
