import { defineConfig } from 'vite'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  define: {
    BUILD_DATE: JSON.stringify(new Date().toISOString().slice(0, 10))
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
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