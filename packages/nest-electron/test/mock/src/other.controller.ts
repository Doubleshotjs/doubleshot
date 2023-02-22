import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { of } from 'rxjs'
import { IpcHandle, IpcOn } from '../../../dist'

@Controller('other')
export class OtherController {
  constructor() { }

  @IpcHandle('send-msg')
  sendMsg(@Payload() msg: string) {
    console.log(`Get message from frontend: ${msg}`)
    return 'Main process received message from frontend'
  }

  @IpcOn('print-other-log')
  printOtherLog(@Payload() log: string) {
    console.log(`Get other log: ${log}`)
  }

  @IpcOn('invoke')
  invoke(@Payload() channel: string) {
    console.log(`invoke with ${channel}`)
  }

  @IpcHandle('return-observable')
  returnObservable() {
    return of('Main process return an observable')
  }
}
