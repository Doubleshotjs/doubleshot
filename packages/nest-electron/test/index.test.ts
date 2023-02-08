import path from 'path'
import { beforeAll, describe, expect, it, test } from 'vitest'
import { execa } from '@esm2cjs/execa'

const mockDir = path.resolve(__dirname, './mock')
const mockDist = path.resolve(mockDir, 'dist')

const buildMock = async () => {
  const { stdout, stderr } = await execa(
    'tsup',
    {
      cwd: mockDir,
    },
  )

  const logs = stdout + stderr
  return logs
}

const runElectron = async () => {
  const { stdout, stderr } = await execa(
    'npx',
    ['electron', path.resolve(mockDist, 'main.js')],
    {
      cwd: mockDir,
    },
  )

  const logs = stdout + stderr
  return logs
}

describe('Doubleshot Nest Electron Module', () => {
  let logs = ''
  beforeAll(async () => {
    await buildMock()
    logs = await runElectron()
  }, Infinity)

  it('should run electron', async () => {
    expect(logs).toContain('Electron is running')
  })

  test('@Window', async () => {
    expect(logs).toContain('Inject BrowserWindow successfully')
  })

  test('@IpcHandle', async () => {
    expect(logs).toContain('Get message from frontend: This is a message to backend')
  })

  test('@IpcOn: send args', async () => {
    expect(logs).toContain('Get log: This is a message to frontend')
  })

  test('@IpcOn', async () => {
    expect(logs).toContain('Electron exiting...')
  })

  test('@Window for multiple windows', async () => {
    expect(logs).toContain('Inject another BrowserWindow successfully')
    expect(logs).toContain('Get log: This is an another window')
  })

  it('should send multi params via the @IpcOn or @IpcHandle decorators', async () => {
    expect(logs).toContain('param1: this is a param1')
    expect(logs).toContain('param2: this is a param2')
  })

  it('should also support call functions with decorators directly', async () => {
    expect(logs).toContain('Get log: Direct call function')
  })

  it('should throw an error if an error occurs in the main process', async () => {
    expect(logs).toContain('This is an error')
  })
})
