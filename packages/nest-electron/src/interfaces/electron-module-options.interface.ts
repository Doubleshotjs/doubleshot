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

export interface ElectronModuleAsyncOptions {
  name?: string | string[]
  useFactory: (...args: any[]) => Promise<ElectronModuleProviderValue> | ElectronModuleProviderValue
  inject?: any[]
  isGlobal?: boolean
}
