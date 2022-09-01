import { Controller } from '@nestjs/common'
import { app } from 'electron'
import { IpcHandle } from '../../../dist'

@Controller()
export class AppController {
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
