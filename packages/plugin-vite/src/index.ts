import type { PluginOption, ResolvedConfig } from 'vite'
import type { ElectronConfig, InlineConfig } from '@doubleshot/builder'
import { build, dev } from '@doubleshot/builder'

export { defineConfig } from '@doubleshot/builder'

export interface VitePluginDoubleshotConfig extends Omit<InlineConfig, 'rendererUrl' | 'electron'> {
  /**
   * Renderer process url on development mode
   */
  rendererUrl?: string
  /**
   * Some configuration for electron
   */
  electron?: Omit<ElectronConfig, 'rendererUrl'> & {
    rendererUrl?: string
  }
  /**
   * This hook can override the plugin config by Vite mode ('development' or 'production')
   */
  configureForMode: (userConfig: InlineConfig, mode: string) => (void | InlineConfig) | Promise<(void | InlineConfig)>
}

export function VitePluginDoubleshot(userConfig: Partial<VitePluginDoubleshotConfig> = {}): PluginOption[] {
  const PLUGIN_NAME = 'vite-plugin-doubleshot'

  let pack: (() => Promise<void>) | undefined

  const configureForMode = async (resolvedConfig: ResolvedConfig) => {
    if (typeof userConfig.configureForMode === 'function') {
      const { mode } = resolvedConfig
      await userConfig.configureForMode(userConfig, mode)
    }
  }

  const isDebug = process.argv.includes('--dsb-debug')
  // enable debug mode
  userConfig.debug = isDebug

  return [
    {
      name: `${PLUGIN_NAME}:serve`,
      apply: 'serve',
      configResolved: async (resolvedConfig) => {
        await configureForMode(resolvedConfig)
      },
      configureServer(server) {
        const printUrls = server.printUrls.bind(server)
        // override printUrls to get rendererUrl
        server.printUrls = () => {
          printUrls()
          if (!userConfig.rendererUrl)
            userConfig.rendererUrl = server.resolvedUrls!.local[0]
        }

        server?.httpServer?.on('listening', async () => {
          await dev(userConfig)
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
