const { join } = require('node:path')

const resolve = path => join(__dirname, path)

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  productName: 'Doubleshot App Test',
  directories: {
    output: resolve('dist'),
  },
  files: [
    {
      from: resolve('backend'),
      to: '.',
    },
    {
      from: resolve('frontend'),
      to: '.',
      filter: ['!*.json'],
    },
  ],
  win: {
    target: 'dir',
  },
  mac: {
    target: 'dir',
    identity: null,
  },
  linux: {
    target: 'dir',
  },
}

module.exports = config
