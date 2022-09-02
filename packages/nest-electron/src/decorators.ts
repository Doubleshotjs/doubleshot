import { UseFilters, applyDecorators } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { ipcMain } from 'electron'
import { IpcExceptionsFilter, ipcMessageDispatcher } from './transport'

/**
 * Ipc handle decorator. It will be called by ipcRenderer.invoke
 *
 * ipcMain.handle --> @IpcHandle
 */
export function IpcHandle(channel: string) {
  if (!channel)
    throw new Error('ipc handle channel is required')

  ipcMain.handle(channel, (...args) => ipcMessageDispatcher.emit(channel, ...args))

  // Do not modify the order!
  return applyDecorators(
    MessagePattern(channel),
    UseFilters(new IpcExceptionsFilter()),
  )
}
