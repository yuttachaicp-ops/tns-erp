const { app, BrowserWindow, ipcMain, Menu, shell, Tray, nativeImage } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')

// ---- Config ----
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'
const isDev = !app.isPackaged

let mainWindow = null
let tray = null

// ---- Create Main Window ----
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    title: 'TNS ERP — Daily Operations',
    backgroundColor: '#0f1117',
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev,
    },
    show: false, // show after ready
  })

  // Load the Next.js app
  mainWindow.loadURL(BACKEND_URL)

  // Show when ready (prevents white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' })
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

// ---- Tray Icon ----
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.ico')
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon.resize({ width: 16, height: 16 }))

  const contextMenu = Menu.buildFromTemplate([
    { label: 'TNS ERP', enabled: false },
    { type: 'separator' },
    { label: '🖥️ เปิดโปรแกรม', click: () => { if (mainWindow) mainWindow.show(); else createWindow() } },
    { type: 'separator' },
    { label: '❌ ปิดโปรแกรม', click: () => { app.quit() } },
  ])

  tray.setToolTip('TNS ERP Daily Operations')
  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => { if (mainWindow) mainWindow.show() })
}

// ---- App Menu ----
function createMenu() {
  const template = [
    {
      label: 'TNS ERP',
      submenu: [
        { label: 'เกี่ยวกับ TNS ERP', role: 'about' },
        { type: 'separator' },
        { label: 'ปิดโปรแกรม', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'มุมมอง',
      submenu: [
        { label: 'รีโหลด', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'เต็มจอ', accelerator: 'F11', role: 'togglefullscreen' },
        { label: 'ย่อ/ขยาย', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { type: 'separator' },
        { label: 'ซูมเข้า', accelerator: 'CmdOrCtrl+=', role: 'zoomIn' },
        { label: 'ซูมออก', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'รีเซ็ตซูม', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
      ],
    },
    {
      label: 'เมนู',
      submenu: [
        { label: '📊 Dashboard', accelerator: 'CmdOrCtrl+1', click: () => mainWindow?.loadURL(`${BACKEND_URL}/dashboard`) },
        { label: '📷 Photo Queue', accelerator: 'CmdOrCtrl+2', click: () => mainWindow?.loadURL(`${BACKEND_URL}/photo-queue`) },
        { label: '🛒 Listing Queue', accelerator: 'CmdOrCtrl+3', click: () => mainWindow?.loadURL(`${BACKEND_URL}/listing-queue`) },
        { label: '📝 Daily Logs', accelerator: 'CmdOrCtrl+4', click: () => mainWindow?.loadURL(`${BACKEND_URL}/daily-logs`) },
        { label: '👥 Users', accelerator: 'CmdOrCtrl+5', click: () => mainWindow?.loadURL(`${BACKEND_URL}/users`) },
      ],
    },
    {
      label: 'ช่วยเหลือ',
      submenu: [
        { label: '🔄 ตรวจสอบอัปเดต', click: () => autoUpdater.checkForUpdatesAndNotify() },
        { type: 'separator' },
        { label: '🐛 DevTools', accelerator: 'F12', click: () => mainWindow?.webContents.toggleDevTools() },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ---- IPC Handlers ----
ipcMain.handle('get-app-version', () => app.getVersion())
ipcMain.handle('open-external', (_, url) => shell.openExternal(url))
ipcMain.handle('minimize-window', () => mainWindow?.minimize())
ipcMain.handle('maximize-window', () => {
  if (mainWindow?.isMaximized()) mainWindow.restore()
  else mainWindow?.maximize()
})
ipcMain.handle('close-window', () => mainWindow?.close())

// ---- Auto Updater ----
autoUpdater.on('update-available', () => {
  mainWindow?.webContents.send('update-available')
})
autoUpdater.on('update-downloaded', () => {
  mainWindow?.webContents.send('update-downloaded')
})
ipcMain.handle('install-update', () => autoUpdater.quitAndInstall())

// ---- App Events ----
app.whenReady().then(() => {
  createMenu()
  createWindow()
  createTray()

  // Check for updates in production
  if (!isDev) {
    setTimeout(() => autoUpdater.checkForUpdatesAndNotify(), 3000)
  }
})

app.on('window-all-closed', () => {
  // Keep running in tray on Windows/Linux
  if (process.platform === 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// Security: Prevent new windows
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, url) => {
    if (!url.startsWith(BACKEND_URL)) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })
})

// Handle connection error → retry
function retryConnection(attempts = 0) {
  const maxAttempts = 30
  if (attempts >= maxAttempts) return
  setTimeout(() => {
    if (mainWindow) {
      mainWindow.loadURL(BACKEND_URL).catch(() => retryConnection(attempts + 1))
    }
  }, 2000)
}
