const { contextBridge, webUtils } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getPathForFile: (file) => webUtils.getPathForFile(file)
})
