import path from 'path'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import fs from 'fs-extra'
import { DEFAULT_CONFIG, DEFAULT_INLINE_CONFIG, checkOrCreateHtmlFile, installDeps, mockDir, remove, run, sleep, writeConfigFile } from './utils'

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

    const logs = await run('dev', ['-t', 'electron'])

    expect(logs).toContain('Run main file')
    expect(logs).toContain('This is electron app')
    expect(logs).toContain('Main process exit')
  })

  it('should run node process when app type is node', async () => {
    writeConfigFile({
      ...DEFAULT_CONFIG,
    })

    const logs = await run('dev', ['-t', 'node'])

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
        logs = await run('dev', ['-t', 'electron'])
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
      await run('dev', ['-t', 'electron'])
    }
    catch (error) {
      expect(error.message).toContain('Timed out waiting for')
    }
  })

  it('should rebuild when file changed', async () => {
    writeConfigFile({
      ...DEFAULT_CONFIG,
      tsupConfig: {
        env: {
          EXIT_TIME: '5000',
        },
      },
      electron: {
        waitTimeout: 2000,
        waitForRenderer: true,
        rendererUrl: `file://${path.resolve(mockDir, 'index.html')}`,
      },
    })

    const mainFile = path.resolve(mockDir, 'src', 'main.ts')
    const mainFileContent = fs.readFileSync(mainFile, 'utf8')

    try {
      let logs = ''
      await Promise.all([
        (async () => {
          await sleep(2000)
          fs.writeFileSync(mainFile, `${mainFileContent}\nconsole.log("modify main.ts")`)
        })(),
        (async () => {
          logs = await run('dev', ['-t', 'electron'])
        })(),
      ])

      expect(logs).toContain('Rebuild succeeded!')
      expect(logs).toContain('modify main.ts')
    }
    finally {
      fs.writeFileSync(mainFile, mainFileContent)
    }
  })
})

describe('Doubleshot Builder: Build Mode', () => {
  it('should build source files', async () => {
    writeConfigFile({
      ...DEFAULT_CONFIG,
    })

    const logs = await run('build', ['-t', 'electron'])

    expect(logs).toContain('Build succeeded')
    expect(fs.existsSync(path.resolve(mockDir, 'dist/main.js'))).toBe(true)
  })

  it('should build preload source file', async () => {
    writeConfigFile({
      ...DEFAULT_CONFIG,
      electron: {
        preload: {
          entry: './src/preload.ts',
        },
      },
    })

    const logs = await run('build', ['-t', 'electron'])

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

    const logs = await run('build', ['-t', 'electron'])

    expect(logs).toContain('Start electron build')
    expect(logs).toContain('Build succeeded')
    expect(fs.existsSync(path.resolve(mockDir, 'dist/electron'))).toBe(true)
  }, 10 * 60 * 1000)
})

describe('Doubleshot Builder, Inline Command: Dev Mode', () => {
  it('should run electron process when app type is electron', async () => {
    const logs = await run('dev', [
      '-t', 'electron',
      '-m', 'dist/main.js',
      ...DEFAULT_INLINE_CONFIG,
    ])

    expect(logs).toContain('Run main file')
    expect(logs).toContain('This is electron app')
    expect(logs).toContain('Main process exit')
  })

  it('should run node process when app type is node', async () => {
    const logs = await run('dev', [
      '-t', 'node',
      '-m', 'dist/main.js',
      ...DEFAULT_INLINE_CONFIG,
    ])

    expect(logs).toContain('Run main file')
    expect(logs).toContain('This is node app')
    expect(logs).toContain('Main process exit')
  })

  it('should wait for renderer process before main process', async () => {
    fs.removeSync(path.resolve(mockDir, 'index.html'))

    let logs = ''
    await Promise.all([
      (async () => {
        await sleep(2000)
        checkOrCreateHtmlFile()
      })(),
      (async () => {
        logs = await run('dev', [
          '-t', 'electron',
          '-m', 'dist/main.js',
          ...DEFAULT_INLINE_CONFIG,
          '--wait-for-renderer',
          '--renderer-url', `file://${path.resolve(mockDir, 'index.html')}`,
        ])
      })(),
    ])

    expect(logs).toContain('Run main file')
    expect(logs).toContain('Wait for renderer')
    expect(logs).toContain('Main process exit')
  })

  it('should exit and throw error when renderer process not start in time', async () => {
    fs.removeSync(path.resolve(mockDir, 'index.html'))

    try {
      await run('dev', [
        '-t', 'electron',
        '-m', 'dist/main.js',
        ...DEFAULT_INLINE_CONFIG,
        '--wait-for-renderer',
        '--renderer-url', `file://${path.resolve(mockDir, 'index.html')}`,
        '--wait-timeout', '2000',
      ])
    }
    catch (error) {
      expect(error.message).toContain('Timed out waiting for')
    }
  })
})

describe('Doubleshot Builder, Inline Command: Build Mode', () => {
  it('should build source files', async () => {
    const logs = await run('build', [
      '-t', 'electron',
      ...DEFAULT_INLINE_CONFIG,
    ])

    expect(logs).toContain('Build succeeded')
    expect(fs.existsSync(path.resolve(mockDir, 'dist/main.js'))).toBe(true)
  })

  it('should build preload source file', async () => {
    const logs = await run('build', [
      '-t', 'electron',
      ...DEFAULT_INLINE_CONFIG,
      '--preload', './src/preload.ts',
    ])

    expect(logs).toContain('Build succeeded')
    expect(fs.existsSync(path.resolve(mockDir, 'dist/preload.js'))).toBe(true)
  })

  it('should build electron app if "electron.build" is set', async () => {
    const logs = await run('build', [
      '-t', 'electron',
      ...DEFAULT_INLINE_CONFIG,
      '--electron-builder-config', 'electron-builder.config.js',
    ])

    expect(logs).toContain('Start electron build')
    expect(logs).toContain('Build succeeded')
    expect(fs.existsSync(path.resolve(mockDir, 'dist/electron'))).toBe(true)
  }, 10 * 60 * 1000)
})
