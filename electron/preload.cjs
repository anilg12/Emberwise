'use strict';

const { contextBridge, ipcRenderer } = require('electron');

function on(channel, cb) {
  const handler = (_e, ...args) => cb(...args);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

contextBridge.exposeInMainWorld('ember', {
  platform: process.platform,
  load: () => ipcRenderer.invoke('store:load'),
  save: (text) => ipcRenderer.invoke('store:save', text),
  saveSync: (text) => ipcRenderer.sendSync('store:saveSync', text),
  info: () => ipcRenderer.invoke('app:info'),
  notify: (payload) => ipcRenderer.send('notify', payload),
  setTheme: (payload) => ipcRenderer.send('theme:set', payload),
  setProgress: (value) => ipcRenderer.send('progress:set', value),
  updateTray: (payload) => ipcRenderer.send('tray:update', payload),
  pin: (on) => ipcRenderer.send('window:pin', on),
  focusWindow: () => ipcRenderer.send('window:focus'),
  setCloseToTray: (on) => ipcRenderer.send('settings:closeToTray', on),
  setOpenAtLogin: (on) => ipcRenderer.send('settings:openAtLogin', on),
  getOpenAtLogin: () => ipcRenderer.invoke('settings:getOpenAtLogin'),
  exportData: (payload) => ipcRenderer.invoke('data:export', payload),
  importData: (payload) => ipcRenderer.invoke('data:import', payload),
  openExternal: (url) => ipcRenderer.send('open:external', url),
  onTrayAction: (cb) => on('tray:action', cb),
  onNavigate: (cb) => on('app:navigate', cb),
  onResume: (cb) => on('app:resume', cb),
});
