import path from 'path'
import JoyCon from 'joycon'
import { bundleRequire } from 'bundle-require'
import { normalizePath } from './utils'
import { createLogger } from './log'

export type DoubleShotConfigExport = DoubleShotConfig | Promise<DoubleShotConfig>

export interface RunConfig {
  cwd?: string
  name?: string
  prefixColor?: string
  commands?: Record<string, string>
}

export interface DoubleShotConfig {
  /**
   * Project root directory. Can be an absolute path, or a path relative from
   * the location of the config file itself.
   * @default process.cwd()
   */
  root?: string
  run?: RunConfig[]
}

export type ResolvedConfig = Readonly<{
  configFile: string | undefined
} & DoubleShotConfig>

export function defineConfig(config: DoubleShotConfigExport): DoubleShotConfigExport {
  return config
}

export async function resolveConfig(): Promise<ResolvedConfig> {
  const logger = createLogger()
  const cwd = process.cwd()
  const configJoycon = new JoyCon()
  const configPath = await configJoycon.resolve({
    files: [
      'dsr.config.ts',
      'dsr.config.js',
      'dsr.config.cjs',
      'dsr.config.mjs',
    ],
    cwd,
    stopDir: path.parse(cwd).root,
  })

  if (configPath) {
    logger.info('dsr', `Using doubleshot runner config: ${configPath}\n`)

    const { mod } = await bundleRequire({
      filepath: configPath,
    })

    const config: DoubleShotConfig = mod.default || mod

    const resolvedRunConfig = resolveRunConfig(config.run, cwd)

    return {
      configFile: configPath,
      run: resolvedRunConfig,
      root: config.root || cwd,
    }
  }
  else {
    throw new Error('doubleshot runner needs a config file')
  }
}

function resolveRunConfig(runConfig: RunConfig[] | undefined, cwd: string) {
  if (!runConfig)
    return []

  return runConfig.map((runConfig) => {
    const { cwd: runCwd, name } = runConfig
    const resolvedCwd = normalizePath(path.resolve(cwd, runCwd || ''))
    return {
      ...runConfig,
      cwd: resolvedCwd,
      name: name || path.basename(resolvedCwd),
    }
  })
}

