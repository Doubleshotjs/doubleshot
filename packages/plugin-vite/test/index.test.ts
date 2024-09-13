import path from 'node:path'
import { execa } from '@esm2cjs/execa'
import fs from 'fs-extra'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const mockDir = path.resolve(__dirname, './mock')

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
  fs.removeSync(path.resolve(mockDir, 'dist'))
}

async function run(mode: 'dev' | 'build') {
  const { stdout, stderr } = await execa(
    'npm',
    ['run', mode],
    {
      cwd: mockDir,
    },
  )

  const logs = stdout + stderr
  return logs
}

beforeAll(async () => {
  remove()
  await installDeps(mockDir)
}, 10 * 60 * 1000)

afterAll(() => {
  remove()
})

describe('doubleshot Vite Plugin', () => {
  it('should run dev mode', async () => {
    const logs = await run('dev')

    expect(logs).toContain('Development')
  })

  describe('plugin\'s config should be overridden by `configureForMode`', async () => {
    it('should match snapshot in development mode', async () => {
      const devLogs = await run('dev')
      const devResult = fs.readFileSync(path.resolve(mockDir, 'dist/main/index.js'), 'utf8')
      expect(devLogs).toContain('override config for development')
      expect(devResult).toMatchSnapshot()
    })

    it('should match snapshot in production mode', async () => {
      const prodLogs = await run('build')
      const prodResult = fs.readFileSync(path.resolve(mockDir, 'dist/main/index.js'), 'utf8')
      expect(prodLogs).toContain('override config for production')
      expect(prodResult).toMatchSnapshot()
    })
  })

  it('should also inject preload', async () => {
    const logs = await run('dev')

    expect(logs).toContain('hello, this is a msg through preload file')
  })

  it('should build electron app if "electron.build" is set', async () => {
    const logs = await run('build')

    expect(logs).toContain('Start electron build')
    expect(logs).toContain('Build succeeded')
    expect(fs.existsSync(path.resolve(mockDir, 'dist/electron'))).toBe(true)
  }, 10 * 60 * 1000)
})
