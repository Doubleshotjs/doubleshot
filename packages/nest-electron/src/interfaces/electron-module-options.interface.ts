import type { ModuleMetadata } from '@nestjs/common'
import type { BrowserWindow } from 'electron'

export interface ElectronModuleWindowInfo {
  name?: string
  win: BrowserWindow
}

export interface ElectronModuleOptions {
  name?: string
  win: BrowserWindow | ElectronModuleWindowInfo[]
  isGlobal?: boolean
}

export type ElectronModuleProviderValue = BrowserWindow | BrowserWindow[] | { win: BrowserWindow }

/**
 * Async options for ElectronModule registration with dependency injection support
 *
 * @example
 * ```ts
 * ElectronModule.registerAsync({
 *   imports: [ConfigModule],
 *   useFactory: async (configService: ConfigService) => {
 *     const url = configService.get('APP_URL')
 *     const win = new BrowserWindow()
 *     win.loadURL(url)
 *     return win
 *   },
 *   inject: [ConfigService]
 * })
 * ```
 */
export interface ElectronModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  name?: string | string[]
  /**
   * Factory function that creates the BrowserWindow(s)
   * Parameters will be injected based on the `inject` array
   */
  useFactory: (...args: any[]) => Promise<ElectronModuleProviderValue> | ElectronModuleProviderValue
  /**
   * Array of tokens to inject into the factory function
   * The order must match the parameters of useFactory
   */
  inject?: any[]
  isGlobal?: boolean
}
