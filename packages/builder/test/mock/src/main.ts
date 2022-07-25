import { join } from 'path'
import { BrowserWindow, app } from 'electron'

const isElectron = process.env.DS_APP_TYPE === 'electron'
const rendererUrl = process.env.DS_RENDERER_URL || `file://${join(__dirname, '../index.html')}`

if (isElectron) {
  console.log('This is electron app')

  const createWindow = () => {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
    })

    win.loadURL(rendererUrl)
  }

  app.whenReady().then(() => {
    createWindow()

    // exit after 3 seconds, for testing purposes
    setTimeout(() => {
      app.quit()
    }, 3000)
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
      app.quit()
  })
}
else {
  console.log('This is node app')
}

