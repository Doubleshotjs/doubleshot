import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron'

export interface IpcContext {
  ipcEvt: IpcMainEvent | IpcMainInvokeEvent
}

export interface IpcOptions {
  noLog?: boolean
}
