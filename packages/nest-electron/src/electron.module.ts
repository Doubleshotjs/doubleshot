import type { DynamicModule } from '@nestjs/common'
import type { ElectronModuleAsyncOptions, ElectronModuleOptions, ElectronModuleProviderValue } from './interfaces/electron-module-options.interface'
import { Logger, Module } from '@nestjs/common'
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

    const providers: DynamicModule['providers'] = []
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

    const names = Array.isArray(options.name) ? options.name : [options.name]
    const providers: DynamicModule['providers'] = []
    const exportNames: string[] = []

    if (isElectron) {
      const nameKey = Array.isArray(options.name) ? options.name.join(',') : options.name
      const preProvideName = `${ELECTRON_MODULE_PROVIDER_VALUE}:${nameKey || ELECTRON_WINDOW_DEFAULT_NAME}`
      // preProvideName is to create provider array for next window provider
      providers.push(
        {
          provide: preProvideName,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      )

      let isSingleBind = false
      for (let i = 0; i < names.length; i++) {
        const provideName = ElectronModule.getProviderName(names[i])
        providers.push({
          provide: provideName,
          useFactory: (value: ElectronModuleProviderValue) => {
            if (Array.isArray(value))
              return value[i] || null

            if (isSingleBind)
              return null

            isSingleBind = true
            return (typeof value === 'object' && 'win' in value) ? value.win : value
          },
          inject: [preProvideName],
        })
        exportNames.push(provideName)
      }
    }
    else {
      for (const name of names) {
        const provideName = ElectronModule.getProviderName(name)
        providers.push({
          provide: provideName,
          useValue: null,
        })
        exportNames.push(provideName)
      }
    }

    return {
      module: ElectronModule,
      providers,
      exports: exportNames,
      global: options.isGlobal,
    }
  }
}
