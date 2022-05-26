/**
 * @type {import('eslint').Linter.Config}
 * @see https://eslint.org/docs/user-guide/configuring/
 */
const config = {
  extends: '@antfu',
  rules: {
    "@typescript-eslint/ban-ts-comment": "off"
  },
  overrides: [
    {
      files: ['packages/create-doubleshot/index.js', 'packages/runner/**/*.ts'],
      rules: {
        'no-console': 'off'
      }
    },
  ],
}

module.exports = config
