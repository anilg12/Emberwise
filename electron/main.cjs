'use strict';

const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Notification,
  Tray,
  nativeImage,
  nativeTheme,
  shell,
  dialog,
  screen,
  powerMonitor,
} = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const APP_ID = 'com.anilgul.emberwise';
const IS_MAC = process.platform === 'darwin';
const IS_WIN = process.platform === 'win32';
const DEV_URL = process.env.EMBERWISE_DEV_URL || '';

const COLORS = {
  light: { bg: '#fbf6ee', symbol: '#3b3149' },
  dark: { bg: '#17131f', symbol: '#efe7dc' },
};

app.setName('Emberwise');
if (IS_WIN) app.setAppUserModelId(APP_ID);

// dev only: lets the screenshot scripts run on a throwaway profile
if (!app.isPackaged && process.env.EMBERWISE_USER_DATA) {
  app.setPath('userData', process.env.EMBERWISE_USER_DATA);
}

// single instance, a second launch just focuses the open window
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

/** @type {BrowserWindow | null} */
let win = null;
/** @type {Tray | null} */
let tray = null;
let isQuitting = false;
let closeToTray = false;
let trayLabels = {
  show: 'Show Emberwise',
  toggle: 'Start focus',
  quit: 'Quit',
  hidden: 'Emberwise keeps running in the tray so your reminders can ring.',
};
let trayRunning = false;

// ---- storage ----
// one json file, atomic write + rolling backup

const dataDir = app.getPath('userData');
const dataFile = path.join(dataDir, 'emberwise-data.json');
const backupFile = path.join(dataDir, 'emberwise-data.backup.json');
const windowStateFile = path.join(dataDir, 'window-state.json');

function readJson(file) {
  try {
    const raw = fs.readFileSync(file, 'utf8');
    if (!raw.trim()) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadData() {
  const main = readJson(dataFile);
  if (main) return main;
  // main file missing/corrupt -> use the backup
  return readJson(backupFile);
}

function writeAtomic(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, text, 'utf8');
  fs.renameSync(tmp, file);
}

let lastBackupAt = 0;
function saveData(text) {
  if (typeof text !== 'string' || text.length < 2) return false;
  try {
    JSON.parse(text); // don't write something we can't read back
  } catch {
    return false;
  }
  try {
    const now = Date.now();
    if (now - lastBackupAt > 10 * 60 * 1000 && fs.existsSync(dataFile)) {
      fs.copyFileSync(dataFile, backupFile);
      lastBackupAt = now;
    }
    writeAtomic(dataFile, text);
    return true;
  } catch (err) {
    console.error('[emberwise] save failed', err);
    return false;
  }
}

const initialData = loadData();
const initialTheme = (() => {
  const t = initialData && initialData.settings && initialData.settings.theme;
  if (t === 'light' || t === 'dark') return t;
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
})();
if (initialData && initialData.settings) {
  closeToTray = !!initialData.settings.closeToTray;
  const t = initialData.settings.theme;
  nativeTheme.themeSource = t === 'light' || t === 'dark' ? t : 'system';
}

// ---- window ----

function loadWindowState() {
  const s = readJson(windowStateFile);
  const fallback = { width: 1220, height: 800, maximized: false };
  if (!s || typeof s.width !== 'number') return fallback;
  // saved bounds might be on a monitor that isn't connected anymore
  if (typeof s.x === 'number' && typeof s.y === 'number') {
    const visible = screen.getAllDisplays().some((d) => {
      const a = d.workArea;
      return s.x + 80 < a.x + a.width && s.x + s.width - 80 > a.x && s.y >= a.y - 10 && s.y + 40 < a.y + a.height;
    });
    if (!visible) {
      delete s.x;
      delete s.y;
    }
  }
  return {
    width: Math.max(980, Math.min(s.width, 3000)),
    height: Math.max(660, Math.min(s.height, 2000)),
    x: s.x,
    y: s.y,
    maximized: !!s.maximized,
  };
}

let windowStateTimer = null;
function persistWindowState() {
  if (!win || win.isDestroyed()) return;
  clearTimeout(windowStateTimer);
  windowStateTimer = setTimeout(() => {
    if (!win || win.isDestroyed()) return;
    const maximized = win.isMaximized();
    const b = maximized ? win.getNormalBounds() : win.getBounds();
    try {
      writeAtomic(windowStateFile, JSON.stringify({ ...b, maximized }));
    } catch {
      /* not critical */
    }
  }, 400);
}

function iconPath(name) {
  return path.join(__dirname, 'assets', name);
}

function createWindow() {
  const state = loadWindowState();
  const theme = COLORS[initialTheme];

  /** @type {Electron.BrowserWindowConstructorOptions} */
  const opts = {
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 980,
    minHeight: 660,
    show: false,
    backgroundColor: theme.bg,
    title: 'Emberwise',
    icon: IS_MAC ? undefined : iconPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      backgroundThrottling: false,
      autoplayPolicy: 'no-user-gesture-required',
      devTools: !app.isPackaged,
    },
  };

  if (IS_MAC) {
    opts.titleBarStyle = 'hiddenInset';
    opts.trafficLightPosition = { x: 18, y: 18 };
    opts.vibrancy = undefined;
  } else {
    opts.titleBarStyle = 'hidden';
    opts.titleBarOverlay = { color: theme.bg, symbolColor: theme.symbol, height: 40 };
  }

  win = new BrowserWindow(opts);
  if (state.maximized) win.maximize();

  win.once('ready-to-show', () => {
    if (!win) return;
    win.show();
    win.focus();
  });

  win.on('resize', persistWindowState);
  win.on('move', persistWindowState);
  win.on('maximize', persistWindowState);
  win.on('unmaximize', persistWindowState);

  win.on('close', (e) => {
    if (isQuitting) return;
    if (IS_MAC) {
      // mac: closing the window keeps the app in the dock
      e.preventDefault();
      win.hide();
      return;
    }
    if (closeToTray && tray) {
      e.preventDefault();
      win.hide();
      showTrayNoticeOnce();
    }
  });

  win.on('closed', () => {
    win = null;
  });

  // stay inside the app, external links open in the browser
  win.webContents.on('will-navigate', (e, url) => {
    const current = win && win.webContents.getURL();
    if (url !== current) {
      e.preventDefault();
      openExternalSafe(url);
    }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    openExternalSafe(url);
    return { action: 'deny' };
  });

  if (DEV_URL) {
    win.loadURL(DEV_URL);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

// first time we hide to tray, tell the user where the app went
function showTrayNoticeOnce() {
  const flag = path.join(dataDir, 'tray-notice-shown');
  if (fs.existsSync(flag) || !Notification.isSupported()) return;
  try {
    fs.writeFileSync(flag, '1');
    const n = new Notification({
      title: 'Emberwise',
      body: trayLabels.hidden,
      silent: true,
      icon: nativeImage.createFromPath(iconPath('icon.png')),
    });
    n.on('click', showWindow);
    n.show();
  } catch {
    /* just a hint */
  }
}

function showWindow() {
  if (!win) {
    createWindow();
    return;
  }
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

function openExternalSafe(url) {
  try {
    const u = new URL(url);
    if (u.protocol === 'https:' || u.protocol === 'mailto:') shell.openExternal(url);
  } catch {
    /* ignore malformed urls */
  }
}

// ---- tray / menu bar ----

function buildTrayMenu() {
  if (!tray) return;
  const menu = Menu.buildFromTemplate([
    { label: trayLabels.show, click: showWindow },
    { type: 'separator' },
    {
      label: trayLabels.toggle,
      click: () => {
        if (win) win.webContents.send('tray:action', 'toggle-timer');
      },
    },
    { type: 'separator' },
    {
      label: trayLabels.quit,
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(menu);
}

function createTray() {
  try {
    let image;
    if (IS_MAC) {
      image = nativeImage.createFromPath(iconPath('trayTemplate.png'));
      image.setTemplateImage(true);
    } else {
      image = nativeImage.createFromPath(iconPath('tray.png'));
    }
    if (image.isEmpty()) return;
    tray = new Tray(image);
    tray.setToolTip('Emberwise');
    if (!IS_MAC) tray.on('click', showWindow);
    buildTrayMenu();
  } catch (err) {
    console.error('[emberwise] tray failed', err);
    tray = null;
  }
}

function buildAppMenu() {
  if (!IS_MAC) {
    Menu.setApplicationMenu(null);
    return;
  }
  const template = [
    {
      label: 'Emberwise',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Settings…',
          accelerator: 'Cmd+,',
          click: () => {
            showWindow();
            if (win) win.webContents.send('app:navigate', 'settings');
          },
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [{ role: 'togglefullscreen' }],
    },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ---- ipc ----

ipcMain.handle('store:load', () => {
  const data = loadData();
  return data ? JSON.stringify(data) : null;
});
ipcMain.handle('store:save', (_e, text) => saveData(text));
ipcMain.on('store:saveSync', (e, text) => {
  e.returnValue = saveData(text);
});

// ambience loops are in dist/ambience. only plain file names allowed so this can't read anything else
ipcMain.handle('asset:sound', async (_e, name) => {
  if (typeof name !== 'string' || !/^[a-z]{2,16}$/.test(name)) return null;
  try {
    const buf = await fs.promises.readFile(path.join(__dirname, '..', 'dist', 'ambience', `${name}.ogg`));
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  } catch {
    return null;
  }
});

ipcMain.handle('app:info', () => ({
  version: app.getVersion(),
  platform: process.platform,
  arch: process.arch,
  electron: process.versions.electron,
  locale: app.getLocale(),
  packaged: app.isPackaged,
  dataPath: dataDir,
}));

ipcMain.on('notify', (_e, payload) => {
  if (!payload || !Notification.isSupported()) return;
  try {
    const n = new Notification({
      title: String(payload.title || 'Emberwise').slice(0, 120),
      body: String(payload.body || '').slice(0, 300),
      silent: payload.silent !== false,
      icon: IS_MAC ? undefined : nativeImage.createFromPath(iconPath('icon.png')),
    });
    n.on('click', () => {
      showWindow();
      if (win && payload.route) win.webContents.send('app:navigate', payload.route);
    });
    n.show();
  } catch (err) {
    console.error('[emberwise] notification failed', err);
  }
});

ipcMain.on('theme:set', (_e, payload) => {
  if (!payload) return;
  const mode = payload.mode;
  nativeTheme.themeSource = mode === 'light' || mode === 'dark' ? mode : 'system';
  if (!win || win.isDestroyed()) return;
  const dark = !!payload.dark;
  const c = dark ? COLORS.dark : COLORS.light;
  win.setBackgroundColor(c.bg);
  if (!IS_MAC && typeof win.setTitleBarOverlay === 'function') {
    try {
      win.setTitleBarOverlay({
        color: payload.bg || c.bg,
        symbolColor: payload.symbol || c.symbol,
        height: 40,
      });
    } catch {
      /* older platforms may not support live overlay updates */
    }
  }
});

ipcMain.on('progress:set', (_e, value) => {
  if (!win || win.isDestroyed()) return;
  const v = typeof value === 'number' && value >= 0 && value <= 1 ? value : -1;
  win.setProgressBar(v);
});

ipcMain.on('tray:update', (_e, payload) => {
  if (!payload) return;
  if (payload.labels) {
    trayLabels = { ...trayLabels, ...payload.labels };
  }
  trayRunning = !!payload.running;
  if (!tray) return;
  const title = typeof payload.title === 'string' ? payload.title : '';
  if (IS_MAC) tray.setTitle(title ? ` ${title}` : '', { fontType: 'monospacedDigit' });
  tray.setToolTip(title ? `Emberwise — ${title}` : 'Emberwise');
  buildTrayMenu();
});

ipcMain.on('window:pin', (_e, on) => {
  if (!win || win.isDestroyed()) return;
  win.setAlwaysOnTop(!!on, 'floating');
});

ipcMain.on('window:focus', () => showWindow());

ipcMain.on('settings:closeToTray', (_e, on) => {
  closeToTray = !!on;
});

ipcMain.on('settings:openAtLogin', (_e, on) => {
  try {
    app.setLoginItemSettings({ openAtLogin: !!on, openAsHidden: false });
  } catch {
    /* unsupported in dev on some platforms */
  }
});

ipcMain.handle('settings:getOpenAtLogin', () => {
  try {
    return app.getLoginItemSettings().openAtLogin;
  } catch {
    return false;
  }
});

ipcMain.handle('data:export', async (_e, payload) => {
  if (!win) return { ok: false };
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: payload && payload.title,
    defaultPath: path.join(app.getPath('documents'), (payload && payload.fileName) || 'emberwise-backup.json'),
    filters: [{ name: 'Emberwise backup', extensions: ['json'] }],
  });
  if (canceled || !filePath) return { ok: false, canceled: true };
  try {
    fs.writeFileSync(filePath, payload.text, 'utf8');
    return { ok: true, path: filePath };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

ipcMain.handle('data:import', async (_e, payload) => {
  if (!win) return { ok: false };
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: payload && payload.title,
    properties: ['openFile'],
    filters: [{ name: 'Emberwise backup', extensions: ['json'] }],
  });
  if (canceled || !filePaths || !filePaths[0]) return { ok: false, canceled: true };
  try {
    const stat = fs.statSync(filePaths[0]);
    if (stat.size > 50 * 1024 * 1024) return { ok: false, error: 'too-large' };
    return { ok: true, text: fs.readFileSync(filePaths[0], 'utf8') };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

ipcMain.on('open:external', (_e, url) => openExternalSafe(url));

// ---- lifecycle ----

app.on('second-instance', showWindow);

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (!IS_MAC) app.quit();
});

app.on('activate', showWindow);

app.whenReady().then(() => {
  if (IS_MAC) {
    app.setAboutPanelOptions({
      applicationName: 'Emberwise',
      applicationVersion: app.getVersion(),
      copyright: '© Anıl Gül',
      credits: 'Crafted with care by Anıl Gül',
    });
  }
  buildAppMenu();
  createWindow();
  createTray();

  powerMonitor.on('resume', () => {
    if (win) win.webContents.send('app:resume');
  });
});
