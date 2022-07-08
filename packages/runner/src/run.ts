import path from 'path'
import { performance } from 'perf_hooks'
import type { ConcurrentlyCommandInput } from 'concurrently'
import concurrently from 'concurrently'
import { yellow } from 'colorette'
import { checkPackageExists } from 'check-package-exists'
import type { ElectronBuildConfig, RunCommandInfo } from './config'
import { resolveConfig } from './config'
import { createLogger } from './log'
import { TAG } from './constants'

export async function run(command: string) {
  const logger = createLogger()
  const config = await resolveConfig()
  const commandsList: ConcurrentlyCommandInput[] = []
  const commandsWhoCanKillOthers: string[] = []

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
      cwd: cwd || config.root,
      name: name || (cwd ? path.basename(cwd) : undefined),
      prefixColor,
    }

    if (typeof cmd === 'string') {
      commandsList.push({
        ...base,
        command: cmd,
      })
    }
    else if (typeof cmd === 'object') {
      const len = commandsList.push({
        ...base,
        ...cmd,
      })

      if (cmd.killOthersWhenExit)
        commandsWhoCanKillOthers.push(`[${len - 1}][${cmd.name || base.name}]: ${cmd.command}`)
    }
  }

  const { result, commands } = concurrently(commandsList, {
    killOthers: ['failure'],
  })

  for (const cmd of commands) {
    const id = `[${cmd.index}][${cmd.name}]: ${cmd.command}`
    if (commandsWhoCanKillOthers.includes(id)) {
      cmd.close.subscribe(() => {
        logger.info(TAG, `Command "${yellow(id)}" exited, killing others`)
        commands.forEach((c) => {
          if (`[${c.index}]${c.name}:${c.command}` !== id)
            c.kill('0')
        })
      })
    }
  }

  result.then(async () => {
    if (
      config.electronBuild
      && config.electronBuild.disabled !== true
      && config.electronBuild.commandName === command
    )
      await doElectronBuild(config.electronBuild)

    logger.success(TAG, 'All commands finished successfully')
  }, () => {
    logger.warn(TAG, 'Some commands exit')
  }).catch((e) => {
    logger.error(TAG, e)
  }).finally(() => {
    logger.info(TAG, 'Exiting...')
    process.exit(0)
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
