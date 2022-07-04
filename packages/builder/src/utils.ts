import path from 'path'
import os from 'os'

export const isWindows = os.platform() === 'win32'

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id)
}

export function resolvePath(_path: string, cwd: string = process.cwd()): string {
  if (path.isAbsolute(_path))
    return _path

  return path.resolve(cwd, _path)
}

export function arraify<T>(target: T | T[]): T[] {
  return Array.isArray(target) ? target : [target]
}

export function merge<T>(obj1: T, obj2: T): T {
  const result = Object.assign({}, obj1)
  for (const key in obj2) {
    if (obj2[key] !== undefined)
      result[key] = obj2[key]
  }
  return result
}
