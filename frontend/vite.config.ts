import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    https: {
      key: './certificates/localhost-key.pem',
      cert: './certificates/localhost.pem',
    },
  },
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toLocaleString()),
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['amazon-cognito-identity-js'],
  },
})
