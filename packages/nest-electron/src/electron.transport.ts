import type { CustomTransportStrategy, MessageHandler } from '@nestjs/microservices'
import { Server } from '@nestjs/microservices'
import { isObservable, lastValueFrom } from 'rxjs'
import './nest.hacker'
import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import { ipcMain } from 'electron'
import { ChannelMaps } from './transport'
import { linkPathAndChannel } from './utils'

export interface IpcContext {
  ipcEvt: IpcMainEvent | IpcMainInvokeEvent
}

export class ElectronIpcTransport extends Server implements CustomTransportStrategy {
  listen(callback: () => void): any {
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
