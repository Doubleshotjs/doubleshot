import path from 'path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execa } from 'execa'
import fs from 'fs-extra'
const mockDir = path.resolve(__dirname, './mock')

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
  fs.removeSync(path.resolve(mockDir, 'dist'))
}

const run = async (mode: 'dev' | 'build') => {
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
}, Infinity)

afterAll(() => {
  remove()
})

describe('Doubleshot Vite Plugin', () => {
  it('should run dev mode', async () => {
    const logs = await run('dev')

    expect(logs).toContain('Development')
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
