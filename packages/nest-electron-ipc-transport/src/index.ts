import { Logger } from '@nestjs/common'
import type { CustomTransportStrategy, MessageHandler } from '@nestjs/microservices'
import { Server } from '@nestjs/microservices'
import { ipcMessageDispatcher } from './dispatcher'

export interface IpcResponse<T> {
  data: T
  error?: any
}

export class ElectronIpcTransport extends Server implements CustomTransportStrategy {
  protected readonly logger = new Logger(ElectronIpcTransport.name)

  async onMessage(messageChannel: string, ...args: any[]): Promise<IpcResponse<any>> {
    const handler: MessageHandler | undefined = this.messageHandlers.get(messageChannel)
    if (!handler) {
      const errMsg = `No handler for message channel "${messageChannel}"`
      this.logger.warn(errMsg)
      throw new Error(errMsg)
    }

    try {
      this.logger.debug(`Process message ${messageChannel}`)
      const [ipcMainEventObject, ...payload] = args
      const newArgs = [
        ...payload,
        {
          evt: ipcMainEventObject,
        },
      ]

      const result = await handler.apply(this, newArgs)

      return {
        data: result,
      }
    }
    catch (error) {
      this.logger.error(error)
      return {
        data: undefined,
        error,
      }
    }
  }

  close(): any {
  }

  listen(callback: () => void): any {
    ipcMessageDispatcher.on('ipc-message', this.onMessage.bind(this))
    callback()
  }
}

export * from './decorators'
