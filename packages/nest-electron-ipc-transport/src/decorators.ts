import { UseFilters, applyDecorators } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { ipcMain } from 'electron'
import { ipcMessageDispatcher } from './dispatcher'
import { AllExceptionsFilter } from './filter'

/**
 * Ipc handle decorator. It will be called by ipcRenderer.invoke
 *
 * ipcMain.handle --> @IpcHandle
 */
export function IpcHandle(messageChannel: string) {
  ipcMain.handle(messageChannel, (...args) => ipcMessageDispatcher.emit(messageChannel, ...args))

  // Do not modify the order!
  return applyDecorators(
    MessagePattern(messageChannel),
    UseFilters(new AllExceptionsFilter()),
  )
}
