import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 50 * 1000,
    exclude: [
      ...configDefaults.exclude,
      '.pnpm-store/**',
    ],
  },
})
