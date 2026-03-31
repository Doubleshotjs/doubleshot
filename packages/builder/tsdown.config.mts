import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: 'cjs',
  platform: 'node',
  target: 'node14',
  clean: true,
  fixedExtension: false,
  dts: true,
})
