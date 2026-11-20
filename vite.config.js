import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/AgriTourism_AI_2026_Master/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
