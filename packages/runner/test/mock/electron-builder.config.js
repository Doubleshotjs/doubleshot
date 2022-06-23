const { join } = require('path')

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
  electronDownload: {
    mirror: 'https://npm.taobao.org/mirrors/electron/',
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
}

module.exports = config
