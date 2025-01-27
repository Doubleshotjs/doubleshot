import lightwing from '@lightwing/eslint-config'

export default lightwing(
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
    rules: {
      'ts/no-unused-expressions': 'off',
    },
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
  {
    files: [
      'packages/**/test/**/*.ts',
    ],
    rules: {
      'antfu/no-import-dist': 'off',
    },
  },
)
