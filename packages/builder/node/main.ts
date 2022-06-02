import { performance } from 'perf_hooks'
import path from 'path'
import type { ChildProcess } from 'child_process'
import { spawn } from 'child_process'
import fs from 'fs'
import { bgCyan, bgCyanBright, bgGreen, cyan, greenBright } from 'colorette'
import { build as tsupBuild } from 'tsup'
import type { Options as TsupOptions } from 'tsup'
import waitOn from 'wait-on'
import { checkPackageExists } from 'check-package-exists'
import { TAG } from './constants'
import { resolveConfig } from './config'
import type { AppType } from './config'
import { createLogger } from './log'

const logger = createLogger()

function getMainFileAndCheck(cwd: string, defaultMainFile?: string): string {
  let mainFile = defaultMainFile
  if (!mainFile) {
    const file = path.resolve(cwd, 'package.json')
    const data = require(file)
    delete require.cache[file]

    if (Object.prototype.hasOwnProperty.call(data, 'main'))
      mainFile = path.resolve(cwd, data.main)

    else
      throw new Error('package.json missing main field')
  }

  if (!/\.cjs$|\.js$/.test(mainFile))
    throw new Error(`Main file must be .cjs or .js: ${mainFile}`)

  else if (!fs.existsSync(mainFile))
    throw new Error(`Main file not found: ${mainFile}`)

  return mainFile
}

function exitMainProcess() {
  logger.warn(TAG, 'Main process exit')
  process.exit(0)
}

function runMainProcess(mainFile: string, electron: any) {
  if (!fs.existsSync(mainFile))
    throw new Error(`Main file not found: ${mainFile}`)

  logger.success(TAG, `⚡ Run main file: ${greenBright(mainFile)}`)
  return spawn(electron ?? 'node', [mainFile], { stdio: 'inherit' }).on('exit', exitMainProcess)
}

/**
 * See: https://github.com/jeffbski/wait-on/issues/78
 *
 * @param {string} url
 * @param {(number | undefined)} timeout
 * @returns
 */
function createWaitOnOpts(url: string, timeout: number | undefined) {
  if (url.startsWith('http://') || url.startsWith('https://'))
    url = url.startsWith('http://') ? url.replace('http://', 'http-get://') : url.replace('https://', 'https-get://')

  return {
    resources: [url],
    timeout: timeout || 5000,
    headers: {
      accept: '*/*',
    },
  }
}

function doTsupBuild(opts: TsupOptions) {
  return tsupBuild({
    silent: true,
    ...opts,
  })
}

function electronEnvCheck() {
  if (!checkPackageExists('electron'))
    throw new Error('"Application type: electron" is powered by "electron", please installed it via `npm i electron -D`')

  return true
}

export async function build(type: AppType) {
  const isElectron = type === 'electron'
  const startTime = performance.now()

  logger.info(TAG, `Mode: ${bgCyanBright('Production')}`)
  logger.info(TAG, `Application type: ${isElectron ? bgCyan(' electron ') : bgGreen(' node ')}`)

  isElectron && electronEnvCheck()

  const config = await resolveConfig()

  getMainFileAndCheck(config.cwd, config.main)

  for (const tsupConfig of config.tsupConfigs)
    await doTsupBuild(tsupConfig)

  await config.afterBuild?.()

  const { electron: electronConfig } = config

  if (isElectron && electronConfig.build && electronConfig.build.disabled !== true) {
    if (!checkPackageExists('electron-builder'))
      throw new Error('"electronConfig.build" is powered by "electron-builder", please installed it via `npm i electron-builder -D`')

    const { build: electronBuilder } = await import('electron-builder')

    logger.info(TAG, 'Start electron build...\n')

    await electronBuilder({
      config: electronConfig.build.config,
    })

    await electronConfig.build.afterBuild?.()
  }

  const endTime = performance.now() - startTime
  logger.success(`\n${TAG}`, `Build succeeded! (${endTime.toFixed(2)}ms)`)
}

export async function dev(type: AppType) {
  const isElectron = type === 'electron'

  logger.info(TAG, `Mode: ${bgCyanBright('Development')}`)
  logger.info(TAG, `Application type: ${isElectron ? bgCyan(' electron ') : bgGreen(' node ')}`)

  let electron: any | undefined
  if (isElectron && electronEnvCheck())
    electron = await import('electron')

  const config = await resolveConfig()
  let child: ChildProcess

  const mainFile = getMainFileAndCheck(config.cwd, config.main)

  for (const _tsupConfig of config.tsupConfigs) {
    const { esbuildOptions: _esbuildOptions, ...tsupOptions } = _tsupConfig
    const esbuildOptions: TsupOptions['esbuildOptions'] = (options, context) => {
      _esbuildOptions?.(options, context)
      if (options.watch !== false) {
        let userOnRebuild: Function | undefined
        if (typeof options.watch === 'object')
          userOnRebuild = options.watch.onRebuild

        options.watch = {
          onRebuild: async (error, result) => {
            userOnRebuild?.(error, result)

            if (error) {
              logger.error(TAG, 'Rebuild failed:', error)
            }
            else {
              logger.success(TAG, 'Rebuild succeeded!')
              if (child) {
                child.off('exit', exitMainProcess)
                child.kill()
              }

              child = runMainProcess(mainFile!, electron)
            }
          },
        }
      }
    }
    await doTsupBuild({ esbuildOptions, ...tsupOptions })
  }

  const { electron: electronConfig } = config

  if (isElectron && electronConfig.rendererUrl && electronConfig.waitForRenderer !== false) {
    const url = electronConfig.rendererUrl
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://')) {
      logger.info(TAG, `🚦 Wait for renderer: ${cyan(url)}`)
      await waitOn(createWaitOnOpts(url, electronConfig.waitTimeout))
    }
    else {
      logger.warn(TAG, `Invalid renderer url: ${url}, ignored.\n`)
    }
  }

  child = runMainProcess(mainFile, electron)
}
