import { NestFactory } from '@nestjs/core'
import type { MicroserviceOptions } from '@nestjs/microservices'
import { ElectronIpcTransport, isElectron } from '../../../dist'
import { AppModule } from './app.module'
import { testHttp } from './api'

async function startElectron() {
  if (isElectron) {
    const { app } = require('electron')
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin')
        app.quit()
    })

    process.on('SIGTERM', () => {
      app.quit()
    })

    await app.whenReady()
  }
}

async function bootstrap() {
  await startElectron()

  const nestApp = await NestFactory.create(AppModule)
  nestApp.connectMicroservice<MicroserviceOptions>({
    strategy: new ElectronIpcTransport(),
  })

  await nestApp.startAllMicroservices()

  await nestApp.listen(3000)
  if (isElectron) {
    console.log('Electron hybrid application is running')
  }
  else {
    console.log('Single node backend is running')

    await testHttp()
  }
}

bootstrap()
