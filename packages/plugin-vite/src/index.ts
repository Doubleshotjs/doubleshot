import type { AddressInfo } from 'net'
import type { Plugin } from 'vite'
import type { InlineConfig } from '@doubleshot/builder'
import { build, dev } from '@doubleshot/builder'

export interface VitePluginDoubleshotConfig extends InlineConfig { }

export function VitePluginDoubleshot(userConfig: VitePluginDoubleshotConfig = {}): Plugin[] {
  const PLUGIN_NAME = 'vite-plugin-doubleshot'

  let pack: (() => Promise<void>) | undefined
  return [
    {
      name: `${PLUGIN_NAME}:serve`,
      apply: 'serve',
      configureServer(server) {
        server?.httpServer?.on('listening', async () => {
          if (server.httpServer) {
            const { address, port } = server.httpServer.address() as AddressInfo
            userConfig.rendererUrl = `http://${address}:${port}`
          }

          dev(userConfig)
        })
      },
    },
    {
      name: `${PLUGIN_NAME}:build`,
      apply: 'build',
      async configResolved() {
        pack = await build(userConfig, false)
      },
      async closeBundle() {
        await pack?.()
      },
    },
  ]
}
