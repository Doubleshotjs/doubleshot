import { Controller } from '@nestjs/common'
import { app } from 'electron'
import { IpcInvoke } from '../../../dist'

@Controller()
export class AppController {
  @IpcInvoke('chat')
  chat(msg: string) {
    console.log(`Get message from frontend: ${msg}`)
    return 'This is a message to frontend'
  }

  @IpcInvoke('print-log')
  printLog(log: string) {
    console.log(`Get log: ${log}`)
  }

  @IpcInvoke('exit')
  exit() {
    console.log('Electron exiting...')
    setTimeout(() => {
      app.quit()
    }, 500)
  }
}
