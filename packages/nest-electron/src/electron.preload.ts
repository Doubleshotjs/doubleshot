import { ipcRenderer } from 'electron'
import type { IpcResponse } from './electron.transport'

export async function invoke<TResult = any, TArg = any>(channel: string, ...args: TArg[]): Promise<TResult> {
  const { data, error }: IpcResponse<TResult> = await ipcRenderer.invoke(channel, ...args)

  if (error)
    throw error

  return data
}
