import { join } from 'node:path'
import { Module } from '@nestjs/common'
import { ElectronModule, isElectron } from '../../../dist'
import { AppController } from './app.controller'

@Module({
  imports: [
    ElectronModule.registerAsync({
      useFactory: async () => {
        if (!isElectron)
          return { win: undefined }

        const { BrowserWindow } = require('electron')
        const win = new BrowserWindow({
          webPreferences: {
            contextIsolation: true,
            preload: join(__dirname, 'preload.js'),
          },
        })

        win.on('closed', () => {
          win.destroy()
        })

        win.loadFile('../index.html')

        return { win }
      },
    }),
  ],
  controllers: [AppController],
})
export class AppModule { }
