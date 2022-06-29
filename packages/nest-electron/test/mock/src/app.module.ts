import { Module } from '@nestjs/common'
import { BrowserWindow } from 'electron'
import { ElectronModule } from '../../../dist'
import { AppController } from './app.controller'

@Module({
  imports: [ElectronModule.registerAsync({
    useFactory: async () => {
      const win = new BrowserWindow()

      win.on('closed', () => {
        win.destroy()
      })

      win.loadFile('../index.html')

      return { win }
    },
  })],
  controllers: [AppController],
})
export class AppModule { }
