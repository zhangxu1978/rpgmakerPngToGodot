const { contextBridge, ipcRenderer } = require('electron');

// 向渲染进程暴露安全的API
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openFiles: () => ipcRenderer.invoke('dialog:openFiles'),
  saveFile: (options) => ipcRenderer.invoke('dialog:saveFile'),
  saveDataURL: (filePath, dataURL) => ipcRenderer.invoke('fs:saveDataURL', filePath, dataURL),
  saveSlices: (sourceFilePath, slices) => ipcRenderer.invoke('fs:saveSlices', sourceFilePath, slices),
  saveSlicesWithJson: (sourceFilePath, slices, jsonData) => ipcRenderer.invoke('fs:saveSlicesWithJson', sourceFilePath, slices, jsonData),
  writeFile: (filePath, data) => ipcRenderer.invoke('fs:writeFile', filePath, data),
  checkFileExists: (filePath) => ipcRenderer.invoke('fs:checkFileExists', filePath),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  readPresetFile: (presetName) => ipcRenderer.invoke('fs:readPresetFile', presetName),

  // 菜单事件监听
  onMenuOpenFile: (callback) => ipcRenderer.on('menu:open-file', callback),
  onMenuExportPng: (callback) => ipcRenderer.on('menu:export-png', callback),
  onMenuResizeImage: (callback) => ipcRenderer.on('menu:resize-image', callback),
  onMenuRemoveBackground: (callback) => ipcRenderer.on('menu:remove-background', callback),
  onMenuSliceImage: (callback) => ipcRenderer.on('menu:slice-image', callback),
  onMenuCombineImages: (callback) => ipcRenderer.on('menu:combine-images', callback),

  // 移除事件监听
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('menu:open-file');
    ipcRenderer.removeAllListeners('menu:export-png');
    ipcRenderer.removeAllListeners('menu:resize-image');
    ipcRenderer.removeAllListeners('menu:remove-background');
    ipcRenderer.removeAllListeners('menu:slice-image');
    ipcRenderer.removeAllListeners('menu:combine-images');
  }
});