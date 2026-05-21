const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow = null
let pendingOpenFile = null
let pendingOpenFilesQueue = []  // Queue for files opened before renderer ready

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

  const fileToLoad = filePathToOpen || pendingOpenFile
  pendingOpenFile = null
  const query = fileToLoad ? { query: { openFile: encodeURIComponent(fileToLoad) } } : {}
  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'), query)
  mainWindow.on('page-title-updated', (e) => e.preventDefault())

  // FIX P0/P2: Wait for renderer to be ready before sending queued IPC files
  mainWindow.webContents.on('did-finish-load', () => {
    // Flush any queued files from second-instance / open-file events
    if (pendingOpenFilesQueue.length > 0) {
      for (const filePath of pendingOpenFilesQueue) {
        mainWindow.webContents.send('open-file', filePath)
      }
      pendingOpenFilesQueue = []
    }
    // Also send any single pending file
    if (pendingOpenFile) {
      mainWindow.webContents.send('open-file', pendingOpenFile)
      pendingOpenFile = null
    }
  })
}

function openFileInWindow(filePath) {
  if (!mainWindow) { pendingOpenFile = filePath; return }
  // FIX P0: If renderer not ready, queue the file instead of sending IPC that gets lost
  if (!mainWindow.webContents.isLoading()) {
    mainWindow.webContents.send('open-file', filePath)
  } else {
    pendingOpenFilesQueue.push(filePath)
  }
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.focus()
}

// FIX P2-4: Added .mdx and .txt extensions; tightened path validation regex
function getFilePathFromArgs(argv) {
  return argv.slice(1).find(a => {
    if (a.startsWith('-')) return false
    const lower = a.toLowerCase()
    if (!lower.endsWith('.md') && !lower.endsWith('.markdown') && !lower.endsWith('.mdx') && !lower.endsWith('.txt')) return false
    // Tighter validation: drive letter path, Unix absolute, or UNC path
    return /^[a-z]:[\\/]/.test(lower) || lower.startsWith('/') || lower.startsWith('\\\\')
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
