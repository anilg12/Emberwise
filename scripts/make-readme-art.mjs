// Generates the animated SVG artwork used on the GitHub pages:
// banner (light/dark), download buttons, rank ladder and the signature.
// Text is converted to outlines so it renders identically everywhere.
// Run: node scripts/make-readme-art.mjs

import opentype from 'opentype.js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'docs', 'media');
mkdirSync(OUT, { recursive: true });

const nm = (p) => join(root, 'node_modules', p);
const load = (p) => {
  const buf = readFileSync(nm(p));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
const FONTS = {
  fraunces700: [load('@fontsource/fraunces/files/fraunces-latin-700-normal.woff'), load('@fontsource/fraunces/files/fraunces-latin-ext-700-normal.woff')],
  fraunces600: [load('@fontsource/fraunces/files/fraunces-latin-600-normal.woff'), load('@fontsource/fraunces/files/fraunces-latin-ext-600-normal.woff')],
  nunito800: [load('@fontsource/nunito/files/nunito-latin-800-normal.woff'), load('@fontsource/nunito/files/nunito-latin-ext-800-normal.woff')],
  nunito700: [load('@fontsource/nunito/files/nunito-latin-700-normal.woff'), load('@fontsource/nunito/files/nunito-latin-ext-700-normal.woff')],
  caveat700: [load('@fontsource/caveat/files/caveat-latin-700-normal.woff'), load('@fontsource/caveat/files/caveat-latin-ext-700-normal.woff')],
};

/** Lays out text glyph by glyph, picking the subset font that has each character. */
function layout(text, fonts, size, letterSpacing = 0) {
  let x = 0;
  const glyphs = [];
  let prev = null;
  for (const ch of text) {
    const font = fonts.find((f) => f.charToGlyphIndex(ch) > 0) ?? fonts[0];
    const glyph = font.charToGlyph(ch);
    const scale = size / font.unitsPerEm;
    if (prev && prev.font === font) {
      // Some subset fonts return NaN for missing pairs; a NaN here would corrupt the whole path.
      const k = font.getKerningValue(prev.glyph, glyph);
      if (Number.isFinite(k)) x += k * scale;
    }
    glyphs.push({ font, glyph, x });
    x += glyph.advanceWidth * scale + letterSpacing;
    prev = { font, glyph };
  }
  return { glyphs, width: x - letterSpacing };
}

/** SVG path data for text, anchored at (x, y) baseline; align: start | middle | end. */
function textPath(text, { font, size, x = 0, y = 0, align = 'start', spacing = 0 }) {
  const { glyphs, width } = layout(text, FONTS[font], size, spacing);
  const ox = align === 'middle' ? x - width / 2 : align === 'end' ? x - width : x;
  let d = '';
  // Round the origin: opentype.js prints "NaN" for some long floats (e.g. 1124.8000000000002).
  const r2 = (v) => Math.round(v * 100) / 100;
  for (const g of glyphs) d += g.glyph.getPath(r2(ox + g.x), r2(y), size).toPathData(2);
  return { d, width };
}

const FLAME_OUTER =
  'M50 6c4.6 10.4 13.5 17.3 21 26.2C78.4 41 83 50.4 83 63.5 83 84 68.6 99 50 99S17 84 17 63.5c0-11.6 5.4-20.4 12.6-27.8 1.2 7.3 4.6 12.3 10.2 14.6C38.3 35.7 41.6 19 50 6z';
const FLAME_INNER =
  'M50 40c3.4 7 9.4 11.4 13.6 16.8 3.2 4.1 4.9 8.4 4.9 13.6C68.5 82.7 60.4 92 50 92s-18.5-9.3-18.5-21.6c0-6.1 2.8-11 6.6-14.8.9 3.7 2.8 6.1 5.7 7.3C43.1 55.4 45.4 47 50 40z';
const spark = (x, y, r) =>
  `M${x} ${y - r}C${x + r * 0.18} ${y - r * 0.18} ${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y}C${x + r * 0.18} ${y + r * 0.18} ${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r}C${x - r * 0.18} ${y + r * 0.18} ${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y}C${x - r * 0.18} ${y - r * 0.18} ${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z`;

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** A hand-drawn underline from x0 to x1 that dips slightly and flicks up at the end. */
function swashPath(x0, x1, y) {
  const w = x1 - x0;
  const p = (f) => (x0 + w * f).toFixed(1);
  return `M${x0} ${y} C${p(0.2)} ${y - 12} ${p(0.5)} ${y - 16} ${p(0.8)} ${y - 8} C${p(0.9)} ${y - 5} ${p(0.96)} ${y} ${x1} ${y - 6}`;
}

/* ------------------------------------------------------------------ banner */

function banner(mode) {
  const dark = mode === 'dark';
  const W = 1280;
  const H = 440;
  const c = dark
    ? { bg1: '#1f1729', bg2: '#2c2040', ink: '#f6eee4', ink2: '#d4c8d8', ink3: '#a597b2', pill: 'rgba(255,255,255,0.07)', pillLine: 'rgba(255,255,255,0.12)', glow: '#ff7d45' }
    : { bg1: '#fdf7f0', bg2: '#f8e7d6', ink: '#2b2335', ink2: '#574d63', ink3: '#8a7f95', pill: 'rgba(255,255,255,0.7)', pillLine: '#ead9c6', glow: '#ff9a5c' };

  const title = textPath('Emberwise', { font: 'fraunces700', size: 120, x: 520, y: 205 });
  const tagline = textPath('Odağını ateşle, kahramanını büyüt.', { font: 'nunito800', size: 33, x: 524, y: 262 });
  const sub = textPath('Odak Menajeri RPG’nin yeniden doğuşu', { font: 'nunito700', size: 22, x: 524, y: 300 });

  const pills = ['Windows', 'macOS · M1–M5', 'İnternetsiz', 'Türkçe & English'];
  let px = 524;
  let pillSvg = '';
  for (const p of pills) {
    const t = textPath(p, { font: 'nunito800', size: 17, x: px + 16, y: 358 });
    const w = t.width + 32;
    pillSvg += `<rect x="${px}" y="333" width="${w.toFixed(1)}" height="36" rx="18" fill="${c.pill}" stroke="${c.pillLine}"/><path d="${t.d}" fill="${c.ink2}"/>`;
    px += w + 10;
  }

  const r = rng(11);
  let embers = '';
  for (let i = 0; i < 16; i++) {
    const x = 215 + r() * 150;
    const y = 300 + r() * 40;
    const size = 2 + r() * 3.2;
    const color = r() < 0.5 ? '#ffb04a' : '#ff7a3d';
    const v = 1 + Math.floor(r() * 3);
    embers += `<circle class="e e${v}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${size.toFixed(1)}" fill="${color}" style="animation-delay:-${(r() * 5).toFixed(2)}s"/>`;
  }
  let stars = '';
  if (dark) {
    const rs = rng(5);
    for (let i = 0; i < 40; i++) {
      const x = rs() * W;
      const y = rs() * H * 0.75;
      stars += `<circle class="st" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(0.7 + rs() * 1.3).toFixed(1)}" fill="#fff4dc" style="animation-delay:-${(rs() * 4).toFixed(2)}s"/>`;
    }
  }
  const sparks = [
    [150, 120, 13, 0],
    [430, 95, 9, 1.1],
    [405, 330, 7, 2.2],
    [1180, 110, 10, 0.6],
    [1120, 360, 7, 1.7],
  ]
    .map(([x, y, s, d]) => `<path class="sp" d="${spark(x, y, s)}" fill="${dark ? '#ffd27a' : '#f2b54f'}" style="animation-delay:-${d}s"/>`)
    .join('');

  const flameScale = 2.6;
  const fx = 290 - 50 * flameScale;
  const fy = 205 - 52 * flameScale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<title>Emberwise — Odağını ateşle, kahramanını büyüt.</title>
<style>
  .flame{transform-box:fill-box;transform-origin:50% 100%;animation:flick 2.8s ease-in-out infinite}
  .halo{transform-box:fill-box;transform-origin:center;animation:breathe 2.8s ease-in-out infinite}
  .eyes{transform-box:fill-box;transform-origin:center;animation:blink 5s infinite}
  .e{transform-box:fill-box;transform-origin:center;opacity:0}
  .e1{animation:rise1 4.6s linear infinite}.e2{animation:rise2 5.4s linear infinite}.e3{animation:rise3 3.9s linear infinite}
  .sp{transform-box:fill-box;transform-origin:center;animation:tw 3.2s ease-in-out infinite}
  .st{animation:twinkle 3.6s ease-in-out infinite}
  .swash{stroke-dasharray:1;stroke-dashoffset:1;animation:draw 9s cubic-bezier(.22,1,.36,1) infinite}
  .rise{animation:up 1s cubic-bezier(.22,1,.36,1) both}
  @keyframes flick{0%,100%{transform:scale(1,1) skewX(0)}30%{transform:scale(1.02,.975) skewX(-1.4deg)}60%{transform:scale(.985,1.03) skewX(1.2deg)}}
  @keyframes breathe{0%,100%{opacity:.7;transform:scale(.95)}50%{opacity:1;transform:scale(1.05)}}
  @keyframes blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
  @keyframes rise1{0%{opacity:0;transform:translate(0,0)}12%{opacity:1}100%{opacity:0;transform:translate(-26px,-230px)}}
  @keyframes rise2{0%{opacity:0;transform:translate(0,0)}12%{opacity:1}100%{opacity:0;transform:translate(22px,-260px)}}
  @keyframes rise3{0%{opacity:0;transform:translate(0,0)}12%{opacity:1}100%{opacity:0;transform:translate(4px,-200px)}}
  @keyframes tw{0%,100%{transform:scale(.55) rotate(0);opacity:.35}50%{transform:scale(1.15) rotate(20deg);opacity:1}}
  @keyframes twinkle{0%,100%{opacity:.25}50%{opacity:1}}
  @keyframes draw{0%{stroke-dashoffset:1}22%,88%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
  @keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  @media (prefers-reduced-motion: reduce){*{animation:none!important}.e{opacity:0}.swash{stroke-dashoffset:0}}
</style>
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.bg1}"/><stop offset="1" stop-color="${c.bg2}"/></linearGradient>
  <radialGradient id="g1" cx="0.18" cy="0.6" r="0.5"><stop offset="0" stop-color="${c.glow}" stop-opacity="${dark ? 0.32 : 0.28}"/><stop offset="1" stop-color="${c.glow}" stop-opacity="0"/></radialGradient>
  <radialGradient id="g2" cx="0.92" cy="0.05" r="0.5"><stop offset="0" stop-color="${dark ? '#8a6bd1' : '#ffd9c2'}" stop-opacity="${dark ? 0.22 : 0.7}"/><stop offset="1" stop-color="${dark ? '#8a6bd1' : '#ffd9c2'}" stop-opacity="0"/></radialGradient>
  <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff9a4d" stop-opacity="0.55"/><stop offset="1" stop-color="#ff9a4d" stop-opacity="0"/></radialGradient>
  <linearGradient id="fo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffbe55"/><stop offset="0.55" stop-color="#f4743b"/><stop offset="1" stop-color="#df4640"/></linearGradient>
  <linearGradient id="fi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffeab0"/><stop offset="1" stop-color="#ffb84d"/></linearGradient>
  <linearGradient id="ink" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.ink}"/><stop offset="1" stop-color="${dark ? '#ffd9b8' : '#5b3e73'}"/></linearGradient>
  <clipPath id="card"><rect width="${W}" height="${H}" rx="30"/></clipPath>
</defs>
<g clip-path="url(#card)">
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#g1)"/>
  <rect width="${W}" height="${H}" fill="url(#g2)"/>
  ${stars}
  ${sparks}
  <ellipse class="halo" cx="290" cy="235" rx="190" ry="170" fill="url(#halo)"/>
  ${embers}
  <g transform="translate(${fx} ${fy}) scale(${flameScale})">
    <g class="flame">
      <path d="${FLAME_OUTER}" fill="url(#fo)"/>
      <path d="${FLAME_INNER}" fill="url(#fi)"/>
      <g class="eyes">
        <ellipse cx="41.5" cy="71" rx="3.7" ry="4.5" fill="#43201d"/><ellipse cx="58.5" cy="71" rx="3.7" ry="4.5" fill="#43201d"/>
        <circle cx="42.9" cy="69.3" r="1.35" fill="#fff"/><circle cx="59.9" cy="69.3" r="1.35" fill="#fff"/>
      </g>
      <ellipse cx="34.3" cy="79.2" rx="4.4" ry="2.7" fill="#ff7a6b" opacity="0.5"/><ellipse cx="65.7" cy="79.2" rx="4.4" ry="2.7" fill="#ff7a6b" opacity="0.5"/>
      <path d="M45 79.4q5 5.4 10 0" fill="#7a2f28" stroke="#43201d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <ellipse cx="290" cy="372" rx="120" ry="12" fill="#000" opacity="${dark ? 0.25 : 0.07}"/>
  <g class="rise"><path d="${title.d}" fill="url(#ink)"/></g>
  <path class="swash" pathLength="1" d="${swashPath(526, 520 + title.width + 6, 222)}" fill="none" stroke="#ee6c3a" stroke-width="5" stroke-linecap="round"/>
  <g class="rise" style="animation-delay:.15s"><path d="${tagline.d}" fill="${c.ink}"/></g>
  <g class="rise" style="animation-delay:.3s"><path d="${sub.d}" fill="${c.ink3}"/></g>
  <g class="rise" style="animation-delay:.45s">${pillSvg}</g>
</g>
</svg>`;
}

/* ------------------------------------------------------------------ buttons */

const WINDOWS_LOGO = (x, y, s) => {
  const g = s * 0.08;
  const q = (s - g) / 2;
  return `<rect x="${x}" y="${y}" width="${q}" height="${q}" rx="1.5"/><rect x="${x + q + g}" y="${y}" width="${q}" height="${q}" rx="1.5"/><rect x="${x}" y="${y + q + g}" width="${q}" height="${q}" rx="1.5"/><rect x="${x + q + g}" y="${y + q + g}" width="${q}" height="${q}" rx="1.5"/>`;
};
// A simple, hand-drawn apple silhouette (not the official mark).
const APPLE = (x, y, s) =>
  `<g transform="translate(${x} ${y}) scale(${s / 24})"><path d="M16.4 12.7c0-2.4 2-3.5 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.2 2.9-2.4.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.4-1-2.4-4z"/><path d="M14.1 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4z"/></g>`;

function button({ file, label, sub, bg1, bg2, fg = '#ffffff', fgSub = 'rgba(255,255,255,.82)', icon, delay = 0 }) {
  const W = 330;
  const H = 76;
  const t1 = textPath(label, { font: 'nunito800', size: 22, x: 74, y: 35 });
  const t2 = textPath(sub, { font: 'nunito700', size: 14.5, x: 74, y: 56 });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<title>${label} — ${sub}</title>
<style>
  .shine{animation:shine 5s ease-in-out infinite;animation-delay:${delay}s}
  @keyframes shine{0%,62%{transform:translateX(-120px)}82%,100%{transform:translateX(${W + 40}px)}}
  @media (prefers-reduced-motion: reduce){.shine{animation:none;opacity:0}}
</style>
<defs>
  <linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient>
  <linearGradient id="s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <clipPath id="r"><rect x="2" y="2" width="${W - 4}" height="${H - 8}" rx="18"/></clipPath>
</defs>
<rect x="2" y="6" width="${W - 4}" height="${H - 8}" rx="18" fill="#000" opacity=".16"/>
<rect x="2" y="2" width="${W - 4}" height="${H - 8}" rx="18" fill="url(#b)"/>
<g clip-path="url(#r)"><rect class="shine" x="0" y="0" width="90" height="${H}" fill="url(#s)" transform="skewX(-20)"/></g>
<rect x="2.5" y="2.5" width="${W - 5}" height="${H - 9}" rx="17.5" fill="none" stroke="#fff" stroke-opacity=".14"/>
<g fill="${fg}">${icon}</g>
<path d="${t1.d}" fill="${fg}"/>
<path d="${t2.d}" fill="${fgSub}"/>
</svg>`;
  writeFileSync(join(OUT, file), svg);
}

/* ------------------------------------------------------------------ ranks */

const RANKS = [
  { name: 'Acemi', lv: 1, color: '#9a8f7f', glow: '#d8cfc2', icon: 'spark' },
  { name: 'Çalışkan', lv: 3, color: '#3e9b6e', glow: '#a6dcc0', icon: 'flame' },
  { name: 'Usta', lv: 6, color: '#3f7cc8', glow: '#a9c8ef', icon: 'sword' },
  { name: 'Efsane', lv: 10, color: '#e0912b', glow: '#ffd28a', icon: 'crown' },
  { name: 'Mitik', lv: 15, color: '#c4477a', glow: '#f5a9c8', icon: 'gem' },
  { name: 'Ölümsüz', lv: 25, color: '#7a55d0', glow: '#cdb8ff', icon: 'sun' },
];
const ICON = {
  spark: '<path d="M11 3.5c.6 4 2.6 6 6.5 6.5-3.9.6-5.9 2.6-6.5 6.5-.6-3.9-2.6-5.9-6.5-6.5 3.9-.5 5.9-2.5 6.5-6.5z"/>',
  flame: '<path d="M12 21c-3.9 0-6.8-2.8-6.8-6.5 0-2.5 1.3-4.4 2.9-5.9.4 1.5 1.1 2.5 2.2 3 0-3.2 1.3-6.2 3.9-8.6.4 2.6 1.6 4.3 3 5.8 1.3 1.4 1.9 3.2 1.9 5.2 0 4-3.1 7-7.1 7z"/>',
  sword: '<path d="M19.5 4.5 10 14"/><path d="M19.5 4.5h-3.4M19.5 4.5v3.4"/><path d="m6.8 11.6 5.6 5.6M9.6 14.4 5 19"/>',
  crown: '<path d="M4.2 8.2 7.8 11.4 12 5.5l4.2 5.9 3.6-3.2-1.4 9.8H5.6z"/><path d="M5.8 20h12.4"/>',
  gem: '<path d="M7 4.5h10l3.5 5L12 20 3.5 9.5z"/><path d="M3.5 9.5h17M10 4.5 8.5 9.5 12 20l3.5-10.5-1.5-5"/>',
  sun: '<circle cx="12" cy="12" r="3.8"/><path d="M12 2.8v2M12 19.2v2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M2.8 12h2M19.2 12h2M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4"/>',
};

function ranks(mode) {
  const dark = mode === 'dark';
  const W = 1280;
  const H = 250;
  const ink = dark ? '#f4ece2' : '#2b2335';
  const ink3 = dark ? '#a597b2' : '#8a7f95';
  const track = dark ? '#3a3048' : '#eadfce';
  const step = W / RANKS.length;
  let items = '';
  RANKS.forEach((r, i) => {
    const cx = step * i + step / 2;
    const name = textPath(r.name, { font: 'fraunces600', size: 30, x: cx, y: 196, align: 'middle' });
    const lv = textPath(`Seviye ${r.lv}`, { font: 'nunito800', size: 17, x: cx, y: 224, align: 'middle' });
    items += `<g class="b" style="animation-delay:${(i * 0.45).toFixed(2)}s">
      <g transform="translate(${cx - 44} 30) scale(2.2)">
        <defs><linearGradient id="r${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${r.glow}"/><stop offset="1" stop-color="${r.color}"/></linearGradient></defs>
        <path d="M20 2 L36 8 V20 C36 31 29 38.5 20 42 C11 38.5 4 31 4 20 V8 Z" fill="url(#r${i})"/>
        <path d="M20 5.5 L33 10.4 V20 C33 29 27.4 35.4 20 38.5" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.4" stroke-linecap="round"/>
        <g transform="translate(10.5 11) scale(.79)" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ICON[r.icon]}</g>
      </g>
    </g>
    <path d="${name.d}" fill="${ink}"/><path d="${lv.d}" fill="${ink3}"/>`;
  });
  const x0 = step / 2;
  const x1 = W - step / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<title>Rütbeler: Acemi, Çalışkan, Usta, Efsane, Mitik, Ölümsüz</title>
<style>
  .b{transform-box:fill-box;transform-origin:50% 100%;animation:pop 6s cubic-bezier(.34,1.56,.64,1) infinite}
  .run{stroke-dasharray:1;stroke-dashoffset:1;animation:run 6s cubic-bezier(.65,0,.35,1) infinite}
  .dot{animation:dot 6s cubic-bezier(.65,0,.35,1) infinite}
  @keyframes pop{0%,100%{transform:none}4%{transform:translateY(-10px) scale(1.06)}9%{transform:none}}
  @keyframes run{0%{stroke-dashoffset:1;opacity:1}42%{stroke-dashoffset:0;opacity:1}80%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
  @keyframes dot{0%{transform:translateX(0);opacity:1}42%{transform:translateX(${x1 - x0}px);opacity:1}55%,100%{transform:translateX(${x1 - x0}px);opacity:0}}
  @media (prefers-reduced-motion: reduce){*{animation:none!important}.run{stroke-dashoffset:0}}
</style>
<defs><linearGradient id="line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a8f7f"/><stop offset=".2" stop-color="#3e9b6e"/><stop offset=".4" stop-color="#3f7cc8"/><stop offset=".6" stop-color="#e0912b"/><stop offset=".8" stop-color="#c4477a"/><stop offset="1" stop-color="#7a55d0"/></linearGradient></defs>
<line x1="${x0}" y1="78" x2="${x1}" y2="78" stroke="${track}" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 12"/>
<path class="run" pathLength="1" d="M${x0} 78 H${x1}" stroke="url(#line)" stroke-width="6" stroke-linecap="round"/>
<circle class="dot" cx="${x0}" cy="78" r="9" fill="#ffd27a" stroke="#fff" stroke-width="3"/>
${items}
</svg>`;
}

/* ------------------------------------------------------------------ signature */

function signature(mode) {
  const dark = mode === 'dark';
  const W = 640;
  const H = 230;
  const ink = dark ? '#f4ece2' : '#2b2335';
  const ink3 = dark ? '#a597b2' : '#8a7f95';
  const cap = textPath('TASARLAYAN VE GELİŞTİREN', { font: 'nunito800', size: 15, x: W / 2, y: 34, align: 'middle', spacing: 2.4 });
  const name = textPath('Anıl Gül', { font: 'caveat700', size: 108, x: W / 2, y: 140, align: 'middle' });
  const caps = textPath('ANIL GÜL', { font: 'nunito800', size: 15, x: W / 2, y: 212, align: 'middle', spacing: 6 });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<title>Anıl Gül</title>
<style>
  .n{stroke-dasharray:1;stroke-dashoffset:1;fill-opacity:0;animation:write 8s ease-in-out infinite}
  .u{stroke-dasharray:1;stroke-dashoffset:1;animation:under 8s ease-in-out infinite}
  .d{opacity:0;animation:dot 8s ease-in-out infinite}
  @keyframes write{0%{stroke-dashoffset:1;fill-opacity:0;opacity:1}30%{stroke-dashoffset:0;fill-opacity:0}40%{fill-opacity:1}88%{fill-opacity:1;opacity:1;stroke-dashoffset:0}100%{opacity:0;fill-opacity:1;stroke-dashoffset:0}}
  @keyframes under{0%,32%{stroke-dashoffset:1;opacity:1}46%{stroke-dashoffset:0}88%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
  @keyframes dot{0%,45%{opacity:0}50%,88%{opacity:1}100%{opacity:0}}
  @media (prefers-reduced-motion: reduce){.n,.u,.d{animation:none;stroke-dashoffset:0;fill-opacity:1;opacity:1}}
</style>
<path d="${cap.d}" fill="${ink3}"/>
<g transform="rotate(-3 ${W / 2} 110)">
  <path class="n" pathLength="1" d="${name.d}" fill="${ink}" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>
  <path class="u" pathLength="1" d="M${W / 2 - 160} 166 C${W / 2 - 70} 150 ${W / 2 + 40} 148 ${W / 2 + 130} 156 C${W / 2 + 150} 158 ${W / 2 + 162} 154 ${W / 2 + 170} 148" fill="none" stroke="#ee6c3a" stroke-width="5" stroke-linecap="round"/>
  <circle class="d" cx="${W / 2 + 132}" cy="176" r="4.5" fill="#ee6c3a"/>
</g>
<path d="${caps.d}" fill="${ink3}"/>
</svg>`;
}

/* ------------------------------------------------------------------ write */

writeFileSync(join(OUT, 'banner-light.svg'), banner('light'));
writeFileSync(join(OUT, 'banner-dark.svg'), banner('dark'));
writeFileSync(join(OUT, 'ranks-light.svg'), ranks('light'));
writeFileSync(join(OUT, 'ranks-dark.svg'), ranks('dark'));
writeFileSync(join(OUT, 'signature-light.svg'), signature('light'));
writeFileSync(join(OUT, 'signature-dark.svg'), signature('dark'));

button({ file: 'btn-windows.svg', label: 'Windows için indir', sub: 'Windows 10 / 11 · kurulum .exe', bg1: '#f8834c', bg2: '#e85f2e', icon: WINDOWS_LOGO(26, 22, 30) });
button({ file: 'btn-mac-arm.svg', label: 'macOS için indir', sub: 'Apple Silicon · M1–M5 ve sonrası', bg1: '#3d2f52', bg2: '#251b33', icon: APPLE(24, 18, 34), delay: 0.6 });
button({ file: 'btn-mac-intel.svg', label: 'macOS için indir', sub: 'Intel işlemcili Mac', bg1: '#6d6380', bg2: '#4f465f', icon: APPLE(24, 18, 34), delay: 1.2 });

console.log('readme art written to', OUT);
