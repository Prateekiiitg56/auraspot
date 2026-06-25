import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - separated for better caching
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'firebase-auth': ['firebase/auth'],
          'firebase-app': ['firebase/app'],
          'leaflet': ['leaflet'],
        }
      }
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Increase chunk size warning limit (we're manually splitting)
    chunkSizeWarningLimit: 600,
  },
})
