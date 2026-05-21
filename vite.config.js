import { defineConfig } from 'vite'

export default defineConfig({
  base: '/md-code/',
  root: '.',
  build: {
    outDir: 'dist'
  }
})
