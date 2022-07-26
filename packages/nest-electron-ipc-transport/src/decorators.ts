import { UseFilters, applyDecorators } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { ipcMain } from 'electron'
import { ipcMessageDispatcher } from './dispatcher'
import { AllExceptionsFilter } from './filter'

export function IpcInvoke(messageChannel: string) {
  ipcMain.handle(messageChannel, (...args) => ipcMessageDispatcher.emit(messageChannel, ...args))

  // Do not modify the order!
  return applyDecorators(
    MessagePattern(messageChannel),
    UseFilters(new AllExceptionsFilter()),
  )
}
