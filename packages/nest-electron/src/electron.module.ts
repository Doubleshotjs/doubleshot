import type { DynamicModule, Provider } from '@nestjs/common'
import { Logger, Module } from '@nestjs/common'
import type { ElectronModuleAsyncOptions, ElectronModuleOptions, ElectronModuleProviderValue } from './interfaces/electron-module-options.interface'
import { ELECTRON_MODULE_PROVIDER_VALUE, ELECTRON_WINDOW, ELECTRON_WINDOW_DEFAULT_NAME } from './electron.constants'
import { isElectron } from './utils'

@Module({})
export class ElectronModule {
  private static isMainNameUsed = false

  protected static readonly logger = new Logger(ElectronModule.name)

  private static getProviderName(name: any) {
    let provideName: string
    if (name === ELECTRON_WINDOW_DEFAULT_NAME || !name || typeof name !== 'string') {
      if (ElectronModule.isMainNameUsed) {
        throw new Error(`Default name "${ELECTRON_WINDOW_DEFAULT_NAME}" has been used, please specify a name for the window`)
      }
      else {
        provideName = `${ELECTRON_WINDOW}:${ELECTRON_WINDOW_DEFAULT_NAME}`
        ElectronModule.isMainNameUsed = true
      }
    }
    else {
      provideName = `${ELECTRON_WINDOW}:${name}`
    }
    return provideName
  }

  static register(options: ElectronModuleOptions): DynamicModule {
    !isElectron && ElectronModule.logger.warn('Not in Electron environment, all providers from ElectronModule will be null')

    const providers: Provider[] = []
    const exportNames: string[] = []

    if (Array.isArray(options.win)) {
      for (const { name, win } of options.win) {
        const provideName = ElectronModule.getProviderName(name)
        providers.push({
          provide: provideName,
          useValue: isElectron ? win : null,
        })
        exportNames.push(provideName)
      }
    }
    else {
      const provideName = `${ELECTRON_WINDOW}:${options.name || ELECTRON_WINDOW_DEFAULT_NAME}`
      providers.push({
        provide: provideName,
        useValue: isElectron ? options.win : null,
      })
      exportNames.push(provideName)
    }

    return {
      module: ElectronModule,
      providers,
      exports: exportNames,
      global: !!options.isGlobal,
    }
  }

  static registerAsync(options: ElectronModuleAsyncOptions): DynamicModule {
    !isElectron && ElectronModule.logger.warn('Not in Electron environment, all providers from ElectronModule will be null')

    const provideName = `${ELECTRON_WINDOW}:${options.name || ELECTRON_WINDOW_DEFAULT_NAME}`
    const providers: DynamicModule['providers'] = []
    if (isElectron) {
      const { BrowserWindow } = require('electron')
      providers.push(
        {
          provide: provideName,
          useFactory: (value: ElectronModuleProviderValue) => value instanceof BrowserWindow ? value : value.win,
          inject: [ELECTRON_MODULE_PROVIDER_VALUE],
        },
        {
          provide: ELECTRON_MODULE_PROVIDER_VALUE,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      )
    }
    else {
      providers.push({
        provide: provideName,
        useValue: null,
      })
    }

    return {
      module: ElectronModule,
      providers,
      exports: [provideName],
      global: options.isGlobal,
    }
  }
}
