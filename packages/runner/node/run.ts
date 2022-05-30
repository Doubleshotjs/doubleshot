import path from 'path'
import type { ConcurrentlyCommandInput } from 'concurrently'
import concurrently from 'concurrently'
import { build as electronBuilder } from 'electron-builder'
import { yellow } from 'colorette'
import type { ElectronBuildConfig } from './config'
import { resolveConfig } from './config'
import { createLogger } from './log'

export async function run(command: string) {
  const logger = createLogger()
  const config = await resolveConfig()
  const commandsList: ConcurrentlyCommandInput[] = []
  const commandsWhoCanKillOthers: string[] = []

  for (const runConfig of config.run || []) {
    const { cwd, name, commands, prefixColor } = runConfig

    if (commands && commands[command]) {
      const cmd = commands[command]

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
  }

  const { result, commands } = concurrently(commandsList, {
    killOthers: ['failure'],
  })

  for (const cmd of commands) {
    const id = `[${cmd.index}][${cmd.name}]: ${cmd.command}`
    if (commandsWhoCanKillOthers.includes(id)) {
      cmd.close.subscribe(() => {
        logger.info('DSR', `Command "${yellow(id)}" exited, killing others`)
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

    logger.success('DSR', 'All commands finished successfully')
  }, () => {
    logger.warn('DSR', 'Some commands exit')
  }).finally(() => {
    logger.info('DSR', 'Exiting')
    process.exit(0)
  })
}

async function doElectronBuild(buildConfig: ElectronBuildConfig | undefined) {
  const logger = createLogger()
  try {
    await electronBuilder({
      projectDir: buildConfig?.projectDir || process.cwd(),
      config: buildConfig?.config,
    })
    logger.success('electron-builder', 'Electron build finished successfully')
  }
  catch (error) {
    console.error(error)
    logger.error('electron-builder', 'Electron build failed')
    process.exit(1)
  }
}
