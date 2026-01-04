import { Injectable } from '@nestjs/common'

@Injectable()
export class ConfigService {
  get<T = any>(key: string): T | undefined {
    // Simple config service example
    const config: Record<string, any> = {
      APP_URL: 'http://localhost:3000',
      APP_TITLE: 'Electron App',
    }
    return config[key] as T
  }
}
