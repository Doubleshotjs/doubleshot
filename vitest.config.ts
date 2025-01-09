import type { UserConfig } from 'vitest/node'

const config: { test: UserConfig } = {
  // 禁止并行测试
  test: {
    testTimeout: 50000,
    pool: 'threads',
  },
}

export default config
