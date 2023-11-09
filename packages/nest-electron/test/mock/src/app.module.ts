import { join } from 'node:path'
import { Module } from '@nestjs/common'
import { BrowserWindow } from 'electron'
import { ELECTRON_WINDOW_DEFAULT_NAME, ElectronModule } from '../../../dist'
import { AppController } from './app.controller'
import { OtherController } from './other.controller'

@Module({
  imports: [
    ElectronModule.registerAsync({
      name: [ELECTRON_WINDOW_DEFAULT_NAME, 'another-win'],
      useFactory: async () => {
        const mainWin = new BrowserWindow({
          webPreferences: {
            contextIsolation: true,
            preload: join(__dirname, 'preload.js'),
          },
        })
        mainWin.on('closed', () => {
          mainWin.destroy()
        })
        mainWin.loadFile('../index.html')

        const anotherWin = new BrowserWindow({
          webPreferences: {
            contextIsolation: true,
            preload: join(__dirname, 'preload.js'),
          },
        })

        anotherWin.on('closed', () => {
          anotherWin.destroy()
        })

        anotherWin.loadFile('../another.html')

        return [mainWin, anotherWin]
      },
    }),
  ],
  controllers: [AppController, OtherController],
})
export class AppModule { }
