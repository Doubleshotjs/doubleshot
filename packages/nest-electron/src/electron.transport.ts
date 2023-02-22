import { Logger } from '@nestjs/common'
import type { CustomTransportStrategy, MessageHandler } from '@nestjs/microservices'
import { Server } from '@nestjs/microservices'
import { IPC_HANDLE, IPC_ON } from './electron.constants'
import { ChannelMaps, ipcMessageDispatcher } from './transport'
import './nest.hacker'

export class ElectronIpcTransport extends Server implements CustomTransportStrategy {
  protected readonly logger: Logger

  constructor(name: string = ElectronIpcTransport.name) {
    super()
    this.logger = new Logger(name)
  }

  async onMessage(messageChannel: string, type: string, ...args: any[]): Promise<any | void> {
    try {
      const noHandlerError = () => {
        const errMsg = `No handler for message channel "${messageChannel}"`
        this.logger.error(errMsg)
        throw new Error(errMsg)
      }

      const channelId = ChannelMaps.get(messageChannel)
      if (!channelId)
        noHandlerError()

      const handler: MessageHandler | undefined = this.messageHandlers.get(channelId)
      if (!handler)
        noHandlerError()

      this.logger.log(`[${type === IPC_HANDLE ? 'ipcMain.handle' : 'ipcMain.on'}] Process message ${messageChannel}`)
      const [ipcEventObject, ...payload] = args

      const data = payload.length === 0 ? undefined : payload.length === 1 ? payload[0] : payload

      const result = await handler(data, { ipcEvt: ipcEventObject })

      if (type !== IPC_ON)
        return result
    }
    catch (error) {
      throw new Error(error.message ?? error)
    }
  }

  close(): any {
  }

  listen(callback: () => void): any {
    ipcMessageDispatcher.on('ipc-message', this.onMessage.bind(this))
    callback()
  }
}
