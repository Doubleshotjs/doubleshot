import { join } from 'node:path'
import { Module } from '@nestjs/common'
import { BrowserWindow } from 'electron'
import { ELECTRON_WINDOW_DEFAULT_NAME, ElectronModule } from '../../../dist'
import { AppController } from './app.controller'
import { ConfigModule } from './config.module'
import { ConfigService } from './config.service'
import { OtherController } from './other.controller'

@Module({
  imports: [
    ConfigModule,
    ElectronModule.registerAsync({
      name: [ELECTRON_WINDOW_DEFAULT_NAME, 'another-win'],
      useFactory: async (configService: ConfigService) => {
        const appUrl = configService.get<string>('APP_URL')
        const appTitle = configService.get<string>('APP_TITLE')

        console.log(`ConfigService injected successfully, APP_URL: ${appUrl}, APP_TITLE: ${appTitle}`)

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
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController, OtherController],
})
export class AppModule { }
