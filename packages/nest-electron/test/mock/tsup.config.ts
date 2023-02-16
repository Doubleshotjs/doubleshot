import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'nest-electron-test',
  target: 'node14',
  clean: false,
  splitting: true,
  external: ['electron', '@nestjs', '../../../dist'],
})
