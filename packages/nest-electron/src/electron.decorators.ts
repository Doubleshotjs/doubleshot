import { Inject, applyDecorators } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { app, ipcMain } from 'electron'
import { ELECTRON_WINDOW, ELECTRON_WINDOW_DEFAULT_NAME, IPC_HANDLE, IPC_ON } from './electron.constants'
import { ChannelMaps, ipcMessageDispatcher } from './transport'
import { generateRandomString, linkPathAndChannel } from './utils'

function createIpcDecorator(type: typeof IPC_HANDLE | typeof IPC_ON) {
  return (channel: string) => {
    if (!channel || channel.length === 0)
      throw new Error('ipc handle channel is required')

    const channelId = `${channel}-${generateRandomString()}`

    function ipcDecorator() {
      return (target: any, _key: string, _descriptor: PropertyDescriptor) => {
        app.on('ready', () => {
          const path = Reflect.getMetadata('path', target.constructor)
          const channelNames = linkPathAndChannel(channel, path)
          const mainChannelName = channelNames[0]
          for (const channel of channelNames) {
            // These four channel names eventually converge into mainChannelName
            if (type === IPC_ON)
              ipcMain.on(channel, (...args) => ipcMessageDispatcher.emit(mainChannelName, IPC_ON, ...args))
            else if (type === IPC_HANDLE)
              ipcMain.handle(channel, (...args) => ipcMessageDispatcher.emit(mainChannelName, IPC_HANDLE, ...args))
          }

          ChannelMaps.set(mainChannelName, channelId)
        })
      }
    }

    return applyDecorators(
      ipcDecorator(),
      MessagePattern(channelId),
    )
  }
}

/**
 * Ipc handle decorator. It will be called by ipcRenderer.invoke
 *
 * ipcMain.handle --> @IpcHandle
 */
export const IpcHandle = createIpcDecorator(IPC_HANDLE)

/**
 * Ipc on decorator. It will be called by ipcRenderer.send/sendSync
 *
 * ipcMain.on --> @IpcOn
 */
export const IpcOn = createIpcDecorator(IPC_ON)

/**
 * Window decorator, help to inject window
 */
export const Window = (name = ELECTRON_WINDOW_DEFAULT_NAME): ReturnType<typeof Inject> => Inject(`${ELECTRON_WINDOW}:${name}`)
