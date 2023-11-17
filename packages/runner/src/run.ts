import path from 'node:path'
import { performance } from 'node:perf_hooks'
import type { ConcurrentlyCommandInput } from 'concurrently'
import concurrently from 'concurrently'
import { magenta, red, yellow } from 'colorette'
import { checkPackageExists } from 'check-package-exists'
import type { CommandHook, ElectronBuildConfig, InlineConfig, RunCommandInfo } from './config'
import { resolveConfig } from './config'
import { createLogger } from './log'
import { TAG } from './constants'
import { generateCommandToOneLine } from './utils'

interface BeforeRunHooks {
  functions: ({ rIndex: number; fn: () => boolean | Promise<boolean>; result?: boolean })[]
  commands: ({ rIndex: number } & CommandHook)[]
  nodeFiles: ({ rIndex: number } & CommandHook)[]
}

export async function run(command: string, inlineConfig: InlineConfig = {}) {
  const logger = createLogger()
  const config = await resolveConfig(inlineConfig)
  const commandsList: (ConcurrentlyCommandInput & { rId: string; rIndex: number; killOthers?: boolean })[] = []
  const beforeRunHooks: BeforeRunHooks = {
    functions: [],
    commands: [],
    nodeFiles: [],
  }

  for (const runConfig of config.run || []) {
    const { cwd, name, commands, prefixColor } = runConfig

    if (!commands)
      continue

    let cmd: RunCommandInfo = commands[command]

    // if not found, try to find the command by alias
    if (!cmd) {
      for (const key in commands) {
        const _cmd = commands[key]
        if (typeof _cmd !== 'string' && _cmd.alias && _cmd.alias.includes(command)) {
          cmd = commands[key]
          break
        }
      }
    }
    if (!cmd)
      continue

    const base = {
      rIndex: commandsList.length,
      cwd: cwd || config.root,
      name: name || (cwd ? path.basename(cwd) : undefined),
      prefixColor,
    }

    let item: typeof commandsList[number] | undefined
    if (typeof cmd === 'string') {
      const oneLineCmd = generateCommandToOneLine(cmd)
      item = {
        rId: `[${base.rIndex}][${base.name}]: ${oneLineCmd}`,
        ...base,
        command: oneLineCmd,
      }
    }
    else if (typeof cmd === 'object') {
      const oneLineCmd = generateCommandToOneLine(cmd.command)
      item = {
        rId: `[${base.rIndex}][${cmd.name || base.name}]: ${oneLineCmd}`,
        ...base,
        ...cmd,
        command: oneLineCmd,
        killOthers: cmd.killOthersWhenExit,
      }

      if (typeof cmd.beforeRun === 'function') {
        beforeRunHooks.functions.push({
          rIndex: item.rIndex,
          fn: cmd.beforeRun,
        })
      }
      else if (typeof cmd.beforeRun === 'object') {
        if (cmd.beforeRun.type === 'command') {
          beforeRunHooks.commands.push({
            rIndex: item.rIndex,
            ...cmd.beforeRun,
          })
        }
        else if (cmd.beforeRun.type === 'node-file') {
          beforeRunHooks.nodeFiles.push({
            rIndex: item.rIndex,
            ...cmd.beforeRun,
          })
        }
      }
    }

    item && commandsList.push(item)
  }

  // Before run hooks
  if (beforeRunHooks.functions.length > 0 || beforeRunHooks.commands.length > 0 || beforeRunHooks.nodeFiles.length > 0) {
    logger.info(TAG, `➡️ Start ${magenta('beforeRun')} hooks ⬅️\n`)
    // run beforeRunHooks.functions first and get results
    for (const hook of beforeRunHooks.functions) {
      const result = await hook.fn()
      hook.result = result
      if (hook.result === false) {
        const item = commandsList.find(c => c.rIndex === hook.rIndex)
        if (item && item.killOthers) {
          logger.info(TAG, `Command "${yellow(item.rId)}"(${red('killOthersWhenExit')}) beforeRun hook return false, next commands will not be executed`)
          logger.info(TAG, `➡️ End ${magenta('beforeRun')} hooks ⬅️\n`)
          return
        }
      }
    }

    logger.info(TAG, `➡️ End ${magenta('beforeRun')} hooks ⬅️\n`)
  }

  const { result, commands } = concurrently(commandsList, {
    killOthers: ['failure'],
  })

  const commandsWhoCanKillOthers = commandsList.filter(c => c.killOthers).map(c => ({
    rIndex: c.rIndex,
    rId: c.rId,
  }))
  for (const cmd of commands) {
    const item = commandsWhoCanKillOthers.find(c => c.rIndex === cmd.index)
    if (item) {
      cmd.close.subscribe(() => {
        logger.info(TAG, `Command "${yellow(item.rId)}" exited, killing others`)
        commands.forEach((c) => {
          if (c.index !== item.rIndex)
            c.kill('SIGKILL')
        })
      })
    }
  }

  result.then(async (e) => {
    if (e.some(c => c.killed))
      return

    if (
      config.electronBuild
      && config.electronBuild.disabled !== true
      && config.electronBuild.commandName === command
    )
      await doElectronBuild(config.electronBuild)

    logger.success(TAG, 'All commands finished successfully')
    logger.info(TAG, 'Exiting...')
    process.exit(0)
  }, (reason) => {
    const noError = reason.some((e: any) => e.exitCode === 0)
    logger.warn(TAG, 'Some commands exit')
    logger.info(TAG, 'Exiting...')
    process.exit(noError ? 0 : 1)
  }).catch((e) => {
    logger.error(TAG, e)
    logger.info(TAG, 'Exiting...')
    process.exit(1)
  })
}

async function doElectronBuild(buildConfig: ElectronBuildConfig | undefined) {
  if (!checkPackageExists('electron-builder'))
    throw new Error('"electronBuild" config is powered by "electron-builder", please installed it via `npm i electron-builder -D`')

  const { build } = await import('electron-builder')

  const logger = createLogger()
  const startTime = performance.now()
  try {
    logger.info(`\n[${TAG}] electron-builder`, 'Start electron build...\n')
    await build({
      projectDir: buildConfig?.projectDir || process.cwd(),
      config: buildConfig?.config,
    })

    const endTime = performance.now() - startTime
    logger.success(`\n[${TAG}] electron-builder`, `Electron build finished in ${endTime.toFixed(2)}ms\n`)
  }
  catch (error) {
    logger.error(`\n[${TAG}] electron-builder`, error)
    logger.error(`\n[${TAG}] electron-builder`, 'Electron build failed\n')
    process.exit(1)
  }
}
