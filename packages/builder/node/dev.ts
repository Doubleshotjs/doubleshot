import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import * as colorette from 'colorette'
import { build as tsupBuild } from 'tsup'
import electron from 'electron'
import { resolveConfig } from './config'

function exitMainProcess() {
  console.info(colorette.yellow('Main Process Exited'))
  process.exit(0)
}

function runMainProcess(mainFile: string) {
  return spawn(electron as any, [mainFile], { stdio: 'inherit' }).on('exit', exitMainProcess)
}

export async function dev() {
  const config = await resolveConfig()

  for (const tsupConfig of config.tsupConfigs) {
    await tsupBuild({
      ...tsupConfig,
    })
  }

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

  if (!fs.existsSync(mainFile))
    throw new Error(`Main File Not Found: ${mainFile}`)

  console.info(colorette.blue(`Run Main File: ${mainFile}`))

  runMainProcess(mainFile)
}
