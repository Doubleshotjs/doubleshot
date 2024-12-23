import type { CloseEvent as ConcurrentlyCloseEvent, ConcurrentlyCommandInput } from 'concurrently'
import type { CommandHook, ElectronBuildConfig, InlineConfig, RunCommandInfo } from './config'
import fs from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { checkPackageExists } from 'check-package-exists'
import { magenta, red, yellow } from 'colorette'
import concurrently from 'concurrently'
import { build as esbuildBuild } from 'esbuild'
import { resolveConfig } from './config'
import { TAG } from './constants'
import { createLogger } from './log'
import { generateCommandToOneLine, getCachePath, treeKill } from './utils'

interface BeforeRunHooks {
  functions: ({ rIndex: number, fn: () => boolean | Promise<boolean>, result?: boolean })[]
  commands: ({ rIndex: number } & CommandHook)[]
  nodeFiles: ({ rIndex: number } & CommandHook)[]
}

type CommandInfo = Exclude<ConcurrentlyCommandInput, string> & { rId: string, rIndex: number, killOthers?: boolean }

export async function run(command: string, inlineConfig: InlineConfig = {}) {
  const logger = createLogger()
  const config = await resolveConfig(inlineConfig)
  const cachePath = getCachePath()
  const commandsList: CommandInfo[] = []
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

    // run beforeRunHooks.functions
    for (const fnHook of beforeRunHooks.functions) {
      if (typeof fnHook.fn !== 'function') {
        logger.warn(TAG, `beforeRun function type hook of command "${yellow(fnHook.rIndex)}" is not a function, skipped`)
        continue
      }

      const item = commandsList.find(c => c.rIndex === fnHook.rIndex)
      if (!item)
        continue

      // check result
      let hasError = false
      try {
        fnHook.result = await fnHook.fn()
      }
      catch (error) {
        logger.error(TAG, error)
        hasError = true
      }

      if (fnHook.result === false || hasError) {
        if (item.killOthers) {
          logger.info(TAG, `Command "${yellow(item.rId)}"(${red('killOthersWhenExit')}) beforeRun hook return false, next commands will not be executed`)
          logger.info(TAG, `➡️ End ${magenta('beforeRun')} hooks ⬅️\n`)
          return
        }
        else {
          logger.warn(TAG, `Command "${yellow(item.rId)}" beforeRun hook return false, next commands will still be executed`)
        }
      }
    }

    // run beforeRunHooks.commands
    for (const cmdHook of beforeRunHooks.commands) {
      if (cmdHook.type !== 'command' || typeof cmdHook.hook !== 'string') {
        logger.warn(TAG, `beforeRun hook of command "${yellow(cmdHook.rIndex)}" is not a command type, skipped`)
        continue
      }

      const item = commandsList.find(c => c.rIndex === cmdHook.rIndex)
      if (!item)
        continue

      const oneLineCmd = generateCommandToOneLine(cmdHook.hook)
      // run command
      const { result } = concurrently([oneLineCmd], {
        cwd: cmdHook.cwd || item.cwd,
      })

      // check result
      let hasError = false
      let closeEvent: ConcurrentlyCloseEvent[] = []
      try {
        closeEvent = await result
      }
      catch (error) {
        logger.error(TAG, error)
        hasError = true
      }

      if (closeEvent.some(c => c.exitCode !== 0) || hasError) {
        if (item.killOthers) {
          logger.info(TAG, `Command "${yellow(item.rId)}"(${red('killOthersWhenExit')}) beforeRun hook failed, next commands will not be executed`)
          logger.info(TAG, `➡️ End ${magenta('beforeRun')} hooks ⬅️\n`)
          return
        }
        else {
          logger.warn(TAG, `Command "${yellow(item.rId)}" beforeRun hook failed, next commands will still be executed`)
        }
      }
    }

    // run beforeRunHooks.nodeFiles
    for (const nodeFileHook of beforeRunHooks.nodeFiles) {
      if (nodeFileHook.type !== 'node-file' || typeof nodeFileHook.hook !== 'string') {
        logger.warn(TAG, `beforeRun hook of node-file "${yellow(nodeFileHook.rIndex)}" is not a 'node-file' type, skipped`)
        continue
      }

      const item = commandsList.find(c => c.rIndex === nodeFileHook.rIndex)
      if (!item)
        continue

      // check file extension is .js .cjs .mjs or .ts
      const ext = path.extname(nodeFileHook.hook)
      if (!['.js', '.cjs', '.mjs', '.ts'].includes(ext)) {
        logger.warn(TAG, `beforeRun hook of node-file "${yellow(nodeFileHook.rIndex)}" is not a valid file, skipped`)
        continue
      }

      // check file exists, if nodeFleHook.hook is absolute path, use it directly
      const hookCwd = nodeFileHook.cwd || item.cwd || process.cwd()
      const filePath = path.isAbsolute(nodeFileHook.hook)
        ? nodeFileHook.hook
        : path.resolve(hookCwd, nodeFileHook.hook)
      if (!fs.existsSync(filePath)) {
        logger.warn(TAG, `beforeRun hook of node-file "${yellow(nodeFileHook.rIndex)}" is not exists, skipped`)
        continue
      }

      // use esbuild to compile file to commonjs format file
      const tempFile = path.join(cachePath, `temp-${nodeFileHook.rIndex}-${Date.now()}-${path.basename(filePath)}.js`)
      const esbuildResult = await esbuildBuild({
        entryPoints: [filePath],
        outfile: tempFile,
        format: 'cjs',
        platform: 'node',
        bundle: false,
      })
      if (esbuildResult.errors.length > 0) {
        logger.error(TAG, `beforeRun hook of node-file "${yellow(nodeFileHook.rIndex)}" compile failed, skipped`)
        continue
      }

      // run node file
      const { result } = concurrently([`node ${tempFile}`], {
        cwd: hookCwd,
      })

      // check result
      let hasError = false
      let closeEvent: ConcurrentlyCloseEvent[] = []
      try {
        closeEvent = await result
      }
      catch (error) {
        logger.error(TAG, error)
        hasError = true
      }

      // remove temp file first
      fs.unlinkSync(tempFile)

      // check killOthers
      if (closeEvent.some(c => c.exitCode !== 0) || hasError) {
        if (item.killOthers) {
          logger.info(TAG, `Command "${yellow(item.rId)}"(${red('killOthersWhenExit')}) beforeRun hook failed, next commands will not be executed`)
          logger.info(TAG, `➡️ End ${magenta('beforeRun')} hooks ⬅️\n`)
          return
        }
        else {
          logger.warn(TAG, `Command "${yellow(item.rId)}" beforeRun hook failed, next commands will still be executed`)
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
          if (c.index !== item.rIndex) {
            treeKill(c.pid!, 'SIGINT').catch((e) => {
              logger.error(TAG, e)
            })
          }
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
    ) {
      await doElectronBuild(config.electronBuild)
    }

    logger.success(TAG, 'All commands finished successfully')
    logger.info(TAG, 'Exiting...')
    process.exit()
  }, (reason) => {
    const noError = reason.some((e: any) => e.exitCode === 0)
    logger.warn(TAG, 'Some commands exit')
    logger.info(TAG, 'Exiting...')
    process.exit(noError ? undefined : 1)
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
