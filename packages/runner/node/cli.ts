import { cac } from 'cac'
import { version } from '../package.json'
import { createLogger } from './log'

const cli = cac('doubleshot-run')
// run
cli
  .command('[command]', 'run commands') // default command
  .action(async (command: string) => {
    const logger = createLogger()
    if (!command) {
      logger.error('doubleshot runner needs a command')
      process.exit(1)
    }

    logger.success('DSR', `v${version}`)

    const { run } = await import('./run')

    try {
      await run(command)
    }
    catch (e) {
      logger.error(e)
      process.exit(1)
    }
  })

cli.help()
cli.version(version)

cli.parse()
