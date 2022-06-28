const { join } = require('path')

const resolve = path => join(__dirname, path)

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  productName: 'Doubleshot App Test',
  directories: {
    output: resolve('dist/electron'),
  },
  electronDownload: {
    mirror: 'https://npm.taobao.org/mirrors/electron/',
  },
  asar: false,
  files: [
    'dist/main.js',
    'package.json',
    'index.html',
  ],
}

module.exports = config
