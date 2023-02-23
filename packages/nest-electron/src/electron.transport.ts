import type { CustomTransportStrategy, MessageHandler } from '@nestjs/microservices'
import { Server } from '@nestjs/microservices'
import { isObservable, lastValueFrom } from 'rxjs'
import './nest.hacker'
import { Logger } from '@nestjs/common'
import { ChannelMaps } from './transport'
import { isElectron, linkPathAndChannel } from './utils'
import type { IpcContext } from './interfaces'

export class ElectronIpcTransport extends Server implements CustomTransportStrategy {
  protected readonly logger: Logger

  constructor(name: string = ElectronIpcTransport.name) {
    super()
    this.logger = new Logger(name)
  }

  listen(callback: () => void): any {
    if (isElectron) {
      const { ipcMain } = require('electron')
      ChannelMaps.forEach(({ target, channel }, channelId) => {
        const path = Reflect.getMetadata('path', target.constructor)
        const channelNames = linkPathAndChannel(channel, path)

        const handler = this.getHandlers().get(channelId)
        if (!handler) {
          const errMsg = `No handler for message channel "${channelNames[0]}"`
          this.logger.error(errMsg)
          throw new Error(errMsg)
        }

        for (const ch of channelNames) {
          if (handler.isEventHandler)
            ipcMain.on(ch, this.applyHandler(handler, ch))
          else
            ipcMain.handle(ch, this.applyHandler(handler, ch))
        }
      })
    }

    callback()
  }

  private applyHandler(handler: MessageHandler, channel: string) {
    return async (...args) => {
      try {
        if (!handler.isEventHandler)
          this.logger.log(`[IPC] Process message ${channel}`)
        else
          this.logger.log(`[IPC] Process event ${channel}`)

        const [ipcMainEventObject, ...payload] = args

        const data = payload.length === 0 ? undefined : payload.length === 1 ? payload[0] : payload
        const ctx: IpcContext = { ipcEvt: ipcMainEventObject }

        const res = await handler(data, ctx)
        return isObservable(res)
          ? await lastValueFrom(res)
          : res
      }
      catch (error) {
        throw new Error(error.message ?? error)
      }
    }
  }

  close(): any {
  }
}
