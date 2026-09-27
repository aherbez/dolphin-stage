import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves project sites from /<repo-name>/
  base: command === 'build' ? '/dolphin-stage/' : '/',
  // three.js + three-mesh-bvh are ~1 MB minified
  build: { chunkSizeWarningLimit: 2000 },
}))
