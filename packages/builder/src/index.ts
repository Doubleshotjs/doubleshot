import { TAG } from './constants'
import type { LogType } from './log'
import { createLogger } from './log'

export * from './config'
export * from './main'

export const logger = createLogger()

export function printLog(type: LogType, ...args: any[]) {
  if (typeof logger[type] === 'function')
    // eslint-disable-next-line no-useless-call
    (logger[type]).apply(logger, [TAG, ...args])
}
