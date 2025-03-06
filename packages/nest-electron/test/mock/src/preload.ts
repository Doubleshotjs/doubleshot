import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld(
  'electron',
  {
    // app.controller.ts
    sendData: (data: string): Promise<string> => ipcRenderer.invoke('data', data),
    throwError: (): Promise<void> => ipcRenderer.invoke('/error'),
    printLog: (log: string): void => ipcRenderer.send('print-log/', log),
    noLogMsg: (msg: string): void => ipcRenderer.send('no-log-msg', msg),
    notAvailable: (msg: string): void => ipcRenderer.send('not-available', msg),
    available: (msg: string): void => ipcRenderer.send('available', msg),
    sendMultiParams: (param1: string, param2: string): void => ipcRenderer.send('/multi-params/', param1, param2),
    exit: (): void => ipcRenderer.send('exit'),
    // other.controller.ts
    sendMsg: (msg: string): Promise<string> => ipcRenderer.invoke('other/send-msg', msg),
    printOtherLog: (log: string): void => ipcRenderer.send('other/print-other-log', log),
    invoke: (channel: string): void => ipcRenderer.send(channel, channel),
    returnObservable: (): Promise<string> => ipcRenderer.invoke('other/return-observable'),
  },
)
