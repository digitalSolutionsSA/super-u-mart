import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // The project lives on a network share (D: -> \\Server-pc\dssa), where
    // native file watching crashes Vite. Poll for changes instead.
    watch: {
      usePolling: true,
      interval: 300,
      ignored: ['**/node_modules/**', '**/dist/**', '**/.netlify/**'],
    },
  },
})
