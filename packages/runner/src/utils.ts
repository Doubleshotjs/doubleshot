import type { PS } from 'ps-tree'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import psTree from 'ps-tree'

export const isWindows = os.platform() === 'win32'

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id)
}

export function generateCommandToOneLine(command: string) {
  return command.replace(/\s+/g, ' ').trim()
}

export function getCachePath(): string {
  const rootPath = process.cwd()
  const pkgPath = path.join(rootPath, 'package.json')

  return fs.existsSync(pkgPath)
    ? path.join(rootPath, 'node_modules/.doubleshot-runner')
    : path.join(rootPath, '.doubleshot-runner')
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function psTreeSync(pid: number): Promise<readonly PS[]> {
  return new Promise((resolve, reject) => {
    psTree(pid, (err, children) => {
      if (err) {
        reject(err)
      }
      else {
        resolve(children)
      }
    })
  })
}

export async function treeKill(pid: number, signal?: string | number) {
  const children = (await psTreeSync(pid)).filter(child => child.PID !== `${pid}` && child.PPID === `${pid}`)
  for (const child of children) {
    await treeKill(Number(child.PID), signal).catch(() => {
      // ignore error
    })
  }
  process.kill(pid, signal)
}
