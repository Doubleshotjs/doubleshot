import { contextBridge, ipcRenderer } from 'electron'

async function invoke<TResult = any, TArg = any>(channel: string, ...args: TArg[]): Promise<TResult> {
  const res = await ipcRenderer.invoke(channel, ...args)

  if (res.code)
    throw res

  return res.data
}

const electronIpc = {
  chat: (msg: string) => invoke<string>('chat', msg),
  ipcChat: (msg: string) => invoke<string>('ipc-chat', msg),
  throwError: () => invoke('error'),
  throwIpcError: () => invoke('ipc-error'),
  printLog: (log: string): void => ipcRenderer.send('print-log', log),
  sendMultiParams: (param1: string, param2: string): void => ipcRenderer.send('multi-params', param1, param2),
  exit: (): void => ipcRenderer.send('exit'),
}

contextBridge.exposeInMainWorld('electron', electronIpc)
export type ElectronIPC = typeof electronIpc
