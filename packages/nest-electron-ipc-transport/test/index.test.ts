import path from 'path'
import { beforeAll, describe, expect, it } from 'vitest'
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

describe('Doubleshot Nest Electron Ipc Transport', () => {
  let logs = ''
  beforeAll(async () => {
    await buildMock()
    logs = await runElectron()
  })

  it('should run electron', async () => {
    expect(logs).toContain('Electron is running')
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
