import { EventEmitter } from 'events'

class IPCMessageDispatcher extends EventEmitter {
  emit(messageChannel: string, type: string, ...args: any[]): any {
    const [ipcHandler] = this.listeners('ipc-message')

    if (ipcHandler)
      return Reflect.apply(ipcHandler, this, [messageChannel, type, ...args])
  }
}

export const ipcMessageDispatcher = new IPCMessageDispatcher()
