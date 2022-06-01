import { performance } from 'perf_hooks'
import path from 'path'
import { build as electronBuilder } from 'electron-builder'
import { build as tsupBuild } from 'tsup'
import { bgCyan, bgCyanBright, bgGreen } from 'colorette'
import { createLogger } from './log'
import { resolveConfig } from './config'
import type { AppType } from './config'
import { TAG } from './constants'

const logger = createLogger()

export async function build(type: AppType) {
  const isElectron = type === 'electron'
  const startTime = performance.now()

  logger.info(TAG, `Mode: ${bgCyanBright('Production')}`)
  logger.info(TAG, `Application type: ${isElectron ? bgCyan(' electron ') : bgGreen(' node ')}`)

  const config = await resolveConfig()

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

  for (const tsupConfig of config.tsupConfigs) {
    await tsupBuild({
      silent: true,
      ...tsupConfig,
    })
  }

  await config.afterBuild?.()

  const { electron: electronConfig } = config

  if (isElectron && electronConfig.build && electronConfig.build.disabled !== true) {
    logger.info(TAG, 'Start electron build...\n')

    await electronBuilder({
      config: electronConfig.build.config,
    })

    await electronConfig.build.afterBuild?.()
  }

  const endTime = performance.now() - startTime
  logger.success(`\n${TAG}`, `Build succeeded! (${endTime.toFixed(2)}ms)`)
}
