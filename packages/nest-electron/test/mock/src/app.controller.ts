import type { IpcContext } from '../../../dist'
import { Controller } from '@nestjs/common'
import { Ctx, Payload } from '@nestjs/microservices'
import { app, BrowserWindow } from 'electron'
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

  @IpcHandle('data')
  sendData(@Payload() data: string, @Ctx() { ipcEvt }: IpcContext) {
    const hasIpcEvt = ipcEvt && typeof ipcEvt === 'object'
    hasIpcEvt && console.log('Get ipc event object')
    console.log(`Get data from frontend: ${data}`)
    return 'Main process received data from frontend'
  }

  @IpcHandle('error')
  throwError() {
    throw new Error('This is an error')
  }

  @IpcOn('print-log')
  printLog(@Payload() data) {
    console.log(`Get log: ${data}`)
  }

  @IpcOn('no-log-msg', { noLog: true })
  noLogMsg(@Payload() data) {
    console.log(`Get no log msg: ${data}`)
  }

  @IpcOn('not-available', { workWhenTrue: false })
  notAvailable(@Payload() data) {
    console.log(`Get not available: ${data}`)
  }

  @IpcOn('available', { workWhenTrue: true })
  available(@Payload() data) {
    console.log(`Get available: ${data}`)
  }

  @IpcOn('multi-params')
  sendMultiParams(@Payload() [param1, param2]) {
    console.log(`Get param1: ${param1}`)
    console.log(`Get param2: ${param2}`)
  }

  @IpcOn('exit')
  exit() {
    console.log('Electron exiting...')
    setTimeout(() => {
      app.quit()
    }, 3000)
  }
}
