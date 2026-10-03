// Generates every icon Emberwise ships with, from hand-written SVG:
//   build/icon.png (1024, macOS grid), build/icon.icns, build/icon.ico,
//   electron/assets/icon.png, tray icons, and the DMG background.
// Run: node scripts/make-icons.mjs

import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = join(root, 'build');
const ASSETS = join(root, 'electron', 'assets');
mkdirSync(BUILD, { recursive: true });
mkdirSync(ASSETS, { recursive: true });

const FLAME_OUTER =
  'M50 6c4.6 10.4 13.5 17.3 21 26.2C78.4 41 83 50.4 83 63.5 83 84 68.6 99 50 99S17 84 17 63.5c0-11.6 5.4-20.4 12.6-27.8 1.2 7.3 4.6 12.3 10.2 14.6C38.3 35.7 41.6 19 50 6z';
const FLAME_INNER =
  'M50 40c3.4 7 9.4 11.4 13.6 16.8 3.2 4.1 4.9 8.4 4.9 13.6C68.5 82.7 60.4 92 50 92s-18.5-9.3-18.5-21.6c0-6.1 2.8-11 6.6-14.8.9 3.7 2.8 6.1 5.7 7.3C43.1 55.4 45.4 47 50 40z';
const spark = (x, y, r, fill, op = 1) =>
  `<path d="M${x} ${y - r} C${x + r * 0.16} ${y - r * 0.16} ${x + r * 0.16} ${y - r * 0.16} ${x + r} ${y} C${x + r * 0.16} ${y + r * 0.16} ${x + r * 0.16} ${y + r * 0.16} ${x} ${y + r} C${x - r * 0.16} ${y + r * 0.16} ${x - r * 0.16} ${y + r * 0.16} ${x - r} ${y} C${x - r * 0.16} ${y - r * 0.16} ${x - r * 0.16} ${y - r * 0.16} ${x} ${y - r}Z" fill="${fill}" opacity="${op}"/>`;

/**
 * The app icon. `inset` is the tile margin (macOS grid uses 100/1024), `detail`
 * switches off the finer touches for tiny sizes.
 */
function iconSvg({ inset = 100, radius = 186, detail = true, shadow = true } = {}) {
  const s = 1024;
  const tile = s - inset * 2;
  // Flame occupies ~60% of the tile, sitting slightly low like a hearth fire.
  const fh = tile * (detail ? 0.64 : 0.74);
  const scale = fh / 104;
  const fx = s / 2 - 50 * scale;
  const fy = inset + tile * (detail ? 0.2 : 0.14);
  const face = detail
    ? `<ellipse cx="41.5" cy="71" rx="3.7" ry="4.5" fill="#43201d"/>
       <ellipse cx="58.5" cy="71" rx="3.7" ry="4.5" fill="#43201d"/>
       <circle cx="42.9" cy="69.3" r="1.35" fill="#fff"/>
       <circle cx="59.9" cy="69.3" r="1.35" fill="#fff"/>
       <ellipse cx="34.3" cy="79.2" rx="4.4" ry="2.7" fill="#ff7a6b" opacity="0.5"/>
       <ellipse cx="65.7" cy="79.2" rx="4.4" ry="2.7" fill="#ff7a6b" opacity="0.5"/>
       <path d="M45 79.4q5 5.4 10 0" fill="#7a2f28" stroke="#43201d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<ellipse cx="41" cy="72" rx="4.6" ry="5.4" fill="#43201d"/>
       <ellipse cx="59" cy="72" rx="4.6" ry="5.4" fill="#43201d"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#433060"/>
      <stop offset="0.55" stop-color="#2c2041"/>
      <stop offset="1" stop-color="#1d1529"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.66" r="0.48">
      <stop offset="0" stop-color="#ff8a4a" stop-opacity="0.62"/>
      <stop offset="0.45" stop-color="#ff7a3d" stop-opacity="0.2"/>
      <stop offset="1" stop-color="#ff7a3d" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.12"/>
      <stop offset="0.2" stop-color="#fff" stop-opacity="0.05"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="fo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffbe55"/>
      <stop offset="0.55" stop-color="#f4743b"/>
      <stop offset="1" stop-color="#df4640"/>
    </linearGradient>
    <linearGradient id="fi" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffeab0"/>
      <stop offset="1" stop-color="#ffb84d"/>
    </linearGradient>
    <filter id="drop" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#000" flood-opacity="0.32"/>
    </filter>
    <filter id="fshadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="${detail ? 10 : 4}" stdDeviation="${detail ? 14 : 6}" flood-color="#1a0d10" flood-opacity="0.45"/>
    </filter>
    <clipPath id="clip"><rect x="${inset}" y="${inset}" width="${tile}" height="${tile}" rx="${radius}"/></clipPath>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>
  <g ${shadow ? 'filter="url(#drop)"' : ''}>
    <rect x="${inset}" y="${inset}" width="${tile}" height="${tile}" rx="${radius}" fill="url(#bg)"/>
  </g>
  <g clip-path="url(#clip)">
    <ellipse cx="${s / 2}" cy="${inset + tile * 0.7}" rx="${tile * 0.62}" ry="${tile * 0.5}" fill="url(#glow)"/>
    <rect x="${inset}" y="${inset}" width="${tile}" height="${tile}" fill="url(#sheen)"/>
    ${detail ? `<rect x="${inset}" y="${inset}" width="${tile}" height="${tile}" filter="url(#grain)" opacity="0.07" style="mix-blend-mode:overlay"/>` : ''}
    ${
      detail
        ? spark(inset + tile * 0.76, inset + tile * 0.22, tile * 0.045, '#ffe3a1', 0.95) +
          spark(inset + tile * 0.22, inset + tile * 0.34, tile * 0.03, '#ffd27a', 0.8) +
          spark(inset + tile * 0.84, inset + tile * 0.44, tile * 0.022, '#ffe3a1', 0.7)
        : ''
    }
  </g>
  <g transform="translate(${fx} ${fy}) scale(${scale})" filter="url(#fshadow)">
    <path d="${FLAME_OUTER}" fill="url(#fo)"/>
    <path d="${FLAME_INNER}" fill="url(#fi)"/>
    ${face}
  </g>
  <rect x="${inset + 0.5}" y="${inset + 0.5}" width="${tile - 1}" height="${tile - 1}" rx="${radius}" fill="none" stroke="#fff" stroke-opacity="0.08" stroke-width="2"/>
</svg>`;
}

/** Flame alone (tray, menu bar). `mono` produces a macOS template image (black + alpha). */
function flameSvg(size, { mono = false } = {}) {
  const pad = size * 0.06;
  const h = size - pad * 2;
  const sc = h / 104;
  const x = size / 2 - 50 * sc;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="fo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffbe55"/><stop offset="0.55" stop-color="#f4743b"/><stop offset="1" stop-color="#df4640"/>
    </linearGradient>
  </defs>
  <g transform="translate(${x} ${pad}) scale(${sc})">
    ${
      mono
        ? `<path d="${FLAME_OUTER}" fill="#000"/>
           <path d="${FLAME_INNER}" fill="#fff"/>`
        : `<path d="${FLAME_OUTER}" fill="url(#fo)"/>
           <path d="${FLAME_INNER}" fill="#ffd27a"/>`
    }
  </g>
</svg>`;
}

async function png(svg, size) {
  return sharp(Buffer.from(svg), { density: Math.max(8, 72 * (size / 1024) * 2) })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** macOS template: black where the flame is, with the inner flame knocked out. */
async function templatePng(size) {
  const raw = await sharp(Buffer.from(flameSvg(size, { mono: true })))
    .resize(size, size)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = raw;
  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const a = data[i + 3];
    // White (inner flame) becomes transparent, black stays opaque.
    const alpha = Math.round(a * (1 - lum / 255));
    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;
    data[i + 3] = alpha;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

function icns(entries) {
  // entries: [type, pngBuffer]
  const chunks = entries.map(([type, buf]) => {
    const head = Buffer.alloc(8);
    head.write(type, 0, 'ascii');
    head.writeUInt32BE(buf.length + 8, 4);
    return Buffer.concat([head, buf]);
  });
  const body = Buffer.concat(chunks);
  const head = Buffer.alloc(8);
  head.write('icns', 0, 'ascii');
  head.writeUInt32BE(body.length + 8, 4);
  return Buffer.concat([head, body]);
}

function dmgSvg(scale = 1) {
  const W = 660;
  const H = 420;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W * scale}" height="${H * scale}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fdf8f1"/><stop offset="1" stop-color="#f6ecdf"/>
    </linearGradient>
    <radialGradient id="g1" cx="0.15" cy="0.1" r="0.6">
      <stop offset="0" stop-color="#ffd9c2" stop-opacity="0.8"/><stop offset="1" stop-color="#ffd9c2" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="0.9" cy="0.95" r="0.6">
      <stop offset="0" stop-color="#fbe7c4" stop-opacity="0.9"/><stop offset="1" stop-color="#fbe7c4" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#g1)"/>
  <rect width="${W}" height="${H}" fill="url(#g2)"/>
  <text x="${W / 2}" y="70" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="30" font-weight="700" fill="#2b2335">Emberwise</text>
  <text x="${W / 2}" y="98" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="13" fill="#8a7f95">Drag to Applications · Uygulamalar klasörüne sürükle</text>
  <path d="M262 232 C300 212 360 212 398 232" fill="none" stroke="#ee6c3a" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="2 9"/>
  <path d="M388 222 L401 233 L386 241" fill="none" stroke="#ee6c3a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="${W / 2}" y="${H - 26}" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="11" letter-spacing="3" fill="#b4aabb">ANIL GÜL</text>
</svg>`;
}

async function main() {
  const mac = iconSvg({ inset: 100, radius: 186, detail: true, shadow: true });
  const full = iconSvg({ inset: 24, radius: 210, detail: true, shadow: false });
  const small = iconSvg({ inset: 24, radius: 230, detail: false, shadow: false });

  writeFileSync(join(BUILD, 'icon.svg'), mac);
  writeFileSync(join(BUILD, 'icon-full.svg'), full);

  // macOS
  const macPng = await png(mac, 1024);
  writeFileSync(join(BUILD, 'icon.png'), macPng);
  const sizes = { 16: null, 32: null, 64: null, 128: null, 256: null, 512: null, 1024: null };
  for (const k of Object.keys(sizes)) sizes[k] = await png(Number(k) <= 32 ? iconSvg({ inset: 100, radius: 186, detail: false, shadow: false }) : mac, Number(k));
  writeFileSync(
    join(BUILD, 'icon.icns'),
    icns([
      ['icp4', sizes[16]],
      ['icp5', sizes[32]],
      ['icp6', sizes[64]],
      ['ic07', sizes[128]],
      ['ic08', sizes[256]],
      ['ic09', sizes[512]],
      ['ic10', sizes[1024]],
      ['ic11', sizes[32]],
      ['ic12', sizes[64]],
      ['ic13', sizes[256]],
      ['ic14', sizes[1024]],
    ]),
  );

  // Windows .ico: crisp small sizes use the simplified art.
  const icoSizes = [16, 20, 24, 32, 40, 48, 64, 128, 256];
  const icoPngs = [];
  for (const sz of icoSizes) icoPngs.push(await png(sz <= 48 ? small : full, sz));
  writeFileSync(join(BUILD, 'icon.ico'), await pngToIco(icoPngs));
  writeFileSync(join(BUILD, 'icon-256.png'), await png(full, 256));

  // Window icon (Windows/Linux) used at runtime
  writeFileSync(join(ASSETS, 'icon.png'), await png(full, 256));

  // Tray / menu bar
  writeFileSync(join(ASSETS, 'tray.png'), await png(flameSvg(64), 16));
  writeFileSync(join(ASSETS, 'tray@1.5x.png'), await png(flameSvg(64), 24));
  writeFileSync(join(ASSETS, 'tray@2x.png'), await png(flameSvg(64), 32));
  writeFileSync(join(ASSETS, 'trayTemplate.png'), await templatePng(18));
  writeFileSync(join(ASSETS, 'trayTemplate@2x.png'), await templatePng(36));

  // DMG background (1x + 2x)
  writeFileSync(join(BUILD, 'dmg-background.png'), await sharp(Buffer.from(dmgSvg(1))).png().toBuffer());
  writeFileSync(join(BUILD, 'dmg-background@2x.png'), await sharp(Buffer.from(dmgSvg(2))).png().toBuffer());

  // Preview sheet for eyeballing
  const sheet = await sharp({ create: { width: 1200, height: 340, channels: 4, background: '#f4ece0' } })
    .composite([
      { input: await png(mac, 300), left: 20, top: 20 },
      { input: await png(full, 256), left: 340, top: 42 },
      { input: await png(small, 64), left: 620, top: 140 },
      { input: await png(small, 32), left: 700, top: 156 },
      { input: await png(small, 16), left: 750, top: 164 },
      { input: await png(flameSvg(64), 32), left: 800, top: 156 },
      { input: await templatePng(36), left: 850, top: 154 },
      { input: await sharp(Buffer.from(dmgSvg(0.4))).png().toBuffer(), left: 900, top: 100 },
    ])
    .png()
    .toBuffer();
  writeFileSync(join(BUILD, 'icon-preview.png'), sheet);
  console.log('icons written');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
