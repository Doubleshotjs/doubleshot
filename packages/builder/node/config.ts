import path from 'path'
import JoyCon from 'joycon'
import { bundleRequire } from 'bundle-require'
import type { Configuration as ElectronBuilderConfiguration } from 'electron-builder'
import { greenBright } from 'colorette'
import type { Options as TsupOptions } from 'tsup'
import { merge, normalizePath } from './utils'
import { createLogger } from './log'
import { CONFIG_FILE, TAG } from './constants'

export type AppType = 'node' | 'electron'

export type DoubleShotBuilderConfigExport = DoubleShotBuilderConfig | Promise<DoubleShotBuilderConfig>

export interface ElectronBuildConfig {
  /**
   * @default false
   */
  disabled?: boolean
  config?: string | ElectronBuilderConfiguration
  afterBuild?: () => Promise<void>
}

export type TsupBuildConfig = Pick<TsupOptions, 'entry' | 'outDir' | 'tsconfig' | 'external'> & {
  tsupConfig?: string | TsupOptions
}

export interface ElectronConfig {
  preload?: TsupBuildConfig
  build?: ElectronBuildConfig
  rendererUrl?: string
  waitForRenderer?: boolean
  waitTimeout?: number
}

export interface DoubleShotBuilderConfig extends TsupBuildConfig {
  /**
   * @default 'package.json'.main
   */
  main?: string
  electron?: ElectronConfig
  afterBuild?: () => Promise<void>
}

export type ResolvedConfig = Readonly<{
  cwd: string
  configFile: string | undefined
  tsupConfigs: TsupOptions[]
  electron: Omit<ElectronConfig, 'preload'>
} & Pick<DoubleShotBuilderConfig, 'main' | 'afterBuild'>>

export function defineConfig(config: DoubleShotBuilderConfigExport): DoubleShotBuilderConfigExport {
  return config
}

export async function resolveConfig(): Promise<ResolvedConfig> {
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

    const config: DoubleShotBuilderConfig = mod.default || mod

    const mergeTsupConfig = async (inputConfig: TsupBuildConfig, defaultConfig: TsupOptions = {}) => {
      let result: TsupOptions | undefined
      if (inputConfig.tsupConfig) {
        if (typeof inputConfig.tsupConfig === 'string') {
          const tsupConfigPath = await configJoycon.resolve({
            files: [inputConfig.tsupConfig],
            cwd,
            stopDir: path.parse(cwd).root,
          })
          if (!tsupConfigPath) {
            logger.warn(TAG, `tsup config file: ${config.tsupConfig} not found, ignored.\n`)
          }
          else {
            const { mod } = await bundleRequire({
              filepath: tsupConfigPath,
            })
            result = mod.default || mod
          }
        }
        else if (typeof inputConfig.tsupConfig === 'object') {
          result = inputConfig.tsupConfig
        }
      }

      const userTsupConfig: TsupOptions = merge(defaultConfig, {
        entry: inputConfig.entry,
        outDir: inputConfig.outDir,
        tsconfig: inputConfig.tsconfig,
        external: inputConfig.external,
      })

      return result ? { ...userTsupConfig, ...result } : userTsupConfig
    }

    const tsupConfigArr: TsupOptions[] = [(await mergeTsupConfig(config))]

    if (config.electron?.preload)
      tsupConfigArr.push(await mergeTsupConfig(config.electron.preload, tsupConfigArr[0]))

    return {
      cwd,
      main: config.main ? normalizePath(path.resolve(cwd, config.main)) : undefined,
      configFile: normalizePath(configPath),
      tsupConfigs: tsupConfigArr,
      electron: {
        build: resoleElectronBuilderConfig(config.electron?.build, cwd),
        rendererUrl: config.electron?.rendererUrl,
        waitForRenderer: config.electron?.waitForRenderer,
        waitTimeout: config.electron?.waitTimeout,
      },
      afterBuild: config.afterBuild,
    }
  }
  else {
    throw new Error('doubleshot builder needs a config file')
  }
}

function resoleElectronBuilderConfig(buildConfig: ElectronBuildConfig | undefined, cwd: string): ElectronBuildConfig {
  if (!buildConfig)
    return { disabled: true }

  const resolvedConfig = typeof buildConfig.config === 'string' ? normalizePath(path.resolve(cwd, buildConfig.config)) : buildConfig.config
  return {
    disabled: buildConfig.disabled === true,
    config: resolvedConfig,
    afterBuild: buildConfig.afterBuild,
  }
}
