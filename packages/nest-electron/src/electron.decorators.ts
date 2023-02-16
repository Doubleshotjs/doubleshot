import { Inject, applyDecorators } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { ipcMain } from 'electron'
import { ELECTRON_WINDOW, ELECTRON_WINDOW_DEFAULT_NAME, IPC_HANDLE, IPC_ON } from './electron.constants'
import { ipcMessageDispatcher } from './transport'

/**
 * Ipc handle decorator. It will be called by ipcRenderer.invoke
 *
 *
 * WARNING: You should handle your exception manually.
 * Example:
 *   1. Return custom structure object throw RpcException instead of Error
 *   2. Parse the return object to target value/exception in preload.js
 *
 *
 * Limitations: You could only pass all your parameters inside first parameter slot.
 * Example:
 *   1. ipcRenderer.invoke('app.message', 'hello', 'word'); // @Payload will only received 'hello'
 *   2. ipcRenderer.invoke('app.message', {title: 'hello', message: 'word'}); // This is the proper way to pass more than one parameters.
 */
export function Ipc(channel: string) {
  if (!channel)
    throw new Error('ipc handle channel is required')

  ipcMain.handle(channel, (...args) => ipcMessageDispatcher.emit(channel, IPC_HANDLE, ...args))

  return MessagePattern(channel)
}

/**
 * Ipc handle decorator. It will be called by ipcRenderer.invoke
 *
 * ipcMain.handle --> @IpcHandle
 *
 *
 * WARNING: You should handle your exception manually.
 * Example:
 *   1. Return custom structure object throw RpcException instead of Error
 *   2. Parse the return object to target value/exception in preload.js
 *
 *
 * WARNING: All args will wrap in an array until function call.
 * Example:
 *    1. @Payload will no work correctly in this case.
 *    2. Another MethodDecorator will received args wrap as args[0][0]
 */
export function IpcHandle(channel: string) {
  if (!channel)
    throw new Error('ipc handle channel is required')

  ipcMain.handle(channel, (...args) => ipcMessageDispatcher.emit(channel, IPC_HANDLE, ...args))

  // Do not modify the order!
  return applyDecorators(
    MultiParams(),
    MessagePattern(channel),
  )
}

/**
 * Ipc on decorator. It will be called by ipcRenderer.send/sendSync
 *
 * ipcMain.on --> @IpcOn
 *
 *
 * WARNING: You should handle your exception manually.
 * Example:
 *   1. Return custom structure object throw RpcException instead of Error.
 *   2. Parse the return object to target value/exception in preload.js.
 *
 *
 * Warning: All args will wrap in an array until function call.
 * Example:
 *    1. @Payload will no work correctly in this case.
 *    2. Another MethodDecorator will received args wrap as args[0][0]
 */
export function IpcOn(channel: string) {
  if (!channel)
    throw new Error('ipc on channel is required')

  ipcMain.on(channel, (...args) => ipcMessageDispatcher.emit(channel, IPC_ON, ...args))

  // Do not modify the order!
  return applyDecorators(
    MultiParams(),
    MessagePattern(channel),
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
