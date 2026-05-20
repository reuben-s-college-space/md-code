const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow = null

function createWindow(filePathToOpen) {
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

  const query = filePathToOpen ? { query: { openFile: filePathToOpen } } : {}
  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'), query)
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
    const filePath = getFilePathFromArgs(process.argv)
    createWindow(filePath)
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
