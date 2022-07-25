import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld(
  'electronApi',
  {
    sendMsg: (msg: string): Promise<any> => ipcRenderer.invoke('msg', msg),
  },
)
