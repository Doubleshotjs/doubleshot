/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  directories: {
    output: 'dist/electron',
  },
  publish: null,
  npmRebuild: false,
  buildDependenciesFromSource: true,
  electronDownload: {
    mirror: 'https://npm.taobao.org/mirrors/electron/',
  },
  files: [
    'dist/main/**/*',
    'dist/renderer/**/*',
  ],
  win: {
    target: 'dir',
  },
  mac: {
    target: 'dir',
  },
  linux: {
    target: 'dir',
  },
}

module.exports = config
