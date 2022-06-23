import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'builder',
  target: 'node14',
  clean: true,
  splitting: true,
  entry: ['src/index.ts', 'src/cli.ts'],
  dts: {
    resolve: true,
    entry: 'src/index.ts',
  },
})
