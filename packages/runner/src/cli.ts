#!/usr/bin/env node
import { cac } from 'cac'
import { version } from '../package.json'
import { createLogger } from './log'
import { TAG } from './constants'

const cli = cac('doubleshot-run')

interface CliOptions {
  root?: string
  filter?: string // string,string,string...
}

// run
cli
  .command('[command]', 'run commands') // default command
  .option('--root <path>', 'Project root directory')
  .option('--filter <names>', 'Filter running names')
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
