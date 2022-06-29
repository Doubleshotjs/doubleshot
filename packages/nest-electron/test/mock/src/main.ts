import { BrowserWindow, app } from 'electron'
import { Test } from '@nestjs/testing'
import { AppModule } from './app.module'
import { AppController } from './app.controller'

function printTestLogs(appController: AppController) {
  const win = appController.getWindow()
  const webContents = appController.getWebContents()
  console.log(`"ElectronService.getWindow()" should return a BrowserWindow: ${win instanceof BrowserWindow}`)
  console.log(`"ElectronService.getWebContents()" should return a WebContents: ${webContents === win.webContents}`)
}

async function bootstrap() {
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
      app.quit()
  })

  process.on('SIGTERM', () => {
    app.quit()
  })

  await app.whenReady()

  console.log('Electron is running')

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  const appController = moduleRef.get<AppController>(AppController)

  printTestLogs(appController)

  // exit for testing purposes
  app.exit()
}

bootstrap()
