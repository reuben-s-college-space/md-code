const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, '../icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  })

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  mainWindow.on('page-title-updated', (e) => e.preventDefault())
}

function openFileInWindow(filePath) {
  if (mainWindow) {
    mainWindow.webContents.send('open-file', filePath)
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
}

function getFilePathFromArgs(argv) {
  return argv.find(a => {
    const lower = a.toLowerCase()
    return lower.endsWith('.md') || lower.endsWith('.markdown')
  })
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    const filePath = getFilePathFromArgs(commandLine)
    if (filePath) openFileInWindow(filePath)
    else if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.on('open-file', (event, filePath) => {
    event.preventDefault()
    openFileInWindow(filePath)
  })

  ipcMain.handle('read-file', async (_event, filePath) => {
    return await fs.promises.readFile(filePath, 'utf-8')
  })

  app.whenReady().then(() => {
    createWindow()
    const filePath = getFilePathFromArgs(process.argv)
    if (filePath) openFileInWindow(filePath)
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
