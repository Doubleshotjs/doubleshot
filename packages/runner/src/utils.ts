import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

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
