import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld(
  'electron',
  {
    // app.controller.ts
    sendData: (data: string): Promise<string> => ipcRenderer.invoke('data', data),
    printLog: (log: string): void => ipcRenderer.send('print-log/', log),
    exit: (): void => ipcRenderer.send('/exit/'),
  },
)
