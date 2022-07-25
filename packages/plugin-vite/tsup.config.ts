import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'plugin-vite',
  target: 'node14',
  format: ['cjs', 'esm'],
  clean: true,
  entry: ['src/index.ts'],
  dts: {
    resolve: true,
    entry: 'src/index.ts',
  },
})
