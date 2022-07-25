import { Controller } from '@nestjs/common'
import { app } from 'electron'
import { ElectronService } from '../../../dist'

@Controller()
export class AppController {
  constructor(
    private readonly electronService: ElectronService,
  ) {
    if (this.electronService instanceof ElectronService)
      console.log('ElectronService injected successfully')
  }

  getWindow() {
    return this.electronService.getWindow()
  }

  getWebContents() {
    return this.electronService.getWebContents()
  }

  exit() {
    app.quit()
  }
}
