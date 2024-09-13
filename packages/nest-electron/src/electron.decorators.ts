import type { IpcOptions } from './interfaces'
import { applyDecorators, Inject } from '@nestjs/common'
import { EventPattern, MessagePattern } from '@nestjs/microservices'
import { ELECTRON_WINDOW, ELECTRON_WINDOW_DEFAULT_NAME, IPC_HANDLE, IPC_ON } from './electron.constants'
import { ChannelMaps } from './transport'
import { generateRandomString, isElectron } from './utils'

function createIpcDecorator(type: typeof IPC_HANDLE | typeof IPC_ON) {
  return isElectron
    ? (channel: string, opts: IpcOptions = {}) => {
        if (!channel || channel.length === 0)
          throw new Error('ipc handle channel is required')

        const channelId = `${channel}-${generateRandomString()}`

        function ipcDecorator() {
          return (target: any, key: string, _descriptor: PropertyDescriptor) => {
            ChannelMaps.set(channelId, { target, key, channel, opts })
          }
        }

        return applyDecorators(
          ipcDecorator(),
          type === IPC_HANDLE ? MessagePattern(channelId) : EventPattern(channelId),
        )
      }
    : (_channel: string, _opts?: IpcOptions) => () => { }
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
