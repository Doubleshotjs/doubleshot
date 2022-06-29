import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'nest-electron-test',
  target: 'node14',
  clean: true,
  splitting: true,
  entry: ['src/main.ts'],
  external: ['electron', '@nestjs', '../../../dist'],
})
