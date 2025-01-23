import path from 'node:path'
import { execa } from '@esm2cjs/execa'
import { describe, expect, it } from 'vitest'

const mockDir = path.resolve(__dirname, './hybrid')
const mockDist = path.resolve(mockDir, 'dist')

async function buildMock() {
  const { stdout, stderr } = await execa(
    'tsup',
    {
      cwd: mockDir,
    },
  )

  const logs = stdout + stderr
  return logs
}

async function runElectron() {
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

async function runNode() {
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

describe('doubleshot Nest Electron Module: Hybrid Application', async () => {
  await buildMock()

  describe('electron with Node Backend', async () => {
    const logs = await runElectron()

    it('should run application', () => {
      expect(logs).toContain('Electron hybrid application is running')
    })

    it('@Window', () => {
      expect(logs).toContain('Inject BrowserWindow successfully')
    })

    it('@IpcHandle', () => {
      expect(logs).toContain('Get ipc data from frontend: send ipc data to backend')
    })

    it('@IpcOn', () => {
      expect(logs).toContain('Get ipc log: Main process received data from frontend')
    })

    it('@Post', () => {
      expect(logs).toContain('Get http data from frontend: send http data to backend')
    })

    it('@Get', () => {
      expect(logs).toContain('Get http log: Main process received data from frontend')
    })

    it('electron exit', () => {
      expect(logs).toContain('Electron exiting...')
    })
  })

  describe('node Backend', async () => {
    const logs = await runNode()

    it('should run application', () => {
      expect(logs).toContain('Single node backend is running')
      expect(logs).toContain('Not in Electron environment')
    })

    it('@Window not work', () => {
      expect(logs).not.toContain('Inject BrowserWindow successfully')
    })

    it('@Window for multiple windows not work', () => {
      expect(logs).not.toContain('Inject another BrowserWindow successfully')
      expect(logs).not.toContain('Get ipc log: This is an another window')
    })

    it('@Post still work', () => {
      expect(logs).toContain('Get http data from frontend: send http data to backend')
    })

    it('@Get still work', () => {
      expect(logs).toContain('Get http log: Main process received data from frontend')
    })

    it('node process exit', () => {
      expect(logs).toContain('Node exiting...')
    })
  })
}, 60 * 1000)
