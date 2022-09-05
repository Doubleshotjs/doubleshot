import { UseFilters, applyDecorators } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { ipcMain } from 'electron'
import { IPC_HANDLE, IPC_ON } from './electron.constants'
import { IpcExceptionsFilter, ipcMessageDispatcher } from './transport'

/**
 * Ipc handle decorator. It will be called by ipcRenderer.invoke
 *
 * ipcMain.handle --> @IpcHandle
 */
export function IpcHandle(channel: string) {
  if (!channel)
    throw new Error('ipc handle channel is required')

  ipcMain.handle(channel, (...args) => ipcMessageDispatcher.emit(channel, IPC_HANDLE, ...args))

  // Do not modify the order!
  return applyDecorators(
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
    MessagePattern(channel),
    UseFilters(new IpcExceptionsFilter()),
  )
}
