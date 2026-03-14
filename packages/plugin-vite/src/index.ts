import type { ElectronConfig, InlineConfig } from '@doubleshot/builder'
import type { PluginOption, ResolvedConfig, ViteDevServer } from 'vite'
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

function resolveRendererUrl(server: ViteDevServer): string | undefined {
  const address = server.httpServer?.address()
  if (!address || typeof address === 'string')
    return server.resolvedUrls?.local[0] ?? server.resolvedUrls?.network[0]

  const protocol = server.config.server.https ? 'https' : 'http'
  const base = server.config.base.startsWith('/') ? server.config.base : `/${server.config.base}`
  const hostOption = server.config.server.host
  const host = hostOption && hostOption !== true ? String(hostOption) : address.address
  const normalizedHost = host === '::' || host === '0.0.0.0' ? 'localhost' : host
  const hostname = normalizedHost.includes(':') && !normalizedHost.startsWith('[')
    ? `[${normalizedHost}]`
    : normalizedHost
  return `${protocol}://${hostname}:${address.port}${base}`
}

export function VitePluginDoubleshot(userConfig: Partial<VitePluginDoubleshotConfig> = {}): PluginOption[] {
  const PLUGIN_NAME = 'vite-plugin-doubleshot'

  let pack: (() => Promise<void>) | undefined

  // to save vite mode
  let viteMode = 'development'

  const configureForMode = async (resolvedConfig: ResolvedConfig) => {
    const { mode } = resolvedConfig
    viteMode = mode

    if (typeof userConfig.configureForMode === 'function') {
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
        // only in development mode to set rendererUrl
        if (viteMode !== 'development')
          return

        server?.httpServer?.once('listening', async () => {
          if (!userConfig.rendererUrl) {
            userConfig.rendererUrl = resolveRendererUrl(server)
              ?? server.resolvedUrls?.local[0]
              ?? server.resolvedUrls?.network[0]
          }
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
