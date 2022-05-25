import type { BrowserWindow } from 'electron'
import type { ModuleMetadata, Type } from '@nestjs/common'

export interface ElectronModuleOptions {
  win: BrowserWindow
}

export interface ElectronWindowOptionsFactory {
  createElectronWindowOptions(): Promise<ElectronModuleOptions> | ElectronModuleOptions
}

export interface ElectronModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<ElectronWindowOptionsFactory>
  useClass?: Type<ElectronWindowOptionsFactory>
  useFactory?: (...args: any[]) => Promise<ElectronModuleOptions> | ElectronModuleOptions
  inject?: any[]
}
