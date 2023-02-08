import { Controller } from '@nestjs/common'
import { BrowserWindow, app } from 'electron'
import { IpcHandle, IpcOn, Window } from '../../../dist'

@Controller()
export class AppController {
  constructor(
    @Window() private readonly win: BrowserWindow,
    @Window('another-win') private readonly anotherWin: BrowserWindow,
  ) {
    if (this.win instanceof BrowserWindow)
      console.log('Inject BrowserWindow successfully')

    if (this.anotherWin instanceof BrowserWindow)
      console.log('Inject another BrowserWindow successfully')
  }

  @IpcHandle('chat')
  chat(msg: string) {
    console.log(`Get message from frontend: ${msg}`)
    return 'This is a message to frontend'
  }

  @IpcHandle('error')
  throwError() {
    throw new Error('This is an error')
  }

  @IpcOn('print-log')
  printLog(log: string) {
    console.log(`Get log: ${log}`)
  }

  @IpcOn('multi-params')
  multiParams(param1: string, param2: string) {
    console.log(`param1: ${param1}`)
    console.log(`param2: ${param2}`)

    this.printLog('Direct call function')
  }

  @IpcOn('exit')
  exit() {
    console.log('Electron exiting...')
    setTimeout(() => {
      app.quit()
    }, 500)
  }
}
