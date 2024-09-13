import { join } from 'node:path'
import { app, BrowserWindow, ipcMain } from 'electron'

function createWindow() {
  const isDev = !app.isPackaged

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      preload: join(__dirname, './preload.js'),
    },
  })

  ipcMain.handle('msg', (_, msg) => {
    console.log(msg)

    app.quit()
  })

  const URL = isDev
    ? process.env.DS_RENDERER_URL!
    : `file://${join(app.getAppPath(), 'dist/renderer/index.html')}`

  win.loadURL(URL)
}

app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin')
    app.quit()
})
