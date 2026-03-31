import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'cjs',
  platform: 'node',
  target: 'es2015',
  unbundle: true,
  clean: true,
  fixedExtension: false,
  dts: true,
})
