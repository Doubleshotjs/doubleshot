import { defineConfig } from 'tsdown'

const sharedConfig = {
  entry: ['src/index.ts'],
  platform: 'node',
  target: 'node14',
}

export default defineConfig([
  {
    ...sharedConfig,
    format: 'esm',
    clean: true,
    dts: true,
    outExtensions() {
      return {
        js: '.mjs',
        dts: '.d.ts',
      }
    },
  },
  {
    ...sharedConfig,
    format: 'cjs',
    clean: false,
    dts: false,
    fixedExtension: false,
    outExtensions() {
      return {
        js: '.js',
      }
    },
  },
])
