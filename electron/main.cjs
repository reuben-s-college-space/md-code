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

  console.log('main.js - filePathToOpen:', filePathToOpen)
  const query = filePathToOpen ? { query: { openFile: encodeURIComponent(filePathToOpen) } } : {}
  console.log('main.js - query:', query)
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
  return argv.slice(1).find(a => {
    if (a.startsWith('-')) return false
    const lower = a.toLowerCase()
    if (!lower.endsWith('.md') && !lower.endsWith('.markdown')) return false
    // Basic path validity check: must include drive letter (Windows) or leading slash
    return lower.includes(':') || lower.startsWith('/') || lower.startsWith('\\')
  })
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    console.log('second-instance commandLine:', commandLine)
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
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8')
      return content
    } catch (e) {
      console.error('read-file error:', e)
      return null
    }
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
