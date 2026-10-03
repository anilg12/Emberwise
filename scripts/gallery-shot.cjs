'use strict';
// Captures the dev gallery (npm run dev must be running) at full size, for reviewing the artwork.
// Usage: npx electron scripts/gallery-shot.cjs --q="s=chars&body=f" --out=gallery.png [--w=1100]

const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');

const arg = (name, def) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
};
const query = arg('q', 's=chars');
const out = path.resolve(arg('out', 'gallery.png'));
const width = Number(arg('w', 1100));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width, height: 900, show: false, enableLargerThanScreen: true, webPreferences: { offscreen: true } });
  await win.loadURL(`http://localhost:5173/?${query}#gallery`);
  await wait(1500);
  const h = await win.webContents.executeJavaScript('document.querySelector(".gallery").scrollHeight');
  win.setContentSize(width, Math.min(h, 7000));
  await wait(700);
  const img = await win.webContents.capturePage();
  fs.writeFileSync(out, img.toPNG());
  console.log('saved', out, img.getSize());
  app.exit(0);
});
