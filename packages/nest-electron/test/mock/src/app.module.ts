import { join } from 'path'
import { Module } from '@nestjs/common'
import { BrowserWindow } from 'electron'
import { ElectronModule } from '../../../dist'
import { AppController } from './app.controller'
import { CustomPrefixController } from './custom-prefix.controller'

@Module({
  imports: [
    ElectronModule.registerAsync({
      // name: 'main', // default window names "main"
      useFactory: async () => {
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
    ElectronModule.registerAsync({
      name: 'another-win',
      useFactory: async () => {
        const win = new BrowserWindow({
          webPreferences: {
            contextIsolation: true,
            preload: join(__dirname, 'preload.js'),
          },
        })

        win.on('closed', () => {
          win.destroy()
        })

        win.loadFile('../another.html')

        return { win }
      },
    }),
  ],
  controllers: [AppController, CustomPrefixController],
})
export class AppModule { }
