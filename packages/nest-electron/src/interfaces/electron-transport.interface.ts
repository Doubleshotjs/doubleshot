import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron'

export interface IpcContext {
  ipcEvt: IpcMainEvent | IpcMainInvokeEvent
}

export interface IpcOptions {
  /**
   * not log the message
   */
  noLog?: boolean
  /**
   * only can be called in development mode. Controlled by electron app.isPackaged (so it's only worked in electron)
   */
  devOnly?: boolean
  /**
   * Only work when the condition is true
   */
  workWhenTrue?: boolean
}
