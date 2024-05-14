import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execa } from '@esm2cjs/execa'
import fs from 'fs-extra'
import type { DoubleShotRunnerConfigExport, RunConfig } from '../src'

const bin = path.resolve(__dirname, '../dist/cli.js')
const mockDir = path.resolve(__dirname, './mock')
const configFile = path.resolve(mockDir, 'dsr.config.ts')

function changeConfigToString(config: DoubleShotRunnerConfigExport) {
  return JSON.stringify(config, (_, value) => {
    if (typeof value === 'function')
      return `[FUNCTION]${value}`

    return value
  }).replace(/"(\[FUNCTION\])?((?:\\.|[^\\"])*)"(:)?/g, (match, group1, group2, group3) => {
    if (group1)
      return JSON.parse(`"${group2}"`)
    if (group3 && /^\w+$/.test(group2))
      return `${group2}:`
    return match
  })
}

function writeConfigFile(config: DoubleShotRunnerConfigExport) {
  const configContent = `
    import { defineConfig } from "../../src"
    export default defineConfig(${changeConfigToString(config)})
  `
  fs.writeFileSync(configFile, configContent)
}

function getBeforeRunNodeFile(ext: 'js' | 'cjs' | 'mjs' | 'ts') {
  const file = `beforeRun.${ext}`
  return path.resolve(mockDir, file)
}

function removeBeforeRunNodeFile() {
  const exts = ['js', 'cjs', 'mjs', 'ts']
  exts.forEach((ext) => {
    const file = getBeforeRunNodeFile(ext as any)
    fs.existsSync(file) && fs.removeSync(file)
  })
}

async function installDeps(cwd: string) {
  const { stdout, stderr } = await execa(
    'pnpm',
    ['install', '--no-lockfile', '--ignore-workspace'],
    {
      cwd,
    },
  )

  const logs = stdout + stderr
  return logs
}

function remove() {
  fs.removeSync(configFile)
  removeBeforeRunNodeFile()
  fs.removeSync(path.resolve(mockDir, 'dist'))
}

async function run(command: string) {
  const { stdout, stderr } = await execa(
    bin,
    [command],
    {
      cwd: mockDir,
    },
  )

  const logs = stdout + stderr
  return logs
}

beforeAll(async () => {
  remove()
  await installDeps(path.resolve(mockDir, 'backend'))
}, 10 * 60 * 1000)

afterAll(() => {
  remove()
})

const runBuildConfig: RunConfig[] = [
  {
    name: 'frontend',
    cwd: 'frontend',
    commands: {
      build: 'npm run build',
    },
  },
  {
    name: 'backend',
    cwd: 'backend',
    commands: {
      build: 'npm run build',
    },
  },
  {
    name: 'example1',
    cwd: 'example1',
    commands: {
      build: 'npm run build',
    },
  },
  {
    name: 'example2',
    cwd: 'example2',
    commands: {
      build:
        `
          npm run build &&
          echo "example2 build finished"
        `,
    },
  },
]

describe('doubleshot Runner', () => {
  it('should run all commands', async () => {
    writeConfigFile({
      run: [...runBuildConfig],
    })

    const logs = await run('build')

    expect(logs).toContain('build frontend')
    expect(logs).toContain('build backend')
    expect(logs).toContain('build example1')
    expect(logs).toContain('build example2')
  })

  it('should run commands by alias', async () => {
    writeConfigFile({
      run: [
        {
          cwd: 'frontend',
          commands: {
            dev: 'npm run dev',
          },
        },
        {
          cwd: 'backend',
          commands: {
            build: {
              alias: 'dev',
              command: 'npm run build',
            },
          },
        },
      ],
    })

    const logs = await run('dev')

    expect(logs).toContain('run frontend in dev mode')
    expect(logs).toContain('build backend')
  })

  it('should support multi-format line command', async () => {
    writeConfigFile({
      run: [...runBuildConfig],
    })

    const logs = await run('build')
    expect(logs).toContain('example2 build finished')
  })

  it('should throw error if no config file', async () => {
    try {
      fs.removeSync(configFile)
      await run('build')
    }
    catch (e) {
      expect(e.message).toContain('doubleshot runner needs a config file')
    }
  })

  it('should kill others if some one is set "killOthersWhenExit: true" and run failed', async () => {
    writeConfigFile({
      run: [
        {
          cwd: 'frontend',
          commands: {
            build: {
              command: 'npm run not-exist',
              killOthersWhenExit: true,
            },
          },
        },
        {
          cwd: 'backend',
          commands: {
            build: 'npm run build',
          },
        },
      ],
    })

    let logs = ''
    try {
      logs = await run('build')
    }
    catch (e) {
      logs = e.message
    }

    expect(logs).toContain('killing others')
  })

  it('should skip the specified filter names', async () => {
    writeConfigFile({
      run: [...runBuildConfig],
      filter: ['backend', 'example1'],
    })

    const logs = await run('build')
    expect(logs).toContain('build frontend')
    expect(logs).toContain('build example2')
    expect(logs).not.toContain('build backend')
    expect(logs).not.toContain('build example1')
  })

  it('should only run special name', async () => {
    writeConfigFile({
      run: [...runBuildConfig],
      only: 'frontend',
    })

    const logs = await run('build')
    expect(logs).toContain('build frontend')
    expect(logs).not.toContain('build backend')
    expect(logs).not.toContain('build example')
  })

  it('should only run special names in `only` config array', async () => {
    writeConfigFile({
      run: [...runBuildConfig],
      only: ['frontend', 'backend'],
    })

    const logs = await run('build')
    expect(logs).toContain('build frontend')
    expect(logs).toContain('build backend')
    expect(logs).not.toContain('build example')
  })

  it('should use "only" config first then "filter" config', async () => {
    writeConfigFile({
      run: [...runBuildConfig],
      only: 'frontend',
      filter: ['frontend', 'backend', 'example1'],
    })

    const logs = await run('build')
    expect(logs).toContain('build frontend')
    expect(logs).not.toContain('build backend')
    expect(logs).not.toContain('build example')
  })

  it('should run electron build if "electronBuild" config is set', async () => {
    writeConfigFile({
      run: [
        {
          cwd: 'frontend',
          commands: {
            build: 'npm run build',
          },
        },
        {
          cwd: 'backend',
          commands: {
            build: 'npm run build',
          },
        },
      ],
      electronBuild: {
        projectDir: 'backend',
        commandName: 'build',
        config: 'electron-builder.config.js',
      },
    })

    const logs = await run('build')

    expect(logs).toContain('Electron build finished')
    expect(fs.existsSync(path.resolve(mockDir, 'dist'))).toBe(true)
  }, 10 * 60 * 1000)

  it('should run "beforeRun" function hook before command', async () => {
    writeConfigFile({
      run: [
        {
          name: 'frontend',
          cwd: 'frontend',
          commands: {
            build: 'npm run build',
          },
        },
        {
          name: 'backend',
          cwd: 'backend',
          commands: {
            build: {
              command: 'npm run build',
              beforeRun: () => {
                console.log('this is a beforeRun function type hook')
                return true
              },
            },
          },
        },
      ],
    })

    const logs = await run('build')

    expect(logs).toContain('this is a beforeRun function type hook')
  })

  it('should break running if "beforeRun" function hook return false and this command set killOthersWhenExit=true', async () => {
    writeConfigFile({
      run: [
        {
          name: 'frontend',
          cwd: 'frontend',
          commands: {
            build: 'npm run build',
          },
        },
        {
          name: 'backend',
          cwd: 'backend',
          commands: {
            build: {
              command: 'npm run build',
              killOthersWhenExit: true,
              beforeRun: () => {
                console.log('this is a beforeRun function type hook')
                return false
              },
            },
          },
        },
      ],
    })

    const logs = await run('build')

    expect(logs).toContain('this is a beforeRun function type hook')
    expect(logs).toContain('next commands will not be executed')
    expect(logs).not.toContain('build backend')
    expect(logs).not.toContain('build frontend')
  })

  it('should run "beforeRun" command hook before command', async () => {
    writeConfigFile({
      run: [
        {
          name: 'frontend',
          cwd: 'frontend',
          commands: {
            build: 'npm run build',
          },
        },
        {
          name: 'backend',
          cwd: 'backend',
          commands: {
            build: {
              command: 'npm run build',
              beforeRun: {
                cwd: mockDir,
                type: 'command',
                hook: `
                  echo "this is a beforeRun command type hook" && \
                  echo "this is a beforeRun command type hook with multi-line"
                `,
              },
            },
          },
        },
      ],
    })

    const logs = await run('build')

    expect(logs).toContain('this is a beforeRun command type hook')
    expect(logs).toContain('this is a beforeRun command type hook with multi-line')
  })

  it('should break running if "beforeRun" command hook failed and this command set killOthersWhenExit=true', async () => {
    writeConfigFile({
      run: [
        {
          name: 'frontend',
          cwd: 'frontend',
          commands: {
            build: 'npm run build',
          },
        },
        {
          name: 'backend',
          cwd: 'backend',
          commands: {
            build: {
              command: 'npm run build',
              killOthersWhenExit: true,
              beforeRun: {
                cwd: mockDir,
                type: 'command',
                hook: 'npm run not-exist',
              },
            },
          },
        },
      ],
    })

    const logs = await run('build')

    expect(logs).toContain('beforeRun hook failed, next commands will not be executed')
  })

  it('should run "beforeRun" node-file hook before command', async () => {
    const beforeRunNodeFile = getBeforeRunNodeFile('ts')
    fs.writeFileSync(beforeRunNodeFile, `
      import path from 'node:path'
      const hookPath = path.resolve(process.cwd(), 'beforeRun.ts')
      console.log(\`this is a beforeRun node-file type hook, hookPath: \${hookPath}\`)
    `)

    writeConfigFile({
      run: [
        {
          name: 'frontend',
          cwd: 'frontend',
          commands: {
            build: 'npm run build',
          },
        },
        {
          name: 'backend',
          cwd: 'backend',
          commands: {
            build: {
              command: 'npm run build',
              beforeRun: {
                cwd: mockDir,
                type: 'node-file',
                hook: beforeRunNodeFile,
              },
            },
          },
        },
      ],
    })

    const logs = await run('build')

    const hookPath = path.resolve(mockDir, 'beforeRun.ts')
    expect(logs).toContain(`this is a beforeRun node-file type hook, hookPath: ${hookPath}`)
  })

  it('should break running if "beforeRun" node-file hook failed and this command set killOthersWhenExit=true', async () => {
    const beforeRunNodeFile = getBeforeRunNodeFile('ts')
    fs.writeFileSync(beforeRunNodeFile, `
      import path from 'node:path'
      const hookPath = path.resolve(process.cwd(), 'beforeRun.ts')
      console.log(\`this is a beforeRun node-file type hook, hookPath: \${hookPath}\`)
      throw new Error('beforeRun node-file hook failed')
    `)

    writeConfigFile({
      run: [
        {
          name: 'frontend',
          cwd: 'frontend',
          commands: {
            build: 'npm run build',
          },
        },
        {
          name: 'backend',
          cwd: 'backend',
          commands: {
            build: {
              command: 'npm run build',
              killOthersWhenExit: true,
              beforeRun: {
                cwd: mockDir,
                type: 'node-file',
                hook: beforeRunNodeFile,
              },
            },
          },
        },
      ],
    })

    const logs = await run('build')

    expect(logs).toContain('beforeRun hook failed, next commands will not be executed')
  })
})
