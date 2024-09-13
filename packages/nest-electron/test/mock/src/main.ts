import type { MicroserviceOptions } from '@nestjs/microservices'
import { NestFactory } from '@nestjs/core'
import { app } from 'electron'
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
  console.log('Electron is running')
}

bootstrap()
