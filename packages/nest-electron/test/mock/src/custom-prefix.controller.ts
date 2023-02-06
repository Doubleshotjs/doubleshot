import { Controller } from '@nestjs/common'
import { IpcHandle } from '../../../dist'

@Controller('/custom-prefix')
export class CustomPrefixController {
  @IpcHandle('chat')
  chat(msg: string) {
    console.log(`Get message from frontend with controller prefix: ${msg}`)
    return 'This is a message to frontend'
  }
}
