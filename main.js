const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 创建主窗口
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 加载主页面
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // 创建菜单
  const menuTemplate = [
    {
      label: '文件',
      submenu: [
        {
          label: '打开图片',
          click: () => {
            mainWindow.webContents.send('menu:open-file');
          }
        },
        {
          label: '导出PNG',
          click: () => {
            mainWindow.webContents.send('menu:export-png');
          }
        },
        {
          label: '退出',
          role: 'quit'
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        {
          label: '去除背景',
          click: () => {
            mainWindow.webContents.send('menu:remove-background');
          }
        },
        {
          label: '切图',
          click: () => {
            mainWindow.webContents.send('menu:slice-image');
          }
        },
        {
          label: '组合图片',
          click: () => {
            mainWindow.webContents.send('menu:combine-images');
          }
        }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: '缩放',
          submenu: [
            { label: '放大', role: 'zoomIn' },
            { label: '缩小', role: 'zoomOut' },
            { label: '重置缩放', role: 'resetZoom' }
          ]
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // 开发模式下打开调试工具
  // mainWindow.webContents.openDevTools();
}

// 应用就绪时创建窗口
app.whenReady().then(() => {
  createWindow();

  // macOS下，当所有窗口关闭时，重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出应用（除了macOS）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 处理文件选择对话框
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp'] }
    ]
  });
  return canceled ? null : filePaths[0];
});

// 处理文件保存对话框
ipcMain.handle('dialog:saveFile', async (event, options) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    ...options,
    filters: [
      { name: 'PNG Images', extensions: ['png'] }
    ]
  });
  return canceled ? null : filePath;
});

// 处理多文件选择对话框
ipcMain.handle('dialog:openFiles', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp'] }
    ]
  });
  return canceled ? null : filePaths;
});

// 处理DataURL保存到文件
ipcMain.handle('fs:saveDataURL', async (event, filePath, dataURL) => {
  try {
    // 移除DataURL前缀
    const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
    // 将base64转换为Buffer并保存
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    return true;
  } catch (error) {
    console.error('Failed to save file from DataURL:', error);
    return false;
  }
});