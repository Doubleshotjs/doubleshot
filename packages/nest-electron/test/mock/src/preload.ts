import { contextBridge, ipcRenderer } from 'electron'
import { invoke } from '../../../src/electron.preload'

const electronIpc = {
  chat: (msg: string) => invoke<string>('chat', msg),
  throwError: () => invoke<void>('error'),
  throwCustomError: () => invoke<void>('custom-error'),
  printLog: (log: string): void => ipcRenderer.send('print-log', log),
  sendMultiParams: (param1: string, param2: string): void => ipcRenderer.send('multi-params', param1, param2),
  exit: (): void => ipcRenderer.send('exit'),
}

contextBridge.exposeInMainWorld('electron', electronIpc)
export type ElectronIPC = typeof electronIpc
