#!/usr/bin/env node
import type { AppType } from './config'
import { cac } from 'cac'
import { version } from '../package.json'
import { TAG } from './constants'
import { createLogger } from './log'

const cli = cac('doubleshot-build')

// global options
interface GlobalCLIOptions {
  '--'?: string[]
  't'?: AppType
  'type'?: AppType
  'c'?: string
  'config'?: string
  'disableConfig'?: true
  'e'?: string
  'entry'?: string
  'o'?: string
  'out'?: string
  'tsconfig'?: string
  'external'?: string // string,string,string...
  'tsupConfig'?: string
  'preload'?: string
}

interface DevOptions {
  m?: string
  main?: string
  waitForRenderer?: boolean
  waitTimeout?: number
  rendererUrl?: string
  buildOnly?: boolean
  runOnly?: boolean
  debug?: boolean
}

interface BuildOptions {
  electronBuilderConfig?: string
}

cli
  .option('-t, --type <type>', 'Application type, \'node\' or \'electron\'', { default: 'node' })
  .option('-c, --config <config>', 'Specify config file')
  .option('--disable-config', 'Do not load config file')
  .option('-e, --entry <file>', 'Entry file for bundling')
  .option('-o, --out <dir>', 'Output directory')
  .option('--tsconfig <file>', 'TS config file')
  .option('--external <names>', 'External packages')
  .option('--tsup-config <file>', 'tsup config file')
  .option('--preload <file>', 'Electron preload file')

// dev
cli
  .command('', 'run in development mode')
  .alias('dev')
  .option('-m, --main <file>', 'The main file of the application')
  .option('--wait-for-renderer', 'Wait for renderer process to be ready')
  .option('--wait-timeout', 'Wait for renderer process ready timeout')
  .option('--renderer-url', 'Renderer process url, support multiple')
  .option('--build-only', 'Only prebuild files and won\'t run the application')
  .option('--run-only', 'Skip prebuild and run the application')
  .option('--debug', 'Run in debug mode')
  .action(async (options: DevOptions & GlobalCLIOptions) => {
    const logger = createLogger()
    const { dev } = await import('./main')

    try {
      await dev({
        main: options.main,
        type: options.type,
        configFile: options.disableConfig === true ? false : options.config,
        entry: options.entry,
        outDir: options.out,
        tsconfig: options.tsconfig,
        external: options.external?.split(','),
        tsupConfig: options.tsupConfig,
        preload: options.preload,
        waitForRenderer: options.waitForRenderer,
        waitTimeout: options.waitTimeout,
        rendererUrl: options.rendererUrl ? (options.rendererUrl.includes(',') ? options.rendererUrl.split(',') : options.rendererUrl) : undefined,
        buildOnly: options.buildOnly,
        runOnly: options.runOnly,
        debug: options.debug,
      })
    }
    catch (e) {
      logger.error(TAG, e)
      process.exit(1)
    }
  })

// build
cli
  .command('build', 'build for production')
  .option('--electron-builder-config <file>', 'Electron-Builder config file')
  .action(async (options: BuildOptions & GlobalCLIOptions) => {
    const logger = createLogger()
    const { build } = await import('./main')

    try {
      await build({
        electronBuilderConfig: options.electronBuilderConfig,
        type: options.type,
        configFile: options.disableConfig === true ? false : options.config,
        entry: options.entry,
        outDir: options.out,
        tsconfig: options.tsconfig,
        external: options.external?.split(','),
        tsupConfig: options.tsupConfig,
        preload: options.preload,
      })
    }
    catch (e) {
      logger.error(TAG, e)
      process.exit(1)
    }
    finally {
      process.exit()
    }
  })

cli.help()
cli.version(version)

cli.parse()
