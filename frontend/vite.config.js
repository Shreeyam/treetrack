import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Optionally, if you need to remove `/api` from the forwarded request:
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});