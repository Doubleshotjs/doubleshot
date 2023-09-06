import type { IpcOptions } from '../interfaces'

interface MapData {
  target: object
  key: string | symbol
  channel: string
  opts?: IpcOptions
}

export const ChannelMaps = new Map<string, MapData>()
