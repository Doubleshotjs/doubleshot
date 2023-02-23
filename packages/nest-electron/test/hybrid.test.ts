import path from 'path'
import { beforeAll, describe, expect, it, test } from 'vitest'
import { execa } from '@esm2cjs/execa'

const mockDir = path.resolve(__dirname, './hybrid')
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

const runNode = async () => {
  const { stdout, stderr } = await execa(
    'node',
    [path.resolve(mockDist, 'main.js')],
    {
      cwd: mockDir,
    },
  )

  const logs = stdout + stderr
  return logs
}

beforeAll(async () => {
  await buildMock()
}, 60 * 1000)

describe('Doubleshot Nest Electron Module: Hybrid Application', async () => {
  let logs = ''
  logs = await runElectron()

  it('should run application', () => {
    expect(logs).toContain('Electron hybrid application is running')
  })

  test('@Window', () => {
    expect(logs).toContain('Inject BrowserWindow successfully')
  })

  describe('IPC', () => {
    test('@IpcHandle', () => {
      expect(logs).toContain('Get ipc data from frontend: send ipc data to backend')
    })

    test('@IpcOn', () => {
      expect(logs).toContain('Get ipc log: Main process received data from frontend')
    })
  })

  describe('HTTP', () => {
    test('@Post', () => {
      expect(logs).toContain('Get http data from frontend: send http data to backend')
    })

    test('@Get', () => {
      expect(logs).toContain('Get http log: Main process received data from frontend')
    })
  })

  test('electron exit', () => {
    expect(logs).toContain('Electron exiting...')
  })
})

describe('Doubleshot Nest Electron Module: Hybrid Application in node environment', async () => {
  let logs = ''
  logs = await runNode()

  it('should run application', () => {
    expect(logs).toContain('Single node backend is running')
    expect(logs).toContain('Not in Electron environment')
  })

  test('@Window not work', () => {
    expect(logs).not.toContain('Inject BrowserWindow successfully')
  })

  test('@Window for multiple windows not work', () => {
    expect(logs).not.toContain('Inject another BrowserWindow successfully')
    expect(logs).not.toContain('Get ipc log: This is an another window')
  })

  test('@Post still work', () => {
    expect(logs).toContain('Get http data from frontend: send http data to backend')
  })

  test('@Get still work', () => {
    expect(logs).toContain('Get http log: Main process received data from frontend')
  })

  test('node process exit', () => {
    expect(logs).toContain('Node exiting...')
  })
})
