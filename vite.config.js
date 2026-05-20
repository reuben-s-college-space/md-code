import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  base: '/md-code/',
  build: {
    outDir: 'dist'
  }
})
