import os from 'node:os'
import path from 'node:path'

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

export function isObject(value: unknown): value is Record<string, any> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

export function merge(defaults: Record<string, any>, overrides: Record<string, any>) {
  const merged: Record<string, any> = { ...defaults }
  for (const key in overrides) {
    const value = overrides[key]
    if (value == null)
      continue

    const existing = merged[key]

    if (existing == null) {
      merged[key] = value
      continue
    }
    // fields that require special handling
    if (key === 'entry') {
      merged[key] = value || existing
      continue
    }

    if (Array.isArray(existing) || Array.isArray(value)) {
      merged[key] = [...arraify(existing ?? []), ...arraify(value ?? [])]
      continue
    }
    if (isObject(existing) && isObject(value)) {
      merged[key] = merge(
        existing,
        value,
      )
      continue
    }

    merged[key] = value
  }
  return merged
}
