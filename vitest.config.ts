import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 50 * 1000,
    pool: 'threads',
    exclude: [
      ...configDefaults.exclude,
      '.pnpm-store/**',
    ],
  },
})
