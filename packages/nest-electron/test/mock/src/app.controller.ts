import { Controller } from '@nestjs/common'
import { BrowserWindow, app } from 'electron'
import { ElectronService, IpcHandle } from '../../../dist'

@Controller()
export class AppController {
  constructor(
    private readonly electronService: ElectronService,
  ) {
    if (this.electronService instanceof ElectronService)
      console.log('ElectronService injected successfully')

    const win = this.electronService.getWindow()
    const webContents = this.electronService.getWebContents()
    console.log(`"ElectronService.getWindow()" should return a BrowserWindow: ${win instanceof BrowserWindow}`)
    console.log(`"ElectronService.getWebContents()" should return a WebContents: ${webContents === win.webContents}`)
  }

  @IpcHandle('chat')
  chat(msg: string) {
    console.log(`Get message from frontend: ${msg}`)
    return 'This is a message to frontend'
  }

  @IpcHandle('print-log')
  printLog(log: string) {
    console.log(`Get log: ${log}`)
  }

  @IpcHandle('exit')
  exit() {
    console.log('Electron exiting...')
    setTimeout(() => {
      app.quit()
    }, 500)
  }
}
