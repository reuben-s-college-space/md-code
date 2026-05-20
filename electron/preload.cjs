const { contextBridge, ipcRenderer, webUtils } = require('electron')
const path = require('path')

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getPathForFile: (file) => webUtils.getPathForFile(file),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  basename: (filePath) => path.basename(filePath),
  onOpenFile: (callback) => {
    ipcRenderer.on('open-file', (_event, filePath) => callback(filePath))
  }
})
