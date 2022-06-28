import path from 'path'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Options as ExecaOptions } from 'execa'
import { execa } from 'execa'
import fs from 'fs-extra'
import type { AppType, DoubleShotBuilderConfigExport } from '../src'

const bin = path.resolve(__dirname, '../dist/cli.js')
const mockDir = path.resolve(__dirname, './mock')
const configFile = path.resolve(mockDir, 'dsb.config.ts')
const DEFAULT_CONFIG: DoubleShotBuilderConfigExport = {
  main: 'dist/main.js',
  entry: ['./src/main.ts'],
  outDir: './dist',
  external: ['electron'],
}

const writeConfigFile = (_config: DoubleShotBuilderConfigExport) => {
  // must close tsup config, or it will find parent directory
  const config = {
    ..._config,
    tsupConfig: {
      config: false,
    },
  }

  const configContent = `
    import { defineConfig } from "../../src"
    export default defineConfig(${JSON.stringify(config)})
  `
  fs.writeFileSync(configFile, configContent)
}

const checkOrCreateHtmlFile = () => {
  if (fs.existsSync(path.resolve(mockDir, 'index.html')))
    return

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">

    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Doubleshot Builder Test</title>
    </head>

    <body>
      <h1>Doubleshot Builder Test</h1>
    </body>

    </html>
  `

  fs.writeFileSync(path.resolve(mockDir, 'index.html'), htmlContent)
}

const installDeps = async (cwd: string) => {
  const { stdout, stderr } = await execa(
    'npm',
    ['install', '--package-lock=false'],
    {
      cwd,
    },
  )

  const logs = stdout + stderr
  return logs
}

const remove = () => {
  fs.removeSync(configFile)
  fs.removeSync(path.resolve(mockDir, 'dist'))
  fs.removeSync(path.resolve(mockDir, 'index.html'))
}

const run = async (command: 'dev' | 'build', appType: AppType, options: ExecaOptions = {}) => {
  const { stdout, stderr } = await execa(
    bin,
    [command, '-t', appType],
    {
      cwd: mockDir,
      ...options,
    },
  )

  const logs = stdout + stderr
  return logs
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

beforeAll(async () => {
  remove()
  await installDeps(mockDir)
}, Infinity)

beforeEach(() => {
  checkOrCreateHtmlFile()
})

afterAll(() => {
  remove()
})

describe('Doubleshot Builder: Dev Mode', () => {
  it('should run electron process when app type is electron', async () => {
    writeConfigFile({
      ...DEFAULT_CONFIG,
    })

    const logs = await run('dev', 'electron')

    expect(logs).toContain('Run main file')
    expect(logs).toContain('This is electron app')
    expect(logs).toContain('Main process exit')
  })

  it('should run node process when app type is node', async () => {
    writeConfigFile({
      ...DEFAULT_CONFIG,
    })

    const logs = await run('dev', 'node')

    expect(logs).toContain('Run main file')
    expect(logs).toContain('This is node app')
    expect(logs).toContain('Main process exit')
  })

  it('should wait for renderer process before main process', async () => {
    writeConfigFile({
      ...DEFAULT_CONFIG,
      electron: {
        waitForRenderer: true,
        rendererUrl: `file://${path.resolve(mockDir, 'index.html')}`,
      },
    })

    fs.removeSync(path.resolve(mockDir, 'index.html'))

    let logs = ''
    await Promise.all([
      (async () => {
        await sleep(2000)
        checkOrCreateHtmlFile()
      })(),
      (async () => {
        logs = await run('dev', 'electron')
      })(),
    ])

    expect(logs).toContain('Run main file')
    expect(logs).toContain('Wait for renderer')
    expect(logs).toContain('Main process exit')
  })

  it('should exit and throw error when renderer process not start in time', async () => {
    writeConfigFile({
      ...DEFAULT_CONFIG,
      electron: {
        waitTimeout: 2000,
        waitForRenderer: true,
        rendererUrl: `file://${path.resolve(mockDir, 'index.html')}`,
      },
    })

    fs.removeSync(path.resolve(mockDir, 'index.html'))

    try {
      await run('dev', 'electron')
    }
    catch (error) {
      expect(error.message).toContain('Timed out waiting for')
    }
  })
})

describe('Doubleshot Builder: Build Mode', () => {
  it('should build source files', async () => {
    writeConfigFile({
      ...DEFAULT_CONFIG,
    })

    const logs = await run('build', 'electron')

    expect(logs).toContain('Build succeeded')
    expect(fs.existsSync(path.resolve(mockDir, 'dist/main.js'))).toBe(true)
  })

  it('should build preload source file', async () => {
    writeConfigFile({
      ...DEFAULT_CONFIG,
      electron: {
        preload: {
          entry: ['./src/preload.ts'],
        },
      },
    })

    const logs = await run('build', 'electron')

    expect(logs).toContain('Build succeeded')
    expect(fs.existsSync(path.resolve(mockDir, 'dist/preload.js'))).toBe(true)
  })

  it('should build electron app if "electron.build" is set', async () => {
    writeConfigFile({
      ...DEFAULT_CONFIG,
      electron: {
        build: {
          config: 'electron-builder.config.js',
        },
      },
    })

    const logs = await run('build', 'electron')

    expect(logs).toContain('Start electron build')
    expect(logs).toContain('Build succeeded')
    expect(fs.existsSync(path.resolve(mockDir, 'dist/electron'))).toBe(true)
  }, 10 * 60 * 1000)
})
