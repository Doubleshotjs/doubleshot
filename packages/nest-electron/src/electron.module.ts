import { DynamicModule, Module, Provider } from '@nestjs/common'
import { BrowserWindow } from 'electron'
import { ElectronModuleAsyncOptions, ElectronModuleOptions, ElectronModuleProviderValue } from './interfaces/electron-module-options.interface'
import { ELECTRON_MODULE_PROVIDER_VALUE, ELECTRON_WINDOW, ELECTRON_WINDOW_DEFAULT_NAME } from './electron.constants'

@Module({})
export class ElectronModule {
  static register(options: ElectronModuleOptions): DynamicModule {
    const provideName = `${ELECTRON_WINDOW}:${options.name || ELECTRON_WINDOW_DEFAULT_NAME}`
    const electronProvider: Provider = {
      provide: provideName,
      useValue: options.win,
    }

    return {
      module: ElectronModule,
      providers: [electronProvider],
      exports: [provideName],
    }
  }

  static registerAsync(options: ElectronModuleAsyncOptions): DynamicModule {
    const provideName = `${ELECTRON_WINDOW}:${options.name || ELECTRON_WINDOW_DEFAULT_NAME}`
    return {
      module: ElectronModule,
      providers: [
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
      ],
      exports: [provideName],
    }
  }
}
