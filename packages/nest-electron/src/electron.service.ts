import { Inject, Injectable } from '@nestjs/common'
import { BrowserWindow } from 'electron'
import { ELECTRON_MODULE_OPTIONS } from './electron.constants'
import { ElectronModuleOptions } from './interfaces/electron-module-options.interface'

@Injectable()
export class ElectronService {
  private win: BrowserWindow

  constructor(
    @Inject(ELECTRON_MODULE_OPTIONS)
    private readonly options: ElectronModuleOptions,
  ) {
    this.win = this.options.win
  }

  getWindow() {
    return this.win
  }

  getWebContents() {
    return this.win.webContents
  }
}
