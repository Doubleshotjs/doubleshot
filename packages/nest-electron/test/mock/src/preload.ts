import { contextBridge, ipcRenderer } from 'electron'
import type { IpcResponse } from '../../../dist'

contextBridge.exposeInMainWorld(
  'electron',
  {
    chat: (msg: string): Promise<IpcResponse<string>> => ipcRenderer.invoke('chat', msg),
    printLog: (log: string): Promise<IpcResponse<string>> => ipcRenderer.invoke('print-log', log),
    exit: (): Promise<IpcResponse<void>> => ipcRenderer.invoke('exit'),
  },
)
