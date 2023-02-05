import { Logger } from '@nestjs/common'
import type { CustomTransportStrategy, MessageHandler } from '@nestjs/microservices'
import { Server } from '@nestjs/microservices'
import { IPC_HANDLE } from './electron.constants'
import { ipcMessageDispatcher } from './transport'

export class ElectronIpcTransport extends Server implements CustomTransportStrategy {
  protected readonly logger: Logger

  constructor(name: string = ElectronIpcTransport.name) {
    super()
    this.logger = new Logger(name)
  }

  onMessage(messageChannel: string, type: string, ...args: any[]): Promise<any> {
    try {
      const handler: MessageHandler | undefined = this.messageHandlers.get(messageChannel)
      if (!handler) {
        const errMsg = `No handler for message channel "${messageChannel}"`
        this.logger.warn(errMsg)
        throw new Error(errMsg)
      }

      this.logger.log(`[${type === IPC_HANDLE ? 'ipcMain.handle' : 'ipcMain.on'}] Process message ${messageChannel}`)
      const [ipcMainEventObject, ...payload] = args
      const newArgs = [
        ...payload,
        {
          evt: ipcMainEventObject,
        },
      ]

      return handler(newArgs)
    }
    catch (error) {
      this.logger.error(error)
      throw error
    }
  }

  close(): any {
  }

  listen(callback: () => void): any {
    ipcMessageDispatcher.on('ipc-message', this.onMessage.bind(this))
    callback()
  }
}
