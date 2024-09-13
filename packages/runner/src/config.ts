import type { ConcurrentlyCommandInput } from 'concurrently'
import type { Configuration as ElectronBuilderConfiguration } from 'electron-builder'
import path from 'node:path'
import { bundleRequire } from 'bundle-require'
import { greenBright } from 'colorette'
import JoyCon from 'joycon'
import { CONFIG_FILE, TAG } from './constants'
import { createLogger } from './log'
import { normalizePath } from './utils'

export type DoubleShotRunnerConfigExport = DoubleShotRunnerConfig | Promise<DoubleShotRunnerConfig>

export interface CommandHook {
  cwd?: string
  /**
   * hook type, you should tell dsr how to run it:
   * - 'node-file': run it as a node file, support typescript
   * - 'command': run it as a command
   * @default 'node-file'
   */
  type: 'node-file' | 'command'
  /**
   * - if type is 'node-file', this is the file path, relative path will be resolved in cwd, and run in cwd
   * - if type is 'command', this is the command, will be run in cwd
   */
  hook: string
}

export type RunCommandInfo = string | (Exclude<ConcurrentlyCommandInput, string> & {
  /**
   * alias name
   */
  alias?: string | string[]
  /**
   * when this command is exited, the other commands will be killed
   * @default false
   */
  killOthersWhenExit?: boolean
  /**
   * hook runs before command
   *
   * If it is a function, its return value is false, which will prevent the execution of the command
   */
  beforeRun?: (() => boolean | Promise<boolean>) | CommandHook
})

export interface RunConfig {
  /**
   * @default process.cwd()
   */
  cwd?: string
  /**
   * Running name
   */
  name?: string
  /**
   * Terminal color
   */
  prefixColor?: string
  commands?: Record<string, RunCommandInfo>
}

export interface ElectronBuildConfig {
  /**
   * @default false
   */
  disabled?: boolean
  /**
   * @default 'build'
   */
  commandName?: string
  /**
   * @default process.cwd()
   */
  projectDir?: string
  /**
   * electron-builder config or electron-builder config file path
   */
  config?: string | ElectronBuilderConfiguration
}

export interface DoubleShotRunnerConfig {
  /**
   * Project root directory. Can be an absolute path, or a path relative from
   * the location of the config file itself.
   * @default process.cwd()
   */
  root?: string
  run?: RunConfig[]
  /**
   * Filter running names. It requires RunConfig to set `name` config.
   */
  filter?: string[]
  /**
   * Only run special names. It requires RunConfig to set `name` config.
   */
  only?: string[] | string
  electronBuild?: ElectronBuildConfig
}

export interface InlineConfig extends Pick<DoubleShotRunnerConfig, 'root' | 'filter' | 'only'> {
  /**
   * Disable electron-builder
   * @default false
   */
  disableElectronBuild?: boolean
}

export type ResolvedConfig = Readonly<{
  configFile: string | undefined
} & DoubleShotRunnerConfig>

/**
 * Type helper to make it easier to use dsr.config.ts
 */
export function defineConfig(config: DoubleShotRunnerConfigExport): DoubleShotRunnerConfigExport {
  return config
}

/**
 * Resolve doubleshot runner config
 */
export async function resolveConfig(inlineConfig: InlineConfig): Promise<ResolvedConfig> {
  const logger = createLogger()
  const cwd = process.cwd()
  const configJoycon = new JoyCon()
  const configPath = await configJoycon.resolve({
    files: [
      `${CONFIG_FILE}.ts`,
      `${CONFIG_FILE}.js`,
      `${CONFIG_FILE}.cjs`,
      `${CONFIG_FILE}.mjs`,
    ],
    cwd,
    stopDir: path.parse(cwd).root,
  })

  if (configPath) {
    logger.info(TAG, `Using config: ${greenBright(configPath)}\n`)

    const { mod } = await bundleRequire({
      filepath: configPath,
    })

    const config: DoubleShotRunnerConfig = mod.default || mod

    const filter = inlineConfig.filter || config.filter || []
    const onlyConfig = inlineConfig.only || config.only
    const only = Array.isArray(onlyConfig) ? onlyConfig : onlyConfig ? [onlyConfig] : []
    let runConfig: RunConfig[] | undefined = []
    if (only && only.length > 0) {
      runConfig = config.run?.filter(e => e.name && only.includes(e.name))
      filter.length > 1 && logger.warn(TAG, '\'only\' has a greater priority than \'filter\'')
    }
    else {
      runConfig = config.run?.filter(e => !(e.name && filter.includes(e.name)))
    }

    const resolvedRunConfig = resolveRunConfig(runConfig, cwd)
    const resolvedElectronBuildConfig = resoleElectronBuilderConfig(config.electronBuild, cwd)

    return {
      root: inlineConfig.root || config.root || cwd,
      configFile: configPath,
      run: resolvedRunConfig,
      electronBuild: {
        ...resolvedElectronBuildConfig,
        disabled: inlineConfig.disableElectronBuild || resolvedElectronBuildConfig.disabled,
      },
    }
  }
  else {
    throw new Error('doubleshot runner needs a config file')
  }
}

function resoleElectronBuilderConfig(buildConfig: ElectronBuildConfig | undefined, cwd: string): ElectronBuildConfig {
  if (!buildConfig)
    return { disabled: true }

  const resolvedProjectDir = normalizePath(path.resolve(cwd, buildConfig.projectDir || ''))
  const resolvedConfig = typeof buildConfig.config === 'string' ? normalizePath(path.resolve(cwd, buildConfig.config)) : buildConfig.config
  return {
    disabled: buildConfig.disabled === true,
    commandName: buildConfig.commandName || 'build',
    projectDir: resolvedProjectDir,
    config: resolvedConfig,
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
