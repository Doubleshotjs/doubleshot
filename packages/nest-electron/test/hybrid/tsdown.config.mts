import type { UserConfig } from 'tsdown'
import { defineConfig } from 'tsdown'

const sharedConfig = {
  format: 'cjs',
  platform: 'node',
  target: 'node14',
  fixedExtension: false,
  deps: {
    neverBundle: ['electron', /^@nestjs\//, '../../../dist'],
    onlyBundle: false as const,
  },
} satisfies Omit<UserConfig, 'entry' | 'clean'>

export default defineConfig([
  {
    ...sharedConfig,
    entry: 'src/main.ts',
    clean: true,
  },
  {
    ...sharedConfig,
    entry: 'src/preload.ts',
    clean: false,
  },
])
