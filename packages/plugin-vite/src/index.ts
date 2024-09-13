import type { ElectronConfig, InlineConfig } from '@doubleshot/builder'
import type { PluginOption, ResolvedConfig } from 'vite'
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

function useUntil(timeout?: number) {
  let untilResolve: () => void
  let untilReject: (error: Error) => void

  const untilPromise = new Promise<void>((resolve, reject) => {
    untilResolve = resolve
    untilReject = reject
  })

  let timer: NodeJS.Timeout
  if (typeof timeout === 'number' && timeout > 0) {
    timer = setTimeout(() => {
      untilReject(new Error('Until timeout'))
    }, timeout)
  }

  const done = () => {
    timer && clearTimeout(timer)
    untilResolve()
  }

  const until = () => untilPromise

  return { until, done }
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

        const { until, done } = useUntil(10 * 1000) // 10s timeout
        const printUrls = server.printUrls.bind(server)
        // override printUrls to get rendererUrl
        server.printUrls = () => {
          printUrls()
          if (!userConfig.rendererUrl)
            userConfig.rendererUrl = server.resolvedUrls!.local[0]
          done()
        }

        server?.httpServer?.on('listening', async () => {
          await until()
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
