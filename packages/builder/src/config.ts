import type { CliOptions as ElectronBuilderCliOptions, Configuration as ElectronBuilderConfiguration } from 'electron-builder'
import type { DepsConfig as _TsdownDepsConfig, UserConfig as _TsdownOptions } from 'tsdown'
import fs from 'node:fs'
import path from 'node:path'
import { bundleRequire } from 'bundle-require'
import { greenBright } from 'colorette'
import JoyCon from 'joycon'
import { CONFIG_FILE, TAG } from './constants'
import { createLogger } from './log'
import { merge, normalizePath, resolvePath } from './utils'

const logger = createLogger()
const joycon = new JoyCon()

export type AppType = 'node' | 'electron'

export type UserConfigExport = UserConfig | Promise<UserConfig>

export interface ElectronBuildConfig {
  /**
   * @default false
   */
  disabled?: boolean
  /**
   * electron-builder config or electron-builder config file path
   */
  config?: string | ElectronBuilderConfiguration
  /**
   * electron-builder cli config
   */
  cliOptions?: ElectronBuilderCliOptions
  /**
   * Will be executed when electron-builder build is complete
   */
  afterBuild?: () => Promise<void>
}

export type TsdownConfig = Omit<_TsdownOptions, 'entry' | 'outDir' | 'tsconfig' | 'external' | 'onSuccess'> & {
  onSuccess?: () => Promise<any>
}

type TsdownExternal = _TsdownDepsConfig['neverBundle']
type TsdownNoExternal = _TsdownDepsConfig['alwaysBundle']

export interface UserTsdownConfig {
  outDir?: _TsdownOptions['outDir']
  tsconfig?: _TsdownOptions['tsconfig']
  /**
   * External packages passed to doubleshot.
   * Internally this is mapped to tsdown's `deps.neverBundle`.
   */
  external?: TsdownExternal
  /**
   * Packages that should always be bundled.
   * Internally this is mapped to tsdown's `deps.alwaysBundle`.
   */
  noExternal?: TsdownNoExternal
  /**
   * entry file, only support single file
   */
  entry?: string
  /**
   * tsdown config file path, or tsdown config object
   * @note 'entry' will be ignored
   */
  tsdownConfig?: string | TsdownConfig
}

export interface PreloadTsdownConfig {
  outDir?: _TsdownOptions['outDir']
  tsconfig?: _TsdownOptions['tsconfig']
  /**
   * External packages passed to doubleshot.
   * Internally this is mapped to tsdown's `deps.neverBundle`.
   */
  external?: TsdownExternal
  /**
   * Packages that should always be bundled.
   * Internally this is mapped to tsdown's `deps.alwaysBundle`.
   */
  noExternal?: TsdownNoExternal
  /**
   *  preload file entry points, support multiple files
   */
  entry?: string | string[]
  /**
   * tsdown config file path, or tsdown config object
   * @note 'entry' will be ignored
   */
  tsdownConfig?: string | TsdownConfig
}

export interface ElectronConfig {
  /**
   * The build configuration of the preload file
   */
  preload?: PreloadTsdownConfig
  /**
   * electron-builder configuration
   */
  build?: ElectronBuildConfig
  /**
   * Renderer process url on development mode
   */
  rendererUrl?: string | string[]
  /**
   * whether to wait for the renderer process ready
   */
  waitForRenderer?: boolean
  /**
   * wait for the renderer process ready timeout
   */
  waitTimeout?: number
}

export interface DevArgs {
  node?: string[]
  electron?: string[]
}

export interface DebugConfig {
  enabled?: boolean
  args?: string[] | DevArgs
  env?: Record<string, string>
  sourcemapType?: 'file' | 'inline'
  buildOnly?: boolean
}

export interface UserConfig extends UserTsdownConfig {
  /**
   * App type, 'node' or 'electron'
   * @default 'node'
   */
  type?: AppType
  /**
   * The entry of the application
   * @default 'package.json'.main
   */
  main?: string
  /**
   * Arguments passed to the command in development mode
   */
  args?: string[] | DevArgs
  /**
   * Only prebuild files and won't run the application in development mode
   * @default false
   */
  buildOnly?: boolean
  /**
   * Skip prebuild and run the application
   * @default false
   */
  runOnly?: boolean
  /**
   * Some configuration for electron
   */
  electron?: ElectronConfig
  /**
   * Will be executed when tsdown build is complete
   */
  afterBuild?: () => Promise<void>
  /**
   * Debug configuration
   */
  debugCfg?: DebugConfig
}

export interface InlineConfig extends UserConfig {
  /**
   * Specify doubleshot builder config file
   * if set to false, will not load config file
   */
  configFile?: string | false
  /**
   * preload file entry
   */
  preload?: string
  /**
   * electron-builder config file
   */
  electronBuilderConfig?: string
  /**
   * Renderer process url on development mode
   */
  rendererUrl?: string | string[]
  /**
   * whether to wait for the renderer process ready
   */
  waitForRenderer?: boolean
  /**
   * wait for the renderer process ready timeout
   */
  waitTimeout?: number
  /**
   * Run in debug mode
   */
  debug?: boolean
}

export type ResolvedConfig = Readonly<{
  cwd: string
  type: AppType
  main: string
  args: string[] | DevArgs
  buildOnly: boolean
  runOnly: boolean
  debugCfg: DebugConfig
  tsdownConfigs: _TsdownOptions[]
  electron: Omit<ElectronConfig, 'preload'>
} & Pick<UserConfig, 'afterBuild'>>

/**
 * Type helper to make it easier to use dsb.config.ts
 */
export function defineConfig(config: UserConfigExport): UserConfigExport {
  return config
}

/**
 * Resolve config
 */
export async function resolveConfig(inlineConfig: InlineConfig, cwd: string = process.cwd()): Promise<ResolvedConfig> {
  const { configFile } = inlineConfig

  // get config file path
  let configFilePath: string | null = null
  if (typeof configFile === 'string') {
    configFilePath = resolvePath(configFile, cwd)
  }
  else if (configFile !== false) {
    const configJoycon = new JoyCon()
    configFilePath = await configJoycon.resolve({
      files: [
        `${CONFIG_FILE}.ts`,
        `${CONFIG_FILE}.js`,
        `${CONFIG_FILE}.cjs`,
        `${CONFIG_FILE}.mjs`,
      ],
      cwd,
      stopDir: path.parse(cwd).root,
    })
  }

  let config: UserConfig = {}

  // load config if config file path is found
  if (configFilePath) {
    logger.info(TAG, `Using config: ${greenBright(configFilePath)}\n`)

    const { mod: cfgMod } = await bundleRequire({
      filepath: configFilePath,
    })

    config = cfgMod.default || cfgMod
  }

  config = merge(config, inlineConfig)

  // resolve app type
  const appType = config.type || 'node'

  // resolve main file
  const mainFile = await getMainFileAndCheck(cwd, config.main)

  // resolve entry file tsdown config
  if (!config.entry)
    throw new Error('entry file is required')

  const tsdownConfigArr: _TsdownOptions[] = [(await mergeTsdownConfig(config, cwd, {}, { singleFileOutput: true }))]

  // resolve electron preload file tsdown config, entry must be specified
  if (config.electron?.preload || inlineConfig.preload) {
    let preloadConfig = { ...(config.electron?.preload || {}) }
    if (inlineConfig.preload)
      preloadConfig = { ...preloadConfig, entry: inlineConfig.preload }

    if (preloadConfig.entry) {
      const preloadEntries = Array.isArray(preloadConfig.entry) ? preloadConfig.entry : [preloadConfig.entry]
      for (const entry of preloadEntries) {
        tsdownConfigArr.push(await mergeTsdownConfig(
          { ...preloadConfig, entry },
          cwd,
          tsdownConfigArr[0],
          { singleFileOutput: true },
        ))
      }
    }
    else {
      logger.warn(TAG, 'Electron preload\'s entry is not specified, it will be ignored')
    }
  }

  // resolve electron builder config
  let electronBuilderConfig: ElectronBuildConfig | undefined
  if (config.electron?.build || inlineConfig.electronBuilderConfig) {
    const electronConfig = config.electron?.build || { config: inlineConfig.electronBuilderConfig }
    electronBuilderConfig = resolveElectronBuilderConfig(electronConfig, cwd)
  }

  // resolve debug config
  const debugCfg = config.debugCfg || {}
  debugCfg.enabled = !!(inlineConfig.debug || debugCfg.enabled)
  if (debugCfg.enabled) {
    tsdownConfigArr.forEach((c) => {
      c.sourcemap = debugCfg.sourcemapType === 'file' ? true : 'inline'
    })
  }

  // resolve build only
  const buildOnly = !!(inlineConfig.buildOnly || config.buildOnly || debugCfg.buildOnly)

  // resolve run only
  const runOnly = !!(inlineConfig.runOnly || config.runOnly)

  return {
    cwd,
    type: appType,
    main: mainFile,
    args: config.args || [],
    debugCfg,
    buildOnly,
    runOnly,
    tsdownConfigs: tsdownConfigArr,
    electron: {
      build: electronBuilderConfig,
      rendererUrl: inlineConfig.rendererUrl || config.electron?.rendererUrl,
      waitForRenderer: inlineConfig.waitForRenderer || config.electron?.waitForRenderer,
      waitTimeout: inlineConfig.waitTimeout || config.electron?.waitTimeout,
    },
    afterBuild: config.afterBuild,
  }
}

async function getMainFileAndCheck(cwd: string, defaultMainFile?: string) {
  let mainFile = defaultMainFile
  if (!mainFile) {
    const packageJson = await joycon.load({
      files: ['package.json'],
      cwd,
      stopDir: path.parse(cwd).root,
    })

    const { path: filePath, data } = packageJson

    if (!filePath)
      throw new Error('Main file is not specified, and no package.json found')

    const { main } = data
    if (main)
      mainFile = resolvePath(main, cwd)
    else
      throw new Error('Main file is not specified, package.json also missing main field ')
  }

  if (!/\.cjs$|\.js$/.test(mainFile))
    throw new Error(`Main file must be .cjs or .js: ${mainFile}`)

  return mainFile
}

async function mergeTsdownConfig(
  inputConfig: UserTsdownConfig | PreloadTsdownConfig,
  cwd: string,
  defaultConfig: _TsdownOptions = {},
  options: { singleFileOutput?: boolean } = {},
): Promise<_TsdownOptions> {
  let extraCfg: _TsdownOptions | undefined
  if (inputConfig.tsdownConfig) {
    // load tsdown config
    if (typeof inputConfig.tsdownConfig === 'string') {
      const tsdownConfigPath = await joycon.resolve({
        files: [inputConfig.tsdownConfig],
        cwd,
        stopDir: path.parse(cwd).root,
      })
      if (!tsdownConfigPath) {
        logger.warn(TAG, `tsdown config file: ${inputConfig.tsdownConfig} not found, ignored.\n`)
      }
      else {
        const { mod } = await bundleRequire({
          filepath: tsdownConfigPath,
        })
        extraCfg = mod.default || mod
      }
    }
    // use tsdown config directly
    else if (typeof inputConfig.tsdownConfig === 'object') {
      extraCfg = inputConfig.tsdownConfig
    }
  }

  if (extraCfg)
    extraCfg = normalizeTsdownExternal(extraCfg)

  // extra tsdown config entry field will be ignored
  delete extraCfg?.entry

  // merge tsdown config
  let tsdownConfig: _TsdownOptions = merge(defaultConfig, {
    entry: inputConfig.entry ? (Array.isArray(inputConfig.entry) ? inputConfig.entry : [inputConfig.entry]) : undefined,
    outDir: inputConfig.outDir,
    tsconfig: inputConfig.tsconfig,
    deps: {
      alwaysBundle: inputConfig.noExternal,
      neverBundle: inputConfig.external,
    },
    clean: false,
    dts: false,
    fixedExtension: false,
    format: 'cjs',
    platform: 'node',
  })

  tsdownConfig = extraCfg ? merge(tsdownConfig, extraCfg) : tsdownConfig

  const neverBundle = tsdownConfig.deps?.neverBundle

  // support specific package.json, "dependencies" in package.json will be external
  if (Array.isArray(neverBundle) && neverBundle.some(e => typeof e === 'string' && e.includes('package.json'))) {
    const external = []

    for (const item of neverBundle) {
      if (typeof item !== 'string' || !item.includes('package.json')) {
        external.push(item)
        continue
      }

      const pkgJsonPath = resolvePath(item, cwd)
      const { dependencies = {}, peerDependencies = {} } = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
      for (const dep in { ...dependencies, ...peerDependencies })
        external.push(dep)
    }

    tsdownConfig.deps = {
      ...(tsdownConfig.deps || {}),
      neverBundle: [...new Set(external)],
    }
  }

  if (options.singleFileOutput)
    tsdownConfig = applySingleFileOutput(tsdownConfig)

  return tsdownConfig
}

function normalizeTsdownExternal(config: _TsdownOptions): _TsdownOptions {
  if (!config.external && !config.noExternal)
    return config

  const normalizedConfig = { ...config }
  normalizedConfig.deps = merge(normalizedConfig.deps || {}, {
    alwaysBundle: normalizedConfig.noExternal,
    neverBundle: normalizedConfig.external,
  })
  delete normalizedConfig.external
  delete normalizedConfig.noExternal
  return normalizedConfig
}

function applySingleFileOutput(config: _TsdownOptions): _TsdownOptions {
  const normalizedConfig = { ...config }
  const existingOutputOptions = normalizedConfig.outputOptions

  if (!existingOutputOptions || typeof existingOutputOptions === 'object') {
    normalizedConfig.outputOptions = merge(existingOutputOptions || {}, {
      codeSplitting: false,
    })
    return normalizedConfig
  }

  normalizedConfig.outputOptions = async (outputOptions, format, context) => {
    const resolvedOutputOptions = await existingOutputOptions(outputOptions, format, context)
    return merge(resolvedOutputOptions || {}, {
      codeSplitting: false,
    })
  }
  return normalizedConfig
}

function resolveElectronBuilderConfig(buildConfig: ElectronBuildConfig | undefined, cwd: string): ElectronBuildConfig {
  if (!buildConfig)
    return { disabled: true }

  const resolvedConfig = typeof buildConfig.config === 'string' ? normalizePath(path.resolve(cwd, buildConfig.config)) : buildConfig.config
  return {
    disabled: buildConfig.disabled === true,
    config: resolvedConfig,
    afterBuild: buildConfig.afterBuild,
    cliOptions: buildConfig.cliOptions,
  }
}
