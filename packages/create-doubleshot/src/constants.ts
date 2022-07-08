import {
  green,
  redBright,
} from 'colorette'
import type { Framework } from './types'

export const FRONTEND_FRAMEWORKS: Framework[] = [
  {
    name: 'vue',
    color: green,
  },
]

export const FRONTEND_FRAMEWORKS_ARR = FRONTEND_FRAMEWORKS.map(e => e.name)

export const BACKEND_FRAMEWORKS: Framework[] = [
  {
    name: 'nest',
    color: redBright,
  },
]

export const BACKEND_FRAMEWORKS_ARR = BACKEND_FRAMEWORKS.map(e => e.name)

export const RENAME_FILES: Record<string, string> = {
  _gitignore: '.gitignore',
}
