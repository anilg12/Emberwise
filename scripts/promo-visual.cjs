'use strict';
// Renders promo/gorsel.html (the single LinkedIn image) to PNG at 1080×1350 and 2× that.
// Usage: node scripts/promo-avatars.mjs && npx electron scripts/promo-visual.cjs
// (promo/out/shots must hold today.png and gift-card.png from scripts/promo-shots.cjs)

const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');

const root = path.join(__dirname, '..');
const promo = path.join(root, 'promo');
const out = path.join(promo, 'out');
const scale = Number((process.argv.find((a) => a.startsWith('--scale=')) ?? '--scale=2').split('=')[1]);

const icons = fs.readFileSync(path.join(root, 'src', 'lib', 'icons.ts'), 'utf8');
function icon(name, size = 24) {
  const m = icons.match(new RegExp(`\\b${name}:\\s*(?:\\n\\s*)?'([^']*)'`));
  if (!m) throw new Error(`icon ${name} not found`);
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${m[1]}</svg>`;
}

function logo(size = 46) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64">
    <defs><linearGradient id="lgb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a4f"/><stop offset="1" stop-color="#231a32"/></linearGradient>
    <linearGradient id="lgf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb84d"/><stop offset=".6" stop-color="#f4743b"/><stop offset="1" stop-color="#e2493f"/></linearGradient></defs>
    <rect width="64" height="64" rx="15" fill="url(#lgb)" stroke="rgba(255,255,255,.14)"/>
    <path d="M32 9.5c2.9 6.6 8.6 11 13.4 16.7 4.7 5.6 7.6 11.6 7.6 19.9C53 47.7 43.8 56 32 56s-21-8.3-21-19.9c0-7.4 3.4-13 8-17.7.8 4.6 2.9 7.8 6.5 9.3C24.4 18.6 26.6 17.8 32 9.5z" fill="url(#lgf)"/>
    <path d="M32 31c2.2 4.5 6 7.3 8.7 10.7 2 2.6 3.1 5.4 3.1 8.7C43.8 55 38.5 56 32 56s-11.8-1-11.8-5.6c0-3.9 1.8-7 4.2-9.4.6 2.4 1.8 3.9 3.6 4.6C27.6 39.3 29.1 34.9 32 31z" fill="#ffd27a"/>
    <circle cx="27.6" cy="46" r="2" fill="#4a2320"/><circle cx="36.4" cy="46" r="2" fill="#4a2320"/></svg>`;
}

// Deterministic sprinkles across the top half.
let seed = 11;
const rnd = () => ((seed = (seed * 9301 + 49297) % 233280), seed / 233280);
const stars = Array.from({ length: 46 }, () => {
  const x = Math.round(rnd() * 1080);
  const y = Math.round(rnd() * 480);
  const s = (1.4 + rnd() * 2.4).toFixed(1);
  return `<i style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;opacity:${(0.25 + rnd() * 0.5).toFixed(2)}"></i>`;
}).join('');

const avatars = JSON.parse(fs.readFileSync(path.join(out, 'avatars.json'), 'utf8'));
function place(key, cx, bottom, size) {
  const svg = avatars[key].replace(/width="200" height="[\d.]+"/, `width="${size}" height="${(size * 1.1).toFixed(1)}"`);
  return `<div class="hero" style="left:${(cx - size / 2 + 40).toFixed(1)}px;bottom:${bottom}px">${svg}</div>`;
}
const back = ['ninja', 'scientist', 'astronaut', 'guardian', 'coder', 'pirate', 'frost', 'timekeeper'];
const front = ['explorer', 'artist', 'wizard', 'sovereign', 'oracle', 'chef', 'gardener'];
const lin = (n, a, b) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
const cast = [
  ...back.map((k, i) => place(k, lin(back.length, 62, 1018)[i], 70, 168)),
  ...front.map((k, i) => place(k, lin(front.length, 112, 958)[i] + (k === 'wizard' || k === 'explorer' || k === 'gardener' ? -10 : 0), -6, k === 'sovereign' ? 258 : 214)),
].join('\n');

let html = fs.readFileSync(path.join(promo, 'gorsel.html'), 'utf8');
html = html
  .replace('__LOGO__', logo(46))
  .replace('__STARS__', stars)
  .replace('__CAST__', cast)
  .replace('__GITHUB__', icon('github', 24));
const built = path.join(promo, 'gorsel.built.html');
fs.writeFileSync(built, html);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1080 * scale, height: 1350 * scale, show: false, useContentSize: true, enableLargerThanScreen: true, webPreferences: { offscreen: true } });
  win.setContentSize(1080 * scale, 1350 * scale);
  await win.loadFile(built);
  // Offscreen windows render at 1×: zoom the page instead, so the same 1080×1350 layout comes out sharper.
  win.webContents.setZoomFactor(scale);
  await win.webContents.executeJavaScript(
    `document.fonts.ready.then(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))))`,
    true,
  );
  await wait(800);
  const img = await win.webContents.capturePage();
  const name = scale > 1 ? 'linkedin-emberwise-1.1@2x.png' : 'linkedin-emberwise-1.1.png';
  fs.writeFileSync(path.join(out, name), img.toPNG());
  console.log('saved', name, img.getSize());
  app.exit(0);
});
