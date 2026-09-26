import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves project sites from /<repo-name>/
  base: command === 'build' ? '/dolphin-stage/' : '/',
  // three.js alone is ~700 kB minified
  build: { chunkSizeWarningLimit: 1500 },
}))
