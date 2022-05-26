import path from 'path'
import type { ConcurrentlyCommandInput } from 'concurrently'
import concurrently from 'concurrently'
import { resolveConfig } from './config'

export async function run(command: string) {
  const config = await resolveConfig()
  const commandsList: ConcurrentlyCommandInput[] = []

  for (const runConfig of config.run || []) {
    const { cwd, name, commands, prefixColor } = runConfig
    if (commands && commands[command]) {
      commandsList.push({
        cwd: cwd || config.root,
        name: name || (cwd ? path.basename(cwd) : undefined),
        prefixColor,
        command: commands[command],
      })
    }
  }

  const { result } = concurrently(commandsList, {
    killOthers: ['failure', 'success'],
    restartTries: 3,
  })

  result.then(() => { }, () => {
    process.exit(1)
  })
}
