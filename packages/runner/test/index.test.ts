import path from 'path'
import { afterAll, expect, it } from 'vitest'
import { execa } from 'execa'
import fs from 'fs-extra'
import type { DoubleShotRunnerConfigExport } from '../node'

const bin = path.resolve(__dirname, '../bin/dsr.js')
const mockDir = path.resolve(__dirname, './mock')
const configFile = path.resolve(mockDir, 'dsr.config.ts')

const writeConfigFile = (config: DoubleShotRunnerConfigExport) => {
  const configContent = `
    import { defineConfig } from "../../node"
    export default defineConfig(${JSON.stringify(config)})
  `
  fs.writeFileSync(configFile, configContent)
}

const removeConfigFile = () => fs.removeSync(configFile)

const run = async () => {
  const { stdout, stderr } = await execa(
    bin,
    ['build'],
    {
      cwd: mockDir,
    },
  )

  const logs = stdout + stderr
  return logs
}

afterAll(() => {
  removeConfigFile()
})

it('should run all commands', async () => {
  writeConfigFile({
    run: [
      {
        cwd: 'pkg1',
        commands: {
          build: 'npm run build',
        },
      },
      {
        cwd: 'pkg2',
        commands: {
          build: 'npm run build',
        },
      },
    ],
  })

  const logs = await run()

  expect(logs).toContain('build pkg1')
  expect(logs).toContain('build pkg2')
})

it('should throw error if no config file', async () => {
  try {
    removeConfigFile()
    await run()
  }
  catch (e) {
    expect(e.message).toContain('doubleshot runner needs a config file')
  }
})

it('should kill others if some one is set "killOthersWhenExit: true"', async () => {
  writeConfigFile({
    run: [
      {
        cwd: 'pkg1',
        commands: {
          build: {
            command: 'npm run not-exist',
            killOthersWhenExit: true,
          },
        },
      },
      {
        cwd: 'pkg2',
        commands: {
          build: 'npm run build',
        },
      },
    ],
  })

  const logs = await run()

  expect(logs).toContain('killing others')
})
