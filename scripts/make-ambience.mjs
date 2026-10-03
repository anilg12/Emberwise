// Builds the ambience loops in public/ambience from freely licensed field recordings on Wikimedia Commons.
//
//   node scripts/make-ambience.mjs            (needs ffmpeg on PATH, or FFMPEG=/path/to/ffmpeg)
//
// For every sound it downloads the source once (cached in .cache/ambience-src), cuts the calmest
// stretch, softens it (high/low-pass, gentle compression), normalises the loudness, bakes a seamless
// loop by crossfading the tail into the head, and encodes a small Opus file. Mono sources get a wide,
// natural stereo image by pairing the loop with a half-loop-shifted copy of itself.
// The credits for every recording are written to src/lib/ambience-credits.ts (shown in the app's About).

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = path.join(root, '.cache', 'ambience-src');
const outDir = path.join(root, 'public', 'ambience');
const creditsFile = path.join(root, 'src', 'lib', 'ambience-credits.ts');
const FF = process.env.FFMPEG || 'ffmpeg';
const UA = 'EmberwiseBuild/1.1 (https://github.com/anilg12/Emberwise)';
const SR = 48000;

/**
 * start/len in seconds: the loop is `len` long, `xfade` extra seconds are read for the seamless join.
 * lufs: target loudness. Everything sits low on purpose so it stays in the background.
 */
const SOUNDS = [
  { id: 'rain', file: 'Garden rainfall.ogg', start: 3, len: 48, hp: 70, lp: 9000, lufs: -31 },
  { id: 'storm', file: 'Light Rain Distant Thunder July 5th 2016.wav', start: 4, len: 96, hp: 40, lp: 7000, lufs: -32, comp: 0.5, author: 'kvgarlic (Freesound)' },
  { id: 'waves', file: 'Ocean Waves on a Tropical Beach.ogg', start: 296, len: 72, hp: 40, lp: 6000, lufs: -31 },
  { id: 'wind', file: 'Wind in Swedish pine forest at 25 mps.ogg', start: 2, len: 52, hp: 50, lp: 3200, lufs: -34, comp: 0.5 },
  { id: 'forest', file: 'Réveil des oiseaux.ogg', start: 54, len: 72, hp: 250, lp: 11000, lufs: -33, comp: 0.6 },
  { id: 'stream', file: 'Water on Rocks.ogg', start: 18, len: 66, hp: 80, lp: 8000, lufs: -32 },
  { id: 'night', file: 'Nightingale wind crickets - cut.ogg', start: 469, len: 66, hp: 120, lp: 10000, lufs: -34, comp: 0.5 },
  { id: 'cafe', file: 'Cafe ambiance.ogg', start: 491, len: 72, hp: 90, lp: 5200, lufs: -31, comp: 0.5 },
  { id: 'library', file: '20121112 TU Delft Library, quiet study room - general ambience - SoundCloud - el mar.ogg', start: 163, len: 66, hp: 60, lp: 7000, lufs: -32, comp: 0.5 },
  { id: 'fire', file: 'Campfire sound ambience.ogg', start: 9, len: 36, hp: 60, lp: 9000, lufs: -31, comp: 0.4 },
  { id: 'train', file: 'Complete train ride 4 minutes.ogg', start: 72, len: 70, hp: 35, lp: 3800, lufs: -31, comp: 0.4 },
];
const XFADE = 5;

const safeName = (title) => title.replace(/[^\w.\-]+/g, '_');

async function commonsMeta(titles) {
  const u = new URL('https://commons.wikimedia.org/w/api.php');
  u.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: titles.map((t) => `File:${t}`).join('|'),
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata',
    iiextmetadatafilter: 'LicenseShortName|Artist|LicenseUrl',
  });
  const j = await (await fetch(u, { headers: { 'User-Agent': UA } })).json();
  const norm = Object.fromEntries((j.query.normalized ?? []).map((n) => [n.to, n.from]));
  const out = {};
  for (const p of Object.values(j.query.pages)) {
    const ii = p.imageinfo?.[0];
    if (!ii) throw new Error(`missing on Commons: ${p.title}`);
    const m = ii.extmetadata ?? {};
    const title = (norm[p.title] ?? p.title).replace(/^File:/, '');
    out[title] = {
      url: ii.url,
      page: ii.descriptionurl,
      size: ii.size,
      license: m.LicenseShortName?.value ?? '',
      licenseUrl: m.LicenseUrl?.value ?? '',
      author: (m.Artist?.value ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
    };
  }
  return out;
}

async function download(meta, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size === meta.size) return;
  for (let attempt = 0; attempt < 6; attempt++) {
    const r = await fetch(meta.url, { headers: { 'User-Agent': UA } });
    if (r.ok) {
      fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
      return;
    }
    await new Promise((s) => setTimeout(s, 4000 * (attempt + 1)));
  }
  throw new Error(`download failed: ${meta.url}`);
}

function ff(args, input) {
  const r = spawnSync(FF, ['-v', 'error', '-y', ...args], { input, maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${r.stderr}`);
  return r;
}

/** Decodes a stretch of the source to interleaved stereo float PCM at 48 kHz. */
function decode(file, s) {
  const filters = [`highpass=f=${s.hp}:poles=2`, `lowpass=f=${s.lp}:poles=2`, `aresample=${SR}`];
  const probe = spawnSync(FF.replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1'), ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=channels', '-of', 'csv=p=0', file], { encoding: 'utf8' });
  const mono = probe.stdout.trim() === '1';
  const r = ff(['-ss', String(s.start), '-t', String(s.len + XFADE), '-i', file, '-af', filters.join(','), '-ac', mono ? '1' : '2', '-f', 'f32le', '-']);
  const f = new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.length));
  return { mono, pcm: f };
}

/** A gentle feed-forward compressor: shaves the loudest moments (a close bird, a cup on a saucer). */
function soften(ch, amount) {
  if (!amount) return;
  const att = Math.exp(-1 / (0.03 * SR));
  const rel = Math.exp(-1 / (0.6 * SR));
  let env = 0;
  let sum = 0;
  for (const c of ch) for (let i = 0; i < c.length; i++) sum += c[i] * c[i];
  const rms = Math.sqrt(sum / (ch.length * ch[0].length));
  const thr = rms * 1.6;
  const ratio = 1 + amount * 3;
  for (let i = 0; i < ch[0].length; i++) {
    let p = 0;
    for (const c of ch) p = Math.max(p, Math.abs(c[i]));
    env = p > env ? att * env + (1 - att) * p : rel * env + (1 - rel) * p;
    if (env > thr) {
      const g = Math.pow(env / thr, 1 / ratio - 1);
      for (const c of ch) c[i] *= g;
    }
  }
}

/** Equal-power crossfade of the tail into the head: the loop point becomes inaudible. */
function bakeLoop(c, len, fade) {
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    if (i < fade) {
      const k = i / fade;
      out[i] = c[i] * Math.sin((k * Math.PI) / 2) + c[len + i] * Math.cos((k * Math.PI) / 2);
    } else out[i] = c[i];
  }
  return out;
}

function lufs(ch) {
  const inter = interleave(ch);
  const r = spawnSync(FF, ['-hide_banner', '-nostats', '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', '-', '-af', 'ebur128', '-f', 'null', '-'], {
    input: Buffer.from(inter.buffer),
    maxBuffer: 1 << 30,
    encoding: 'buffer',
  });
  const text = r.stderr.toString();
  const m = [...text.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop();
  return m ? Number(m[1]) : -30;
}

function interleave([l, r]) {
  const out = new Float32Array(l.length * 2);
  for (let i = 0; i < l.length; i++) {
    out[i * 2] = l[i];
    out[i * 2 + 1] = r[i];
  }
  return out;
}

async function main() {
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });
  const meta = await commonsMeta(SOUNDS.map((s) => s.file));
  const credits = [];

  for (const s of SOUNDS) {
    const m = meta[s.file];
    if (!m) throw new Error(`no metadata for ${s.file}`);
    const src = path.join(cacheDir, safeName(s.file));
    await download(m, src);

    const { mono, pcm } = decode(src, s);
    const n = Math.floor(pcm.length / (mono ? 1 : 2));
    let ch = mono ? [pcm.slice(0, n)] : [new Float32Array(n), new Float32Array(n)];
    if (!mono) for (let i = 0; i < n; i++) (ch[0][i] = pcm[i * 2]), (ch[1][i] = pcm[i * 2 + 1]);

    soften(ch, s.comp ?? 0.3);
    const len = Math.min(n - XFADE * SR, Math.round(s.len * SR));
    ch = ch.map((c) => bakeLoop(c, len, XFADE * SR));
    if (mono) {
      // Pair the loop with itself, half a loop apart: two uncorrelated "ears", still seamless.
      const l = ch[0];
      const r = new Float32Array(len);
      const shift = Math.floor(len / 2);
      for (let i = 0; i < len; i++) r[i] = l[(i + shift) % len];
      ch = [l, r];
    }

    const gain = Math.pow(10, (s.lufs - lufs(ch)) / 20);
    for (const c of ch) for (let i = 0; i < len; i++) c[i] = Math.tanh(c[i] * gain * 1.25) / 1.25;

    const dest = path.join(outDir, `${s.id}.ogg`);
    ff(['-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', '-', '-c:a', 'libopus', '-b:a', '56k', '-vbr', 'on', '-application', 'audio', dest], Buffer.from(interleave(ch).buffer));
    const kb = Math.round(fs.statSync(dest).size / 1024);
    console.log(`${s.id.padEnd(8)} ${(len / SR).toFixed(1)}s  ${kb} KB  ${m.license}  ${s.author ?? m.author}`);
    credits.push({ id: s.id, title: s.file.replace(/\.\w+$/, ''), author: m.author, license: m.license, licenseUrl: m.licenseUrl, url: m.page, samples: len });
  }

  const ts = `// Generated by scripts/make-ambience.mjs. Do not edit by hand.
// Field recordings from Wikimedia Commons, trimmed, softened and looped for Emberwise.

export interface AmbienceCredit {
  id: string;
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  url: string;
  /** Loop length in samples at 48 kHz. */
  samples: number;
}

export const AMBIENCE_CREDITS: AmbienceCredit[] = ${JSON.stringify(credits, null, 2)};
`;
  fs.writeFileSync(creditsFile, ts);
  console.log('credits ->', path.relative(root, creditsFile));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
