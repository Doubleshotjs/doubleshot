import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld(
  'electron',
  {
    chat: (msg: string): Promise<string> => ipcRenderer.invoke('chat', msg),
    throwError: (): Promise<void> => ipcRenderer.invoke('error'),
    printLog: (log: string): void => ipcRenderer.send('print-log', log),
    sendMultiParams: (param1: string, param2: string): void => ipcRenderer.send('multi-params', param1, param2),
    exit: (): void => ipcRenderer.send('exit'),
  },
)
