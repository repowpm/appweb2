import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    hmr: {
      port: 3000,
      host: 'localhost'
    },
    // Descomente las siguientes líneas si necesita HTTPS
    // https: true,
    // https: {
    //   key: './localhost-key.pem',
    //   cert: './localhost.pem',
    // },
  },
  define: {
    global: 'globalThis',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  optimizeDeps: {
    exclude: ['web-serial-polyfill']
  }
})
