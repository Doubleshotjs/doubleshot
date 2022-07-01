import { join } from 'path'
import { BrowserWindow, app } from 'electron'
import { NestFactory } from '@nestjs/core'
import type { MicroserviceOptions } from '@nestjs/microservices'
import { ElectronIpcTransport } from '../../../dist'
import { AppModule } from './app.module'

async function bootstrap() {
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
      app.quit()
  })

  process.on('SIGTERM', () => {
    app.quit()
  })

  await app.whenReady()

  const nestApp = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      strategy: new ElectronIpcTransport(),
    },
  )

  await nestApp.listen()

  const win = new BrowserWindow({
    webPreferences: {
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
  })

  win.on('closed', () => {
    win.destroy()
  })

  console.log('Electron is running')
  await win.loadFile('../index.html')
}

bootstrap()
