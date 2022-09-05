import { DynamicModule, Module, Provider } from '@nestjs/common'
import { ElectronModuleAsyncOptions, ElectronModuleOptions, ElectronWindowOptionsFactory } from './interfaces/electron-module-options.interface'
import { ELECTRON_MODULE_OPTIONS, ELECTRON_WINDOW, ELECTRON_WINDOW_DEFAULT_NAME } from './electron.constants'

@Module({
  providers: [{
    provide: `${ELECTRON_WINDOW}:${ELECTRON_WINDOW_DEFAULT_NAME}`,
    useFactory: (options: ElectronModuleOptions) => options.win,
    inject: [ELECTRON_MODULE_OPTIONS],
  }],
  exports: [`${ELECTRON_WINDOW}:${ELECTRON_WINDOW_DEFAULT_NAME}`],
})
export class ElectronModule {
  static register(options: ElectronModuleOptions): DynamicModule {
    const electronProvider: Provider = {
      provide: ELECTRON_MODULE_OPTIONS,
      useValue: options,
    }

    return {
      module: ElectronModule,
      providers: [electronProvider],
    }
  }

  static registerAsync(options: ElectronModuleAsyncOptions): DynamicModule {
    return {
      module: ElectronModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    }
  }

  private static createAsyncProviders(options: ElectronModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory)
      return [this.createAsyncOptionsProvider(options)]

    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ]
  }

  private static createAsyncOptionsProvider(
    options: ElectronModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: ELECTRON_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      }
    }
    return {
      provide: ELECTRON_MODULE_OPTIONS,
      useFactory: async (optionsFactory: ElectronWindowOptionsFactory) =>
        await optionsFactory.createElectronWindowOptions(),
      inject: [options.useExisting || options.useClass],
    }
  }
}
