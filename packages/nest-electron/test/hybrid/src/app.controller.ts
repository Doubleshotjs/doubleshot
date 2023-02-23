import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { type BrowserWindow as BrowserWindowType } from 'electron'
import { Ctx, Payload } from '@nestjs/microservices'
import { IpcHandle, IpcOn, Window, isElectron } from '../../../dist'

type DTO = { data: string } | string

function checkIsHttp(ctx) {
  return !!ctx?.host
}

@Controller()
export class AppController {
  constructor(
    @Window() private readonly win: BrowserWindowType,
  ) {
    if (isElectron) {
      const { BrowserWindow } = require('electron')
      if (this.win instanceof BrowserWindow)
        console.log('Inject BrowserWindow successfully')
    }
  }

  @Post('data')
  @IpcHandle('data')
  sendData(@Body() httpData: DTO, @Payload() ipcData: DTO, @Ctx() ctx) {
    const isHttp = checkIsHttp(ctx)
    console.log(`Get ${isHttp ? 'http' : 'ipc'} data from frontend: ${isHttp ? (httpData as any).data : ipcData}`)
    return 'Main process received data from frontend'
  }

  @Get('print-log/:log')
  @IpcOn('print-log')
  printLog(@Param('log') httpLog: string, @Payload() ipcLog: string, @Ctx() ctx) {
    const isHttp = checkIsHttp(ctx)
    console.log(`Get ${isHttp ? 'http' : 'ipc'} log: ${isHttp ? httpLog : ipcLog}`)
  }

  @Get('exit')
  @IpcOn('exit')
  exit() {
    setTimeout(() => {
      try {
        console.log('Electron exiting...')
        const { app } = require('electron')
        app.quit()
      }
      catch (error) {
        console.log('Node exiting...')
        process.exit(0)
      }
    }, 500)
  }
}
