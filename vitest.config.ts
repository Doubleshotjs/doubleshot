import type { TestUserConfig } from 'vitest/node'

const config: { test: TestUserConfig } = {
  // 禁止并行测试
  test: {
    testTimeout: 50000,
    pool: 'threads',
  },
}

export default config
