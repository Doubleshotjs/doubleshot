// @ts-check
const lightwing = require('@lightwing/eslint-config').default

module.exports = lightwing(
  {
    ignores: [
      'dist',
      'node_modules',
      'coverage',
      '**/*.svelte',
      '**/*.snap',
      '**/*.d.ts',
      '**/*.md',
    ],
  },
  {
    files: [
      'packages/**/log.ts',
      'packages/**/log.ts',
      'packages/**/test/**/*.ts',
    ],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: [
      'packages/nest-electron/**/*.{ts,js}',
    ],
    rules: {
      'ts/no-var-requires': 'off',
      'no-prototype-builtins': 'off',
      'ts/no-require-imports': 'off',
    },
  },
  {
    files: [
      '.github/workflows/**/*.{yml,yaml}',
    ],
    rules: {
      'yaml/no-empty-mapping-value': 'off',
    },
  },
)
