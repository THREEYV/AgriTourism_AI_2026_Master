import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 忽略编辑器原子写入时产生的临时目录/文件，避免 Vite 监听触发 EBUSY 崩溃
export default defineConfig({
  plugins: [vue()],
  server: {
    watch: {
      ignored: ['**/.*.tmpdir/**', '**/*.tmp', '**/.verify-build/**', '**/_backup_*/**']
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        readme: 'dist/README.html'
      }
    }
  }
})
