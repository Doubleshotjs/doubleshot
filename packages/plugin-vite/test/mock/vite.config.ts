import { defineConfig } from 'vite'
import { VitePluginDoubleshot } from '../../dist'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 12345,
  },
  plugins: [
    VitePluginDoubleshot({
      type: 'electron',
      main: 'dist/main/index.js',
      entry: 'src/index.ts',
      outDir: 'dist/main',
      external: ['electron'],
      configureForMode(userConfig, mode) {
        if (mode === 'production') {
          console.log('override config for production')
          userConfig.tsupConfig = {
            minifyWhitespace: true,
          }
        }
        else {
          console.log('override config for development')
          userConfig.tsupConfig = {
            minifyWhitespace: false,
          }
        }
      },
      electron: {
        build: {
          config: './electron-builder.config.js',
        },
        preload: {
          entry: 'src/preload.ts',
        },
      },
    }) as any,
  ],
  build: {
    outDir: 'dist/renderer',
  },
})
