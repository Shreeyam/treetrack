import { defineConfig } from 'vite'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react'

export default defineConfig({
    build: {
      sourcemap: true,
      minify: false, // don't minify for easier debugging
    }
  });
  