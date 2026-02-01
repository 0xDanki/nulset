import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@scripts': path.resolve(__dirname, '../scripts/src'),
      // Polyfills for Node.js modules in browser
      buffer: 'buffer',
      stream: 'stream-browserify',
      util: 'util'
    }
  },
  define: {
    // Define global for browser
    global: 'globalThis',
    'process.env': {}
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      }
    }
  },
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      plugins: []
    }
  }
})
