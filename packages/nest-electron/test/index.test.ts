import path from 'path'
import { beforeAll, describe, expect, it, test } from 'vitest'
import { execa } from 'execa'

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

  it('should inject ElectronService', async () => {
    expect(logs).toContain('ElectronService injected successfully')
  })

  test('ElectronService.getWindow()', async () => {
    expect(logs).toContain('"ElectronService.getWindow()" should return a BrowserWindow: true')
  })

  test('ElectronService.getWebContents()', async () => {
    expect(logs).toContain('"ElectronService.getWebContents()" should return a WebContents: true')
  })

  it('should receive message from frontend', async () => {
    expect(logs).toContain('Get message from frontend: This is a message to backend')
  })

  it('should print log from frontend if frontend got reply', async () => {
    expect(logs).toContain('Get log: This is a message to frontend')
  })

  it('should exit electron invoked by frontend', async () => {
    expect(logs).toContain('Electron exiting...')
  })
})
