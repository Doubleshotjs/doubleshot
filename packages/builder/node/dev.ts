import type { ChildProcess } from 'child_process'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import type { Options as TsupOptions } from 'tsup'
import { build as tsupBuild } from 'tsup'
import electron from 'electron'
import { bgCyan, bgCyanBright, bgGreen } from 'colorette'
import { resolveConfig } from './config'
import type { AppType } from './config'
import { createLogger } from './log'
import { TAG } from './constants'

const logger = createLogger()

function exitMainProcess() {
  logger.warn(TAG, 'Main process exit')
  process.exit(0)
}

function runMainProcess(mainFile: string, type: AppType = 'node') {
  if (!fs.existsSync(mainFile))
    throw new Error(`Main file not found: ${mainFile}`)

  logger.success(TAG, `⚡ Run main file: ${path.basename(mainFile)}`)
  return spawn(type === 'electron' ? electron as any : 'node', [mainFile], { stdio: 'inherit' }).on('exit', exitMainProcess)
}

export async function dev(type: AppType) {
  logger.info(TAG, `Mode: ${bgCyanBright('Development')}`)
  logger.info(TAG, `Application type: ${type === 'electron' ? bgCyan(' electron ') : bgGreen(' node ')}`)

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

              child = runMainProcess(mainFile!, type)
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

  child = runMainProcess(mainFile, type)
}
