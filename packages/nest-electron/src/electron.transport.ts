import type { CustomTransportStrategy, MessageHandler } from '@nestjs/microservices'
import type { IpcContext, IpcOptions } from './interfaces'
import { Logger } from '@nestjs/common'
import { Server } from '@nestjs/microservices'
import { isObservable, lastValueFrom } from 'rxjs'
import { ChannelMaps } from './transport'
import { isElectron, linkPathAndChannel } from './utils'
import './nest.hacker'

export class ElectronIpcTransport extends Server implements CustomTransportStrategy {
  protected readonly logger: Logger

  constructor(name: string = ElectronIpcTransport.name) {
    super()
    this.logger = new Logger(name)
  }

  listen(callback: () => void): any {
    if (isElectron) {
      const { ipcMain } = require('electron')
      ChannelMaps.forEach(({ target, channel, opts }, channelId) => {
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
            ipcMain.on(ch, this.applyHandler(handler, ch, opts))
          else
            ipcMain.handle(ch, this.applyHandler(handler, ch, opts))
        }
      })
    }

    callback()
  }

  private applyHandler(handler: MessageHandler, channel: string, opts: IpcOptions = {}) {
    return async (...args) => {
      try {
        const { noLog, devOnly, workWhenTrue } = opts

        // In electron, devOnly means the message is only available in development mode
        if (isElectron && devOnly) {
          const { app } = require('electron')
          // if the app is packaged, throw an error
          if (app.isPackaged) {
            throw new Error(`[IPC] Process message ${channel} is only available in development mode`)
          }
        }

        // workWhenTrue is a condition to control this channel is available or not
        if (workWhenTrue === false) {
          throw new Error(`[IPC] Process message ${channel} is not available`)
        }

        if (!noLog) {
          if (!handler.isEventHandler)
            this.logger.log(`[IPC] Process message ${channel}`)
          else
            this.logger.log(`[IPC] Process event ${channel}`)
        }

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
    // do nothing, just for the abstract method
  }

  // eslint-disable-next-line ts/no-unsafe-function-type
  on(_: string, __: Function): any {
    // do nothing, just for the abstract method
  }

  unwrap<T>(): T {
    // do nothing, just for the abstract method
    return null
  }
}
