import { BrowserWindow, app } from 'electron'

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  })

  win.loadFile('../index.html')
}

app.whenReady().then(() => {
  createWindow()

  // exit after 3 seconds, for testing purposes
  setTimeout(() => {
    app.exit()
  }, 3000)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin')
    app.quit()
})
