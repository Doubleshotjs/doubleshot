import { join } from 'node:path'
import { app, BrowserWindow } from 'electron'

const EXIT_TIME = process.env.EXIT_TIME || 1000
const isElectron = process.env.DS_APP_TYPE === 'electron'
const rendererUrl = process.env.DS_RENDERER_URL || `file://${join(__dirname, '../index.html')}`

console.log(`DEBUG MODE ENV TEST: ${process.env.isDebug}`)

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

if (isElectron) {
  console.log('This is electron app')

  const createWindow = async () => {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
    })

    await win.loadURL(rendererUrl)
  }

  app.whenReady().then(async () => {
    await createWindow()

    // exit after 1 seconds, for testing purposes
    await sleep(Number(EXIT_TIME))
    app.quit()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
      app.quit()
  })
}
else {
  console.log('This is node app')
}
