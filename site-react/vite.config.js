import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Allow Vite to serve files from the parent repo root (images folder)
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // allow parent repo root and the assets/webfonts folder explicitly
      allow: [
        path.resolve(__dirname, '..'),
        path.resolve(__dirname, '..', 'assets'),
        path.resolve(__dirname, '..', 'assets', 'webfonts')
      ]
    }
  }
})
