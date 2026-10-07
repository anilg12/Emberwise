'use strict';
// renders promo/slides.html for linkedin:
//   promo/out/slide-1..8.png (1080x1350), promo/out/linkedin-gorsel.png
//   promo/out/Emberwise-LinkedIn.pdf (carousel post)
// npx electron scripts/promo-render.cjs   (run promo-shots.cjs first)

const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');

const root = path.join(__dirname, '..');
const promo = path.join(root, 'promo');
const out = path.join(promo, 'out');
fs.mkdirSync(out, { recursive: true });

const icons = fs.readFileSync(path.join(root, 'src', 'lib', 'icons.ts'), 'utf8');
function icon(name, size = 32) {
  const m = icons.match(new RegExp(`\\b${name}:\\s*'([^']*)'`));
  if (!m) throw new Error(`icon ${name} not found`);
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${m[1]}</svg>`;
}

const FLAME_OUTER =
  'M50 6c4.6 10.4 13.5 17.3 21 26.2C78.4 41 83 50.4 83 63.5 83 84 68.6 99 50 99S17 84 17 63.5c0-11.6 5.4-20.4 12.6-27.8 1.2 7.3 4.6 12.3 10.2 14.6C38.3 35.7 41.6 19 50 6z';
const FLAME_INNER =
  'M50 40c3.4 7 9.4 11.4 13.6 16.8 3.2 4.1 4.9 8.4 4.9 13.6C68.5 82.7 60.4 92 50 92s-18.5-9.3-18.5-21.6c0-6.1 2.8-11 6.6-14.8.9 3.7 2.8 6.1 5.7 7.3C43.1 55.4 45.4 47 50 40z';

function ember(id, size, mood) {
  const face =
    mood === 'sleepy'
      ? `<path d="M37.5 72.5q4 3 8 0M54.5 72.5q4 3 8 0" fill="none" stroke="#5a2a22" stroke-width="2.6" stroke-linecap="round"/><path d="M46.5 80.5q3.5 2.2 7 0" fill="none" stroke="#4a2320" stroke-width="2.3" stroke-linecap="round"/>
         <text x="70" y="30" font-family="Nunito Variable" font-weight="900" font-size="15" fill="#b4aabb">z</text><text x="80" y="18" font-family="Nunito Variable" font-weight="900" font-size="11" fill="#cfc6d4">z</text>`
      : `<ellipse cx="41.5" cy="71" rx="3.7" ry="4.5" fill="#43201d"/><ellipse cx="58.5" cy="71" rx="3.7" ry="4.5" fill="#43201d"/><circle cx="42.9" cy="69.3" r="1.35" fill="#fff"/><circle cx="59.9" cy="69.3" r="1.35" fill="#fff"/>
         <path d="M45 79.4q5 5.4 10 0" fill="#7a2f28" stroke="#43201d" stroke-width="2" stroke-linecap="round"/>`;
  const dim = mood === 'sleepy' ? ' opacity="0.78"' : '';
  return `<svg width="${size}" height="${size * 1.04}" viewBox="0 0 100 104">
    <defs>
      <radialGradient id="${id}h" cx=".5" cy=".62" r=".5"><stop offset="0" stop-color="#ff9a4d" stop-opacity="${mood === 'sleepy' ? 0.18 : 0.45}"/><stop offset="1" stop-color="#ff9a4d" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffbe55"/><stop offset=".55" stop-color="#f4743b"/><stop offset="1" stop-color="#df4640"/></linearGradient>
      <linearGradient id="${id}i" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffeab0"/><stop offset="1" stop-color="#ffb84d"/></linearGradient>
    </defs>
    <ellipse cx="50" cy="66" rx="50" ry="40" fill="url(#${id}h)"/>
    <g${dim}><path d="${FLAME_OUTER}" fill="url(#${id}o)"/><path d="${FLAME_INNER}" fill="url(#${id}i)"/></g>
    <ellipse cx="34.3" cy="79.2" rx="4.4" ry="2.7" fill="#ff7a6b" opacity=".5"/><ellipse cx="65.7" cy="79.2" rx="4.4" ry="2.7" fill="#ff7a6b" opacity=".5"/>
    ${face}
  </svg>`;
}

let logoN = 0;
function logo(size = 44) {
  const id = `lg${logoN++}`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64">
    <defs><linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a4f"/><stop offset="1" stop-color="#231a32"/></linearGradient>
    <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb84d"/><stop offset=".6" stop-color="#f4743b"/><stop offset="1" stop-color="#e2493f"/></linearGradient></defs>
    <rect width="64" height="64" rx="15" fill="url(#${id}b)"/>
    <path d="M32 9.5c2.9 6.6 8.6 11 13.4 16.7 4.7 5.6 7.6 11.6 7.6 19.9C53 47.7 43.8 56 32 56s-21-8.3-21-19.9c0-7.4 3.4-13 8-17.7.8 4.6 2.9 7.8 6.5 9.3C24.4 18.6 26.6 17.8 32 9.5z" fill="url(#${id}f)"/>
    <path d="M32 31c2.2 4.5 6 7.3 8.7 10.7 2 2.6 3.1 5.4 3.1 8.7C43.8 55 38.5 56 32 56s-11.8-1-11.8-5.6c0-3.9 1.8-7 4.2-9.4.6 2.4 1.8 3.9 3.6 4.6C27.6 39.3 29.1 34.9 32 31z" fill="#ffd27a"/>
    <circle cx="27.6" cy="46" r="2" fill="#4a2320"/><circle cx="36.4" cy="46" r="2" fill="#4a2320"/></svg>`;
}

// static version of the rank ladder from the readme
const ranks = fs
  .readFileSync(path.join(root, 'docs', 'media', 'ranks-light.svg'), 'utf8')
  .replace(/<style>[\s\S]*?<\/style>/, '')
  .replace(/<circle class="dot"[^>]*\/>/, '');
fs.writeFileSync(path.join(out, 'ranks-static.svg'), ranks);

let html = fs.readFileSync(path.join(promo, 'slides.html'), 'utf8');
html = html
  .replace(/__LOGO__/g, () => logo(44))
  .replace('__EMBER_SLEEPY__', ember('es', 120, 'sleepy'))
  .replace('__EMBER_HAPPY__', ember('eh', 140, 'happy'))
  .replace('__I_SHIELD__', icon('shield', 32))
  .replace('__I_GLOBE__', icon('globe', 32))
  .replace('__I_MOON__', icon('moon', 32))
  .replace('__I_CHEST__', icon('chest', 32))
  .replace('__I_TROPHY__', icon('trophy', 32))
  .replace('__I_MONITOR__', icon('monitor', 32))
  .replace('__RANKS__', 'out/ranks-static.svg');
const built = path.join(promo, 'slides.built.html');
fs.writeFileSync(built, html);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1080,
    height: 1350,
    show: false,
    useContentSize: true,
    enableLargerThanScreen: true,
    webPreferences: { offscreen: true },
  });
  win.setContentSize(1080, 1350);
  await win.loadFile(built);
  const js = (c) => win.webContents.executeJavaScript(c, true);
  await js(`document.fonts.ready.then(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))))`);

  const shots = [['1', 'slide-1'], ['2', 'slide-2'], ['3', 'slide-3'], ['4', 'slide-4'], ['5', 'slide-5'], ['6', 'slide-6'], ['7', 'slide-7'], ['8', 'slide-8'], ['cover', 'linkedin-gorsel']];
  for (const [id, name] of shots) {
    await js(`document.body.dataset.slide = ${JSON.stringify(id)}`);
    await wait(500);
    const img = await win.webContents.capturePage({ x: 0, y: 0, width: 1080, height: 1350 });
    fs.writeFileSync(path.join(out, `${name}.png`), img.toPNG());
    console.log('saved', name, img.getSize());
  }

  await js(`document.body.dataset.slide = 'all'`);
  await wait(500);
  const pdf = await win.webContents.printToPDF({
    printBackground: true,
    preferCSSPageSize: true,
    margins: { marginType: 'none' },
  });
  fs.writeFileSync(path.join(out, 'Emberwise-LinkedIn.pdf'), pdf);
  console.log('saved pdf', Math.round(pdf.length / 1024), 'KB');
  app.exit(0);
});
