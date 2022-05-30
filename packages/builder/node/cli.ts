import { cac } from 'cac'
import { version } from '../package.json'
import { createLogger } from './log'
const cli = cac('doubleshot-build')

cli
  .option('-c, --config <file>', '[string] use specified config file')

// dev
cli
  .command('', 'run in development mode') // default command
  .alias('dev') // alias to align with the script name
  .action(async () => {
    const logger = createLogger()
    const { dev } = await import('./dev')

    try {
      await dev()
    }
    catch (e) {
      logger.error('DSB', e)
      process.exit(1)
    }
  })

cli.help()
cli.version(version)

cli.parse()
