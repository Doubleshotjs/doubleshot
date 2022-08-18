import type { AddressInfo } from 'net'
import type { Plugin, ResolvedConfig } from 'vite'
import type { InlineConfig } from '@doubleshot/builder'
import { build, dev } from '@doubleshot/builder'

export { defineConfig } from '@doubleshot/builder'

export interface VitePluginDoubleshotConfig extends InlineConfig {
  /**
   * This hook can override the plugin config by Vite mode ('development' or 'production')
   */
  configureForMode: (userConfig: InlineConfig, mode: string) => (void | InlineConfig) | Promise<(void | InlineConfig)>
}

export function VitePluginDoubleshot(userConfig: Partial<VitePluginDoubleshotConfig> = {}): Plugin[] {
  const PLUGIN_NAME = 'vite-plugin-doubleshot'

  let pack: (() => Promise<void>) | undefined

  const configureForMode = async (resolvedConfig: ResolvedConfig) => {
    if (typeof userConfig.configureForMode === 'function') {
      const { mode } = resolvedConfig
      await userConfig.configureForMode(userConfig, mode)
    }
  }

  return [
    {
      name: `${PLUGIN_NAME}:serve`,
      apply: 'serve',
      configResolved: async (resolvedConfig) => {
        await configureForMode(resolvedConfig)
      },
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
      async configResolved(resolvedConfig) {
        await configureForMode(resolvedConfig)
        pack = await build(userConfig, false)
      },
      async closeBundle() {
        await pack?.()
      },
    },
  ]
}
