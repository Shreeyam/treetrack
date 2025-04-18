import { defineConfig } from 'vite'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react'

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
    build: {
      sourcemap: true,
      minify: false, // don't minify for easier debugging
    }
  });
  