import type { ChildProcess } from 'child_process'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import type { Options as TsupOptions } from 'tsup'
import { build as tsupBuild } from 'tsup'
import electron from 'electron'
import { bgCyan, bgCyanBright, bgGreen, cyan, greenBright } from 'colorette'
import waitOn from 'wait-on'
import { TAG } from './constants'
import { resolveConfig } from './config'
import type { AppType } from './config'
import { createLogger } from './log'

const logger = createLogger()

function exitMainProcess() {
  logger.warn(TAG, 'Main process exit')
  process.exit(0)
}

function runMainProcess(mainFile: string, isElectron: boolean) {
  if (!fs.existsSync(mainFile))
    throw new Error(`Main file not found: ${mainFile}`)

  logger.success(TAG, `⚡ Run main file: ${greenBright(mainFile)}`)
  return spawn(isElectron ? electron as any : 'node', [mainFile], { stdio: 'inherit' }).on('exit', exitMainProcess)
}

export async function dev(type: AppType) {
  const isElectron = type === 'electron'

  logger.info(TAG, `Mode: ${bgCyanBright('Development')}`)
  logger.info(TAG, `Application type: ${isElectron ? bgCyan(' electron ') : bgGreen(' node ')}`)

  const config = await resolveConfig()
  let child: ChildProcess

  let mainFile = config.main
  if (!mainFile) {
    const file = path.resolve(config.cwd, 'package.json')
    const data = require(file)
    delete require.cache[file]

    if (Object.prototype.hasOwnProperty.call(data, 'main'))
      mainFile = path.resolve(config.cwd, data.main)

    else
      throw new Error('package.json missing main field')
  }

  for (const _tsupConfig of config.tsupConfigs) {
    const { esbuildOptions: _esbuildOptions, ...tsupOptions } = _tsupConfig
    const esbuildOptions: TsupOptions['esbuildOptions'] = (options, context) => {
      _esbuildOptions?.(options, context)
      if (options.watch !== false) {
        let userOnRebuild: Function | undefined
        if (typeof options.watch === 'object')
          userOnRebuild = options.watch.onRebuild

        options.watch = {
          onRebuild(error, result) {
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

              child = runMainProcess(mainFile!, isElectron)
            }
          },
        }
      }
    }

    await tsupBuild({
      silent: true,
      esbuildOptions,
      ...tsupOptions,
    })
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

  child = runMainProcess(mainFile, isElectron)
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
