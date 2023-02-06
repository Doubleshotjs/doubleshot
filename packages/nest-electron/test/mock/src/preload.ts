import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld(
  'electron',
  {
    chat: (msg: string): Promise<string> => ipcRenderer.invoke('chat', msg),
    printLog: (log: string): void => ipcRenderer.send('print-log', log),
    sendMultiParams: (param1: string, param2: string): void => ipcRenderer.send('multi-params', param1, param2),
    exit: (): void => ipcRenderer.send('exit'),
  },
)

contextBridge.exposeInMainWorld(
  'custom',
  {
    chat: (msg: string): Promise<string> => ipcRenderer.invoke('/custom-prefix/chat', msg),
  },
)
