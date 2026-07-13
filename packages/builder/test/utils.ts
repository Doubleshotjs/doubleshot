import type { Options as ExecaOptions } from '@esm2cjs/execa'
import type { UserConfigExport } from '../src'
import path from 'node:path'
import { execa } from '@esm2cjs/execa'
import fs from 'fs-extra'

export const bin = path.resolve(__dirname, '../dist/cli.js')
export const mockDir = path.resolve(__dirname, './mock')
export const configFile = path.resolve(mockDir, 'dsb.config.ts')
const packageJsonPath = path.resolve(mockDir, 'package.json')
let originalPackageManager: unknown
export const DEFAULT_CONFIG: UserConfigExport = {
  main: 'dist/main.js',
  entry: './src/main.ts',
  outDir: './dist',
  external: ['electron'],
}

export const DEFAULT_INLINE_CONFIG: string[] = [
  '-o',
  'dist',
  '-e',
  './src/main.ts',
  '--external',
  'electron',
  '--disable-config',
]

export function writeConfigFile(config: UserConfigExport) {
  const configContent = `
    import { defineConfig } from "../../src"
    export default defineConfig(${JSON.stringify(config)})
  `
  fs.writeFileSync(configFile, configContent)
}

export function checkOrCreateHtmlFile(fileName = 'index.html') {
  if (fs.existsSync(path.resolve(mockDir, fileName)))
    return

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">

    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Doubleshot Builder Test</title>
    </head>

    <body>
      <h1>Doubleshot Builder Test</h1>
    </body>

    </html>
  `

  fs.writeFileSync(path.resolve(mockDir, fileName), htmlContent)
}

export async function installDeps(cwd: string) {
  const installResult = await execa(
    'pnpm',
    ['install', '--no-lockfile', '--ignore-workspace'],
    {
      cwd,
    },
  )
  const electronInstallResult = await execa(
    'pnpm',
    ['exec', 'install-electron'],
    {
      cwd,
    },
  )

  const logs = installResult.stdout
    + installResult.stderr
    + electronInstallResult.stdout
    + electronInstallResult.stderr
  return logs
}

export function useTraversalPackageManager() {
  const packageJson = fs.readJsonSync(packageJsonPath)
  originalPackageManager = packageJson.packageManager
  fs.writeJsonSync(packageJsonPath, { ...packageJson, packageManager: 'traversal@0.0.0' }, { spaces: 2 })
}

export function restorePackageManager() {
  const packageJson = fs.readJsonSync(packageJsonPath)
  if (originalPackageManager === undefined)
    delete packageJson.packageManager
  else
    packageJson.packageManager = originalPackageManager
  fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 })
}

export function remove() {
  fs.removeSync(configFile)
  fs.removeSync(path.resolve(mockDir, 'dist'))
  fs.removeSync(path.resolve(mockDir, 'index.html'))
  fs.removeSync(path.resolve(mockDir, 'index_another.html'))
}

export async function run(command: 'dev' | 'build', args: string[], options: ExecaOptions = {}) {
  const { stdout, stderr } = await execa(
    bin,
    [command, ...args],
    {
      cwd: mockDir,
      ...options,
    },
  )

  const logs = stdout + stderr
  return logs
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
