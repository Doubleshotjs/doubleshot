#!/usr/bin/env node
import { cac } from 'cac'
import { version } from '../package.json'
import { TAG } from './constants'
import { createLogger } from './log'

const cli = cac('doubleshot-run')

interface CliOptions {
  root?: string
  filter?: string // string,string,string...
  only?: string // string,string,string...
  disableElectronBuild?: boolean
  electronBuildPublish?: string
}

// run
cli
  .command('[command]', 'run commands') // default command
  .option('--root <path>', 'Project root directory')
  .option('--filter <names>', 'Filter running names')
  .option('--only <names>', 'Only run special names')
  .option('--disable-electron-build', 'Disable electron build')
  .option('--electron-build-publish <policy>', 'Electron build publish policy, support onTag, onTagOrDraft, always, never')
  .action(async (command: string, options: CliOptions) => {
    const logger = createLogger()
    if (!command) {
      logger.error('doubleshot runner needs a command')
      process.exit(1)
    }

    logger.success(TAG, `v${version}`)

    const { run } = await import('./run')

    try {
      await run(command, {
        root: options.root,
        filter: options.filter?.split(','),
        only: options.only?.split(','),
        disableElectronBuild: options.disableElectronBuild,
        electronBuildPublish: options.electronBuildPublish as any,
      })
    }
    catch (e) {
      logger.error(TAG, e)
      process.exit(1)
    }
  })

cli.help()
cli.version(version)

cli.parse()
