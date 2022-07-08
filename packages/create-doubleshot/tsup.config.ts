import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'creator',
  target: 'node14',
  clean: true,
  splitting: true,
  entry: ['src/cli.ts'],
  dts: false,
})
