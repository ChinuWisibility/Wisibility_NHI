import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import svgr from 'vite-plugin-svgr'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [react(), tsconfigPaths(), svgr(), visualizer({ open: false })],
  resolve: { alias: { '@': '/src' } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor'
          if (id.includes('recharts') || id.includes('@nivo/')) return 'charts'
          if (id.includes('@azure/msal-browser') || id.includes('@azure/msal-react')) return 'azure'
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
