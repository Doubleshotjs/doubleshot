#!/usr/bin/env node
import { cac } from 'cac'
import { version } from '../package.json'
import type { AppType } from './config'
import { TAG } from './constants'
import { createLogger } from './log'

const cli = cac('doubleshot-build')

// global options
interface GlobalCLIOptions {
  '--'?: string[]
  t?: AppType
  type?: AppType
  e?: string
  entry?: string
  o?: string
  out?: string
  tsconfig?: string
  external?: string // string,string,string...
  tsupConfig?: string
  preload?: string
  noConfigFile?: true
}

interface DevOptions {
  m?: string
  main?: string
}

interface BuildOptions {
  electronBuilderConfig?: string
}

cli
  .option('-t, --type <type>', 'Application type, \'node\' or \'electron\'', { default: 'node' })
  .option('-e, --entry <file>', 'Entry file for bundleing')
  .option('-o, --out <dir>', 'Output directory')
  .option('--tsconfig <file>', 'TS config file')
  .option('--external <names>', 'External packages')
  .option('--tsup-config <file>', 'tsup config file')
  .option('--preload <file>', 'Electron preload file')
  .option('--no-config-file', 'Do not load config file')

// dev
cli
  .command('', 'run in development mode')
  .alias('dev')
  .option('-m, --main <file>', 'The main file of the application')
  .action(async (options: DevOptions & GlobalCLIOptions) => {
    const logger = createLogger()
    const { dev } = await import('./main')

    try {
      await dev({
        main: options.main,
        type: options.type,
        entry: options.entry,
        outDir: options.out,
        tsconfig: options.tsconfig,
        external: options.external?.split(','),
        tsupConfig: options.tsupConfig,
        preload: options.preload,
        noConfigFile: options.noConfigFile,
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
        entry: options.entry,
        outDir: options.out,
        tsconfig: options.tsconfig,
        external: options.external?.split(','),
        tsupConfig: options.tsupConfig,
        preload: options.preload,
        noConfigFile: options.noConfigFile,
      })
    }
    catch (e) {
      logger.error(TAG, e)
      process.exit(1)
    }
    finally {
      process.exit(0)
    }
  })

cli.help()
cli.version(version)

cli.parse()
