import type { ExecutionContext } from '@nestjs/common'
import { Inject, UseFilters, applyDecorators } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { ipcMain } from 'electron'
import { ELECTRON_WINDOW, ELECTRON_WINDOW_DEFAULT_NAME, IPC_HANDLE, IPC_ON } from './electron.constants'
import { IpcExceptionsFilter, ipcMessageDispatcher } from './transport'

/**
 * Ipc handle decorator. It will be called by ipcRenderer.invoke
 *
 * ipcMain.handle --> @IpcHandle
 */
export function IpcHandle(channel: string, ctx: ExecutionContext) {
  if (!channel)
    throw new Error('ipc handle channel is required')

  const ctrlPrefix = Reflect.getMetadata('controller', ctx.getClass()) || ''

  const fullChannel = [ctrlPrefix, channel].join('/')

  ipcMain.handle(fullChannel, (...args) => ipcMessageDispatcher.emit(channel, IPC_HANDLE, ...args))

  // Do not modify the order!
  return applyDecorators(
    MultiParams(),
    MessagePattern(channel),
    UseFilters(new IpcExceptionsFilter()),
  )
}

/**
 * Ipc on decorator. It will be called by ipcRenderer.send/sendSync
 *
 * ipcMain.on --> @IpcOn
 */
export function IpcOn(channel: string) {
  if (!channel)
    throw new Error('ipc on channel is required')

  ipcMain.on(channel, (...args) => ipcMessageDispatcher.emit(channel, IPC_ON, ...args))

  // Do not modify the order!
  return applyDecorators(
    MultiParams(),
    MessagePattern(channel),
    UseFilters(new IpcExceptionsFilter()),
  )
}

export function MultiParams(): MethodDecorator {
  return (
    _target: object,
    _key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value
    descriptor.value = function (this: any, ...args: any[]) {
      // args is from ipc
      if (args.length > 0 && Array.isArray(args[0]) && args[0][args[0].length - 1].evt) {
        return originalMethod.apply(this, args[0])
      }
      else { // args is from direct call
        return originalMethod.apply(this, args)
      }
    }
    return descriptor
  }
}

/**
 * Window decorator, help to inject window
 */
export const Window = (name = ELECTRON_WINDOW_DEFAULT_NAME): ReturnType<typeof Inject> => Inject(`${ELECTRON_WINDOW}:${name}`)
