import { Controller } from '@nestjs/common'
import { IpcHandle, IpcOn } from '../../../dist'

@Controller('other')
export class OtherController {
  constructor() { }

  @IpcHandle('send-msg')
  sendMsg([msg]: [string, any?]) {
    console.log(`Get message from frontend: ${msg}`)
    return 'Main process received message from frontend'
  }

  @IpcOn('print-other-log')
  printOtherLog([log]: [string, any?]) {
    console.log(`Get other log: ${log}`)
  }

  @IpcOn('invoke')
  invoke([channel]: [string]) {
    console.log(`invoke with ${channel}`)
  }
}
