import { contextBridge, ipcRenderer } from 'electron'
import type { IpcResponse } from '../../../dist'

contextBridge.exposeInMainWorld(
  'electron',
  {
    chat: (msg: string): Promise<IpcResponse<string>> => ipcRenderer.invoke('chat', msg),
    printLog: (log: string): void => ipcRenderer.send('print-log', log),
    exit: (): void => ipcRenderer.send('exit'),
  },
)
