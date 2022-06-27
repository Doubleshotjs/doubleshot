import path from 'path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Options as ExecaOptions } from 'execa'
import { execa } from 'execa'
import fs from 'fs-extra'
import type { AppType, DoubleShotBuilderConfigExport } from '../src'

const bin = path.resolve(__dirname, '../dist/cli.js')
const mockDir = path.resolve(__dirname, './mock')
const configFile = path.resolve(mockDir, 'dsb.config.ts')

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

const createHtmlFile = () => {
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

beforeAll(async () => {
  remove()
  await installDeps(mockDir)
}, Infinity)

afterAll(() => {
  remove()
})

describe('Doubleshot Builder', () => {
  it('should run electron process when app type is electron under dev mode', async () => {
    writeConfigFile({
      main: 'dist/main.js',
      entry: ['./src/main.ts'],
      outDir: './dist',
      external: ['electron'],
    })

    createHtmlFile()

    const logs = await run('dev', 'electron')

    expect(logs).toContain('Run main file')
    expect(logs).toContain('Main process exit')
  })
})
