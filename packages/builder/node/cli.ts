import { cac } from 'cac'
import { version } from '../package.json'
import type { AppType } from './config'
import { createLogger } from './log'

const cli = cac('doubleshot-build')

// global options
interface GlobalCLIOptions {
  '--'?: string[]
  t?: AppType
  type?: AppType
}

cli.option('-t, --type <type>', '[string] set app type, \'node\' or \'electron\'', { default: 'node' })

// dev
cli
  .command('', 'run in development mode')
  .alias('dev')
  .action(async (options: GlobalCLIOptions) => {
    const logger = createLogger()
    const { dev } = await import('./dev')

    try {
      await dev(options.type ?? options.t ?? 'node')
    }
    catch (e) {
      logger.error('DSB', e)
      process.exit(1)
    }
  })

cli.help()
cli.version(version)

cli.parse()
