import { Controller } from '@nestjs/common'
import { BrowserWindow, app } from 'electron'
import { IpcHandle, IpcOn, MultiParams, Window } from '../../../dist'

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

  @IpcHandle('data')
  sendData([data]: [string, any?]) {
    console.log(`Get data from frontend: ${data}`)
    return 'Main process received data from frontend'
  }

  @IpcHandle('error')
  throwError() {
    throw new Error('This is an error')
  }

  @IpcOn('print-log')
  printLog([log]: [string, any?]) {
    console.log(`Get log: ${log}`)
  }

  @IpcOn('multi-params')
  @MultiParams()
  multiParams(param1: string, param2: string) {
    console.log(`param1: ${param1}`)
    console.log(`param2: ${param2}`)
  }

  @IpcOn('exit')
  exit() {
    console.log('Electron exiting...')
    setTimeout(() => {
      app.quit()
    }, 500)
  }
}
