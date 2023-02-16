import { join } from 'path'
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { BrowserWindow } from 'electron'
import { ElectronModule } from '../../../dist'
import { AppController } from './app.controller'
import { ResponseInterceptor } from './interceptors/response.interceptor'
import { AllExecptionFilter } from './filters/all-exception.filter'

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
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExecptionFilter,
    },
  ],
})
export class AppModule { }
