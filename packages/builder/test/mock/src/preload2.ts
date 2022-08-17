import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld(
  'isElectron',
  true,
)
