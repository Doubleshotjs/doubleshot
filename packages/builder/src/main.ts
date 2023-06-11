import { performance } from 'node:perf_hooks'
import type { ChildProcess } from 'node:child_process'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import { bgCyan, bgCyanBright, bgGreen, bgMagentaBright, bgYellowBright, cyan, greenBright } from 'colorette'
import { build as tsupBuild } from 'tsup'
import type { Options as TsupOptions } from 'tsup'
import waitOn from 'wait-on'
import { checkPackageExists } from 'check-package-exists'
import { TAG } from './constants'
import { resolveConfig } from './config'
import type { AppType, DevArgs, InlineConfig, ResolvedConfig } from './config'
import { createLogger } from './log'

const logger = createLogger()

function exitMainProcess() {
  logger.warn(TAG, 'Main process exit')
  process.exit(0)
}

function runMainProcess(mainFile: string, electron: any, args: DevArgs) {
  if (!fs.existsSync(mainFile))
    throw new Error(`Main file not found: ${mainFile}`)

  logger.success(TAG, `⚡ Run main file: ${greenBright(mainFile)}`)

  const devArgs = electron ? [...(args.electron || [])] : [...(args.node || [])]

  return spawn(electron ?? 'node', [mainFile, ...devArgs], { stdio: 'inherit' }).on('exit', exitMainProcess)
}

/**
 * See: https://github.com/jeffbski/wait-on/issues/78
 */
function createWaitOnOpts(url: string, timeout?: number) {
  if (url.startsWith('http://') || url.startsWith('https://'))
    url = url.startsWith('http://') ? url.replace('http://', 'http-get://') : url.replace('https://', 'https-get://')
  else if (url.startsWith('file://'))
    url = url.replace('file://', '')

  return {
    resources: [url],
    timeout: timeout || 5000,
    headers: {
      accept: '*/*',
    },
  }
}

function doTsupBuild(opts: TsupOptions, dsEnv: TsupOptions['env'] = {}) {
  const { env: optsEnv, ...restOpts } = opts
  const env = { ...(optsEnv ?? {}), ...dsEnv }

  return tsupBuild({
    silent: true,
    env,
    ...restOpts,
  })
}

function electronEnvCheck() {
  if (!checkPackageExists('electron'))
    throw new Error('"Application type: electron" is powered by "electron", please installed it via `npm i electron -D`')

  return true
}

function createDoubleShotEnv(type: AppType, config: ResolvedConfig, mode: 'production' | 'development'): TsupOptions['env'] {
  const dsEnv: TsupOptions['env'] = {
    DS_APP_TYPE: type,
    DS_MODE: mode,
  }

  if (type === 'electron') {
    if (config.electron.rendererUrl) {
      if (Array.isArray(config.electron.rendererUrl)) {
        for (let i = 0; i < config.electron.rendererUrl.length; i++) {
          if (i === 0)
            dsEnv.DS_RENDERER_URL = config.electron.rendererUrl[i]
          else
            dsEnv[`DS_RENDERER_URL_${i + 1}`] = config.electron.rendererUrl[i]
        }
      }
      else {
        dsEnv.DS_RENDERER_URL = config.electron.rendererUrl
      }
    }
  }

  const { debugCfg = {} } = config
  if (debugCfg.enabled && debugCfg.env) {
    for (const key in debugCfg.env)
      dsEnv[key] = debugCfg.env[key]
  }

  return dsEnv
}

function createDoubleshotArgs(config: ResolvedConfig): DevArgs {
  const { args = [], debugCfg = {} } = config

  const dsArgs: ResolvedConfig['args'] = {
    node: [],
    electron: [],
  }

  if (Array.isArray(args)) {
    dsArgs.node = [...args]
    dsArgs.electron = [...args]
  }
  else {
    dsArgs.node = [...(args.node || [])]
    dsArgs.electron = [...(args.electron || [])]
  }

  if (debugCfg.enabled && debugCfg.args) {
    if (Array.isArray(debugCfg.args)) {
      dsArgs.node.push(...debugCfg.args)
      dsArgs.electron.push(...debugCfg.args)
    }
    else {
      dsArgs.node.push(...(debugCfg.args.node || []))
      dsArgs.electron.push(...(debugCfg.args.electron || []))
    }
  }

  return dsArgs
}

export async function build(inlineConfig: InlineConfig = {}, autoPack = true) {
  const config = await resolveConfig(inlineConfig)
  const {
    type: appType = 'node',
    tsupConfigs = [],
    afterBuild,
    electron: electronConfig = {},
  } = config

  const isElectron = appType === 'electron'
  const startTime = performance.now()

  logger.info(TAG, `📦 Mode: ${bgCyanBright(' Production ')}`)
  logger.info(TAG, `💠 Application type: ${isElectron ? bgCyan(' electron ') : bgGreen(' node ')}`)

  isElectron && electronEnvCheck()

  // doubleshot env
  const dsEnv = createDoubleShotEnv(appType, config, 'production')

  // tsup build
  for (let i = 0; i < tsupConfigs.length; i++) {
    const tsupConfig = tsupConfigs[i]
    await doTsupBuild({ ...tsupConfig }, dsEnv)
  }
  const prebuildTime = performance.now() - startTime
  logger.success(TAG, `✅ Prebuild succeeded! (${prebuildTime.toFixed(2)}ms)`)

  await afterBuild?.()

  const pack = async () => {
    if (isElectron && electronConfig.build && electronConfig.build.disabled !== true) {
      if (!checkPackageExists('electron-builder'))
        throw new Error('"electronConfig.build" is powered by "electron-builder", please installed it via `npm i electron-builder -D`')

      const { build: electronBuilder } = await import('electron-builder')

      logger.info(TAG, 'Start electron build...\n')

      await electronBuilder({
        config: electronConfig.build.config,
        ...(electronConfig.build.cliOptions || {}),
      })

      await electronConfig.build.afterBuild?.()
    }

    const endTime = performance.now() - startTime
    logger.success(`\n${TAG}`, `Build succeeded! (${endTime.toFixed(2)}ms)`)
  }

  if (autoPack)
    await pack()

  else
    return pack
}

export async function dev(inlineConfig: InlineConfig = {}) {
  const config = await resolveConfig(inlineConfig)
  const {
    main: mainFile,
    type: appType = 'node',
    buildOnly = false,
    runOnly = false,
    debugCfg = {},
    tsupConfigs = [],
    electron: electronConfig = {},
  } = config

  const isDebug = !!debugCfg.enabled
  const isElectron = appType === 'electron'
  const startTime = performance.now()

  logger.info(TAG, `💻 Mode: ${isDebug ? `${bgYellowBright(' DEBUG ')} ` : ''}${bgCyanBright(' Development ')}`)
  logger.info(TAG, `💠 Application type: ${isElectron ? bgCyan(' electron ') : bgGreen(' node ')}`)

  // doubleshot env
  const dsEnv = createDoubleShotEnv(appType, config, 'development')

  // doubleshot args
  const dsArgs = createDoubleshotArgs(config)

  // run process init
  let electron: any | undefined
  if (isElectron && electronEnvCheck())
    electron = await import('electron')
  let child: ChildProcess

  // prebuild files
  const prebuild = async () => {
    // tsup build
    for (let i = 0; i < tsupConfigs.length; i++) {
      let isFirstBuild = true
      const _tsupConfig = tsupConfigs[i]
      const { onSuccess: _onSuccess, watch: _watch, ...tsupOptions } = _tsupConfig
      const watch = _watch !== false
      if (!watch)
        logger.info(TAG, '⚠️  Watch mode is disabled')

      if (typeof _onSuccess === 'string')
        logger.warn(TAG, '⚠️  "onSuccess" only support a function, ignore it.')

      const onSuccess: TsupOptions['onSuccess'] = async () => {
        if (!watch)
          return

        if (typeof _onSuccess === 'function')
          await _onSuccess()

        // first build will not trigger rebuild
        if (isFirstBuild) {
          isFirstBuild = false
          return
        }

        logger.success(TAG, 'Rebuild succeeded!')
        if (buildOnly)
          return

        if (child) {
          child.off('exit', exitMainProcess)
          child.kill()
        }

        child = runMainProcess(mainFile!, electron, dsArgs)
      }

      await doTsupBuild({ onSuccess, watch, ...tsupOptions }, dsEnv)
    }
  }

  if (runOnly) {
    logger.info(TAG, `🚄 ${bgMagentaBright(' RUN ONLY ')} Prebuild will be skipped`)
  }
  else {
    await prebuild()
    const prebuildTime = performance.now() - startTime
    logger.success(TAG, `✅ Prebuild succeeded! (${prebuildTime.toFixed(2)}ms)`)
  }

  if (buildOnly) {
    logger.info(TAG, `🛠️ ${bgYellowBright(' BUILD ONLY ')} Application won't start`)
    return
  }

  if (isElectron && electronConfig.rendererUrl && electronConfig.waitForRenderer !== false) {
    const waitFn = async (url: string) => {
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://')) {
        logger.info(TAG, `🚦 Wait for renderer: ${cyan(url)}`)
        await waitOn(createWaitOnOpts(url, electronConfig.waitTimeout))
      }
      else {
        logger.warn(TAG, `Invalid renderer url: ${url}, ignored.\n`)
      }
    }

    if (!Array.isArray(electronConfig.rendererUrl))
      await waitFn(electronConfig.rendererUrl)

    else
      await Promise.all(electronConfig.rendererUrl.map(waitFn))
  }

  child = runMainProcess(mainFile, electron, dsArgs)
}
