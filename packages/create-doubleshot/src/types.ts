import type { Color } from 'colorette'

export interface Framework {
  name: string
  color: Color
}

export interface PromptsResult {
  overwrite
  packageName: string
  frontendFramework: string
  backendFramework: string
}
