import { defineConfig } from 'vite'
import { VitePluginDoubleshot } from '../../dist'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VitePluginDoubleshot({
      type: 'electron',
      main: 'dist/main/index.js',
      entry: 'src/index.ts',
      outDir: 'dist/main',
      external: ['electron'],
      electron: {
        build: {
          config: './electron-builder.config.js',
        },
        preload: {
          entry: 'src/preload.ts',
        },
      },
    }),
  ],
  build: {
    outDir: 'dist/renderer',
  },
})
