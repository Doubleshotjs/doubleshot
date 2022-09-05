import { Controller } from '@nestjs/common'
import { BrowserWindow, app } from 'electron'
import { IpcHandle, IpcOn, Window } from '../../../dist'

@Controller()
export class AppController {
  constructor(
    @Window() private readonly win: BrowserWindow,
  ) {
    if (this.win instanceof BrowserWindow)
      console.log('Inject BrowserWindow successfully')
  }

  @IpcHandle('chat')
  chat(msg: string) {
    console.log(`Get message from frontend: ${msg}`)
    return 'This is a message to frontend'
  }

  @IpcOn('print-log')
  printLog(log: string) {
    console.log(`Get log: ${log}`)
  }

  @IpcOn('exit')
  exit() {
    console.log('Electron exiting...')
    setTimeout(() => {
      app.quit()
    }, 500)
  }
}
