import { DynamicModule, Logger, Module, Provider } from '@nestjs/common'
import { ElectronModuleAsyncOptions, ElectronModuleOptions, ElectronModuleProviderValue } from './interfaces/electron-module-options.interface'
import { ELECTRON_MODULE_PROVIDER_VALUE, ELECTRON_WINDOW, ELECTRON_WINDOW_DEFAULT_NAME } from './electron.constants'
import { isElectron } from './utils'

@Module({})
export class ElectronModule {
  protected static readonly logger = new Logger(ElectronModule.name)
  static register(options: ElectronModuleOptions): DynamicModule {
    !isElectron && ElectronModule.logger.warn('Not in Electron environment, all providers from ElectronModule will be null')

    const provideName = `${ELECTRON_WINDOW}:${options.name || ELECTRON_WINDOW_DEFAULT_NAME}`
    const electronProvider: Provider = {
      provide: provideName,
      useValue: isElectron ? options.win : null,
    }

    return {
      module: ElectronModule,
      providers: [electronProvider],
      exports: [provideName],
      global: options.isGlobal,
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
