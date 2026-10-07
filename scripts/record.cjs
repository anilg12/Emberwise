'use strict';
// records the demo gifs for the readme
// npx electron scripts/record.cjs --scene=quest --out=docs/media [--theme=light] [--lang=tr]
// scenes: quest, focus, hero, shop, theme, onboarding, rewards, sounds, words

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { seed } = require('./seed.cjs');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');

const arg = (name, def) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : def;
};
const scene = arg('scene', 'quest');
const out = path.resolve(arg('out', 'docs/media'));
const lang = arg('lang', 'tr');
const WIDTH = Number(arg('gifw', 880));

const THEMES = { quest: 'light', focus: 'dark', hero: 'light', shop: 'dark', theme: 'light', onboarding: 'light', rewards: 'light', sounds: 'dark', words: 'light' };
const theme = arg('theme', THEMES[scene] ?? 'light');

const ALL_ACHIEVEMENTS = [
  'first_task', 'tasks_10', 'tasks_50', 'tasks_100', 'first_focus', 'deep_dive', 'focus_5h', 'focus_25h',
  'streak_3', 'streak_7', 'streak_30', 'early_bird', 'night_owl', 'epic', 'purposeful', 'habit_7', 'planner',
  'quest_day', 'quest_week', 'rank_diligent', 'rank_master', 'rank_legend', 'shopper', 'collector',
  'login_7', 'login_30', 'login_100', 'journal_7', 'breathe_5',
];

function dayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// --- profile ---

function iso(daysAgo, h = 10) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, 15, 0, 0);
  return d.toISOString();
}

function profile() {
  if (scene === 'onboarding') {
    return { version: 1, onboarded: false, profile: { name: '' }, settings: { lang, theme, sounds: false, notifications: false, motion: 'full' } };
  }
  const data = seed({ lang, theme, onboarded: true });
  const unlocked = {};
  for (const id of ALL_ACHIEVEMENTS) unlocked[id] = iso(3);
  data.achievements = unlocked;
  data.settings.sounds = false;
  data.settings.notifications = false;
  data.settings.motion = 'full';
  data.settings.closeToTray = false;

  // fake history worth exactly 670 xp (lvl 5 Çalışkan, 30 from Usta)
  const log = [];
  const xpPlan = [50, 60, 80, 50, 120, 60, 50, 25, 60, 50, 65];
  xpPlan.forEach((xp, i) => {
    log.push({ id: `h${i}`, t: iso(11 - i, 9 + (i % 8)), kind: i % 3 === 1 ? 'focus' : 'task', xp, gold: Math.round(xp / 4), ref: `hist:${i}`, label: 'Geçmiş', meta: i % 3 === 1 ? { m: 25, full: 1 } : { d: 'normal', c: 'cat_study' } });
  });
  const sum = log.reduce((s, e) => s + e.xp, 0);
  log.push({ id: 'adj', t: iso(1, 18), kind: 'quest', xp: 670 - sum, gold: 40, ref: 'hist:adj', label: 'tasks3' });
  if (scene === 'shop') log.push({ id: 'rich', t: iso(1, 19), kind: 'chest', xp: 0, gold: 1600, ref: 'hist:gold' });
  data.log = log;
  data.sessions = data.sessions.slice(-12);
  data.streak = { current: 4, best: 9, lastDay: data.streak.lastDay };
  data.owned = ['pet_cat', 'hat_wizard', 'bg_night', 'hat_flowers', 'bg_meadow', 'pet_owl', 'acc_ember_pin', 'hat_sprout', 'char_guardian'];
  data.equipped = { hat: 'hat_wizard', pet: 'pet_cat', bg: 'bg_night', acc: null };

  if (scene === 'quest') {
    data.tasks = data.tasks.filter((t) => !t.title.includes('Eski') && !t.title.includes('Leftover')).slice(0, 4);
  }
  if (scene === 'focus') {
    data.settings.focusMin = 1;
    data.settings.ambient = {};
  }
  if (scene === 'hero') {
    data.profile.look = { body: 'f', skin: 1, hair: 1, hairColor: 1, heroClass: 'wizard', tone: 0 };
    data.owned.push('char_explorer', 'char_astronaut', 'acc_glasses', 'acc_headphones', 'hat_beret', 'pet_bunny', 'pet_fox', 'bg_beach', 'bg_cafe');
    data.equipped = { hat: null, pet: null, bg: 'bg_meadow', acc: null };
  }
  if (scene === 'rewards') {
    // today's gift unopened + a few path stops waiting
    const today = dayKey(new Date());
    data.login.claimed = data.login.claimed.filter((k) => k !== `gift:${today}`);
    data.equipped = { hat: null, pet: 'pet_cat', bg: 'bg_meadow', acc: null };
    // so the gift doesn't level us up mid recording
    data.log.find((e) => e.id === 'adj').xp -= 90;
  }
  if (scene === 'sounds') data.settings.ambient = {};
  if (scene === 'words') {
    data.settings.motivation = true;
    delete data.journal[dayKey(new Date())];
  }
  return data;
}

const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'emberwise-rec-'));
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(userData, 'emberwise-data.json'), JSON.stringify(profile()));
fs.writeFileSync(path.join(userData, 'window-state.json'), JSON.stringify({ width: 1280, height: 800, maximized: false }));
process.env.EMBERWISE_USER_DATA = userData;

const { app } = require('electron');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// --- recorder ---

class Recorder {
  constructor(win) {
    this.win = win;
    this.frames = [];
    this.interval = 66;
    this.speed = 1; // >1 = timelapse
    this.last = 0;
    this.latest = null;
    this.ticker = null;
  }
  keep(image) {
    const small = image.resize({ width: WIDTH, quality: 'good' });
    const { width, height } = small.getSize();
    this.frames.push({ bgra: small.toBitmap(), width, height, t: Date.now(), speed: this.speed });
  }
  start(interval = 66) {
    this.interval = interval;
    const wc = this.win.webContents;
    // frames come in on paint, keep max one per interval
    wc.beginFrameSubscription(false, (image) => {
      this.latest = image;
      const now = Date.now();
      if (now - this.last >= this.interval) {
        this.last = now;
        this.keep(image);
      }
    });
    // nothing repainted, still push the last frame so the timing stays right
    this.ticker = setInterval(() => {
      if (this.latest && Date.now() - this.last >= Math.max(this.interval, 400)) {
        this.last = Date.now();
        this.keep(this.latest);
      }
    }, 100);
  }
  async stop() {
    this.win.webContents.endFrameSubscription();
    clearInterval(this.ticker);
  }
}

function toRgba(bgra) {
  const rgba = Buffer.alloc(bgra.length);
  for (let i = 0; i < bgra.length; i += 4) {
    rgba[i] = bgra[i + 2];
    rgba[i + 1] = bgra[i + 1];
    rgba[i + 2] = bgra[i];
    rgba[i + 3] = 255;
  }
  return rgba;
}

function encodeGif(frames, file, holdLastMs = 1600) {
  const { width, height } = frames[0];
  const rgbaFrames = frames.map((f) => toRgba(f.bgra));

  // one palette for the whole clip: 255 colors + 1 transparent
  const sampleEvery = Math.max(1, Math.floor(rgbaFrames.length / 24));
  const parts = [];
  for (let i = 0; i < rgbaFrames.length; i += sampleEvery) parts.push(rgbaFrames[i]);
  const sample = Buffer.concat(parts);
  const palette = quantize(sample, 255, { format: 'rgb565' });
  while (palette.length < 255) palette.push([0, 0, 0]);
  palette.push([255, 0, 255]); // index 255: transparent
  const TRANSPARENT = 255;

  const gif = GIFEncoder();
  let prev = null;
  for (let i = 0; i < rgbaFrames.length; i++) {
    const index = applyPalette(rgbaFrames[i], palette.slice(0, 255), 'rgb565');
    let delay;
    if (i < frames.length - 1) {
      const real = frames[i + 1].t - frames[i].t;
      delay = Math.round(real / frames[i].speed);
    } else delay = holdLastMs;
    delay = Math.max(40, Math.min(delay, 4000));
    let data = index;
    if (prev) {
      // only changed pixels, the rest is transparent so the previous frame shows through
      data = new Uint8Array(index.length);
      for (let p = 0; p < index.length; p++) data[p] = index[p] === prev[p] ? TRANSPARENT : index[p];
    }
    gif.writeFrame(data, width, height, {
      palette: i === 0 ? palette : undefined,
      delay,
      transparent: i > 0,
      transparentIndex: TRANSPARENT,
      dispose: 1,
      repeat: 0,
    });
    prev = index;
  }
  gif.finish();
  fs.writeFileSync(file, gif.bytes());
  return { frames: rgbaFrames.length, kb: Math.round(gif.bytes().length / 1024) };
}

// --- demo helpers ---

function helpers(win) {
  const wc = win.webContents;
  const js = (code) => wc.executeJavaScript(code, true);
  const cursor = { x: 640, y: 420 };

  async function installCursor() {
    await js(`(() => {
      const s = document.createElement('style');
      s.textContent = \`
        .demo-cursor{position:fixed;left:0;top:0;width:26px;height:26px;z-index:2147483647;pointer-events:none;
          transition:transform .55s cubic-bezier(.22,1,.36,1);filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
        .demo-ring{position:fixed;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;
          border:3px solid #ee6c3a;z-index:2147483646;pointer-events:none;opacity:0}
        .demo-ring.go{animation:demo-ring .5s ease-out}
        @keyframes demo-ring{0%{opacity:.9;transform:var(--p) scale(.4)}100%{opacity:0;transform:var(--p) scale(1.5)}}\`;
      document.head.appendChild(s);
      const c = document.createElement('div');
      c.className = 'demo-cursor';
      c.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2.5 19.5 13l-7 1.2-3.6 6.6z" fill="#fff" stroke="#2b2335" stroke-width="1.6" stroke-linejoin="round"/></svg>';
      c.style.transform = 'translate(640px,420px)';
      document.body.appendChild(c);
      const r = document.createElement('div');
      r.className = 'demo-ring';
      document.body.appendChild(r);
      window.__demo = { c, r };
    })()`);
  }

  async function moveTo(x, y, ms = 600) {
    cursor.x = x;
    cursor.y = y;
    await js(`window.__demo.c.style.transform = 'translate(${x - 3}px,${y - 2}px)'`);
    wc.sendInputEvent({ type: 'mouseMove', x: Math.round(x), y: Math.round(y) });
    await wait(ms);
  }

  async function center(sel, index = 0) {
    return js(`(() => { const els = document.querySelectorAll(${JSON.stringify(sel)}); const el = els[${index}];
      if (!el) return null; el.scrollIntoView({ block: 'nearest' }); const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  }

  async function hover(sel, index = 0, ms = 700) {
    const p = await center(sel, index);
    if (!p) throw new Error(`missing ${sel}[${index}]`);
    await moveTo(p.x, p.y, ms);
    return p;
  }

  async function click(sel, index = 0, after = 500) {
    const p = await hover(sel, index, 550);
    await js(`(() => { const r = window.__demo.r; r.style.setProperty('--p', 'translate(${p.x}px,${p.y}px)');
      r.style.transform = 'translate(${p.x}px,${p.y}px)'; r.classList.remove('go'); void r.offsetWidth; r.classList.add('go'); })()`);
    wc.sendInputEvent({ type: 'mouseDown', x: Math.round(p.x), y: Math.round(p.y), button: 'left', clickCount: 1 });
    await wait(70);
    wc.sendInputEvent({ type: 'mouseUp', x: Math.round(p.x), y: Math.round(p.y), button: 'left', clickCount: 1 });
    await wait(after);
  }

  async function type(text, perChar = 75) {
    for (const ch of text) {
      wc.sendInputEvent({ type: 'char', keyCode: ch });
      await wait(perChar);
    }
  }

  async function key(k) {
    wc.sendInputEvent({ type: 'keyDown', keyCode: k });
    wc.sendInputEvent({ type: 'keyUp', keyCode: k });
  }

  return { js, installCursor, moveTo, hover, click, type, key, center };
}

// --- scenes ---

const SCENES = {
  async quest(h, rec) {
    await h.moveTo(900, 300, 300);
    rec.start(70);
    await wait(500);
    await h.click('.qa input', 0, 300);
    await h.type(lang === 'tr' ? 'Matematik çalış 14:30' : 'Study math 14:30', 70);
    await wait(500);
    await h.key('Enter');
    await wait(1100);
    const idx = await h.js(`[...document.querySelectorAll('.list .task')].findIndex(t => t.querySelector('.title')?.textContent.trim().startsWith(${JSON.stringify(lang === 'tr' ? 'Matematik çalış' : 'Study math')}) && !t.classList.contains('done'))`);
    await h.click('.list .task .check', idx, 300);
    await wait(3800);
    await h.click('.overlay .btn.primary', 0, 900);
    await h.moveTo(1100, 620, 600);
    await rec.stop();
  },

  async focus(h, rec) {
    await h.js(`document.querySelectorAll('.nav-item')[2].click()`);
    await wait(900);
    await h.moveTo(980, 200, 200);
    rec.start(80);
    await wait(500);
    await h.click('.ctl.main', 0, 600);
    // timelapse the 1 min session
    rec.interval = 900;
    rec.speed = 12;
    await h.moveTo(1150, 700, 300);
    const until = Date.now() + 56_000;
    while (Date.now() < until) await wait(500);
    rec.interval = 80;
    rec.speed = 1;
    await wait(4200);
    await rec.stop();
  },

  async hero(h, rec) {
    await h.js(`document.querySelectorAll('.nav-item')[3].click()`);
    await wait(900);
    await h.moveTo(1000, 300, 200);
    rec.start(75);
    await wait(400);
    for (const i of [2, 4]) await h.click('.hairs .hair', i, 450);
    await h.click('.sw', 6 + 3, 400);
    // free chars, then a bought one, then the login-only guardian
    for (const i of [4, 5, 6, 7]) await h.click('.chars .char', i, 650);
    await h.click('.chars .char', 8, 650);
    await h.click('.chars .char', 13, 700);
    for (const i of [1, 2, 3]) await h.click('.tones .tone', i, 500);
    await h.click('.chars .char', 14, 800);
    await h.click('.right .seg button', 1, 800);
    // hats, accessories, companions, realms
    for (const i of [2, 4, 7, 9, 12, 15]) await h.click('.items .item', i, 650);
    await wait(900);
    await rec.stop();
  },

  async shop(h, rec) {
    await h.js(`document.querySelectorAll('.nav-item')[4].click()`);
    await wait(900);
    await h.moveTo(900, 250, 200);
    rec.start(75);
    await wait(400);
    for (const i of [0, 1, 3, 5]) await h.hover('.grid .item', i, 650);
    await h.click('.seg button', 1, 700);
    for (const i of [1, 4, 7, 8]) await h.hover('.grid .item', i, 600);
    await h.click('.seg button', 2, 700);
    for (const i of [2, 4, 6]) await h.hover('.grid .item', i, 600);
    await h.click('.seg button', 3, 700);
    for (const i of [1, 3, 4]) await h.hover('.grid .item', i, 600);
    await h.click('.grid .item .btn.primary', 0, 450);
    await h.click('.grid .item .btn.primary', 0, 1800);
    await rec.stop();
  },

  async rewards(h, rec) {
    await h.moveTo(900, 300, 200);
    rec.start(75);
    await wait(700);
    await h.click('.gift-banner', 0, 1400);
    await h.click('.gift-pop .actions .btn.primary', 0, 2600);
    await h.hover('.gift-pop .actions .btn.ghost', 0, 500);
    await h.js(`document.querySelector('.gift-pop .actions .btn.ghost').click()`);
    await wait(1500);
    await h.hover('.track .stop.ready', 0, 600);
    await h.click('.track .stop.ready .btn.primary', 0, 1400);
    await h.click('.track .stop.ready .btn.primary', 0, 1400);
    await h.js(`document.querySelector('.track').scrollBy({ left: 340, behavior: 'smooth' })`);
    await wait(900);
    await h.click('.track .stop.ready .btn.primary', 0, 1600);
    const last = (await h.js(`document.querySelectorAll('.track .stop.claimed .btn.soft').length`)) - 1;
    await h.click('.track .stop.claimed .btn.soft', last, 1400);
    await h.js(`document.querySelector('.scroller').scrollTo({ top: 900, behavior: 'smooth' })`);
    await wait(2000);
    await rec.stop();
  },

  async sounds(h, rec) {
    await h.js(`document.querySelectorAll('.nav-item')[2].click()`);
    await wait(900);
    await h.moveTo(1100, 300, 200);
    rec.start(75);
    await wait(500);
    for (const i of [7, 0]) await h.click('.mixer .tile-btn', i, 800);
    await h.hover('.mixer .tile.on .t-level', 0, 600);
    await h.js(`(() => { const el = document.querySelector('.mixer .tile.on .t-level'); el.value = 0.35; el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await wait(700);
    await h.click('.mixer .tile-btn', 9, 800);
    await h.js(`document.querySelector('.scroller').scrollTo({ top: 420, behavior: 'smooth' })`);
    await wait(900);
    for (const i of [1, 3, 2]) await h.click('.mixer .chip-btn', i, 1100);
    await h.click('.breathe-btn', 0, 900);
    await h.click('.breathe .btn.primary', 0, 6500);
    await rec.stop();
  },

  async words(h, rec) {
    await h.js(`document.querySelector('.scroller').scrollTo({ top: 560 })`);
    await wait(700);
    await h.moveTo(1100, 360, 200);
    rec.start(75);
    await wait(600);
    await h.click('.words .tools .icon-btn', 0, 1300);
    await h.click('.words .tools .icon-btn', 0, 1300);
    await h.click('.words .heart', 0, 900);
    await h.click('.mood .face', 3, 2600);
    await h.click('.mood .note input', 0, 300);
    await h.type(lang === 'tr' ? 'Güneşli bir sabah yürüyüşü' : 'A sunny morning walk', 60);
    await wait(3200);
    await rec.stop();
  },

  async theme(h, rec) {
    await wait(300);
    await h.moveTo(700, 400, 200);
    rec.start(75);
    await wait(400);
    await h.click('.sidebar .foot .icon-btn', 0, 1200);
    await h.click('.sidebar .foot .icon-btn', 1, 1000);
    for (const i of [1, 2, 3, 4, 5, 0]) await h.click('.accents .acc', i, 550);
    await h.click('.themes .theme', 0, 1100);
    await h.js(`document.querySelectorAll('.nav-item')[0].click()`);
    await wait(1400);
    await rec.stop();
  },

  async onboarding(h, rec) {
    await h.moveTo(900, 640, 200);
    rec.start(75);
    await wait(1200);
    await h.click('.nav .btn.primary', 0, 900);
    await h.click('.input.big', 0, 200);
    await h.type('Anıl', 110);
    await wait(400);
    await h.click('.nav .btn.primary', 0, 900);
    await h.click('.seg button', 1, 500);
    for (const i of [0, 5, 2]) await h.click('.hairs .hair', i, 380);
    await h.click('.sw', 2, 350);
    await h.click('.sw', 6 + 3, 350);
    for (const i of [1, 4, 7, 2]) await h.click('.chars .char', i, 500);
    await h.click('.nav .btn.primary', 0, 1300);
    await h.click('.nav .btn.primary', 0, 2800);
    if (await h.js(`!!document.querySelector('.gift-pop')`)) await h.click('.gift-pop .actions .btn.primary', 0, 2600);
    await rec.stop();
  },
};

// --- main ---

let warmed = false;
app.on('browser-window-created', (_e, win) => {
  win.webContents.on('did-finish-load', () => {
    if (scene !== 'onboarding' && !warmed) {
      warmed = true;
      setTimeout(() => win.webContents.reload(), 2500);
      return;
    }
    run(win).catch((err) => {
      console.error(err);
      app.exit(1);
    });
  });
});

async function run(win) {
  win.setContentSize(1280, 800);
  win.center();
  await wait(1500);
  const h = helpers(win);
  await h.installCursor();
  const rec = new Recorder(win);
  await SCENES[scene](h, rec);
  const file = path.join(out, `${scene}.gif`);
  const info = encodeGif(rec.frames, file);
  console.log(`${scene}.gif  ${info.frames} frames  ${info.kb} KB`);
  app.exit(0);
}

require('../electron/main.cjs');
