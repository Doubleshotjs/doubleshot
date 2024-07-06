import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'nest-electron-test',
  target: 'node14',
  clean: true,
  entry: ['src/main.ts', 'src/preload.ts'],
  external: ['electron', '@nestjs', '../../../dist'],
})
