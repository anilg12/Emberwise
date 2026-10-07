'use strict';
// hi-res screenshots of the app for the linkedin posts
// npx electron scripts/promo-shots.cjs --scene=today --out=promo/out/shots
// scenes: today, levelup, focus, hero, shop, stats, welcome, rewards, mixer, chars, settings, about

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { seed } = require('./seed.cjs');

const arg = (name, def) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : def;
};
const scene = arg('scene', 'today');
const out = path.resolve(arg('out', 'promo/out/shots'));
const THEMES = { today: 'light', levelup: 'light', focus: 'dark', hero: 'light', shop: 'dark', stats: 'dark', welcome: 'light', rewards: 'light', gift: 'light', mixer: 'dark', chars: 'light', settings: 'light', about: 'dark' };
const themeArg = process.argv.find((a) => a.startsWith('--theme='));
const theme = themeArg ? themeArg.split('=')[1] : (THEMES[scene] ?? 'light');

const ACH = ['first_task', 'tasks_10', 'tasks_50', 'tasks_100', 'first_focus', 'deep_dive', 'focus_5h', 'focus_25h', 'streak_3', 'streak_7', 'streak_30', 'early_bird', 'night_owl', 'epic', 'purposeful', 'habit_7', 'planner', 'quest_day', 'quest_week', 'rank_diligent', 'rank_master', 'rank_legend', 'shopper', 'collector'];
const iso = (daysAgo, h = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, 15, 0, 0);
  return d.toISOString();
};

function profile() {
  if (scene === 'welcome') return { version: 1, onboarded: false, profile: { name: '' }, settings: { lang: 'tr', theme, sounds: false, notifications: false } };
  const data = seed({ lang: 'tr', theme, onboarded: true });
  data.achievements = Object.fromEntries(ACH.map((a) => [a, iso(3)]));
  Object.assign(data.settings, { sounds: false, notifications: false, motion: 'full', closeToTray: false, ambient: 'rain' });
  // 670 xp = lvl 5 (Çalışkan), 30 short of Usta so one quest ranks up
  const log = [];
  [50, 60, 80, 50, 120, 60, 50, 25, 60, 50, 65].forEach((xp, i) =>
    log.push({ id: `h${i}`, t: iso(11 - i, 9 + (i % 8)), kind: i % 3 === 1 ? 'focus' : 'task', xp, gold: Math.round(xp / 4), ref: `h:${i}`, meta: i % 3 === 1 ? { m: 25, full: 1 } : { d: 'normal', c: 'cat_study' } }),
  );
  log.push({ id: 'adj', t: iso(1, 18), kind: 'quest', xp: 670 - log.reduce((s, e) => s + e.xp, 0), gold: 1200, ref: 'h:adj', label: 'tasks3' });
  data.log = log;
  data.streak = { current: 6, best: 9, lastDay: data.streak.lastDay };
  data.owned = ['pet_cat', 'hat_wizard', 'bg_night', 'hat_flowers', 'bg_meadow', 'pet_owl', 'pet_fox', 'acc_ember_pin', 'hat_sprout', 'char_guardian'];
  data.equipped = { hat: 'hat_wizard', pet: 'pet_cat', bg: 'bg_night' };
  data.tasks = data.tasks.filter((t) => !t.title.includes('Eski')).slice(0, 5);
  if (scene === 'focus') data.settings.focusMin = 1;
  if (scene === 'gift') {
    data.settings.motivation = true;
    data.login.claimed = data.login.claimed.filter((k) => !k.startsWith('gift:'));
  }
  if (scene === 'hero') {
    data.profile.look = { body: 'f', skin: 2, hair: 4, hairColor: 2, heroClass: 'ranger' };
    data.equipped = { hat: 'hat_flowers', pet: 'pet_fox', bg: 'bg_meadow' };
  }
  return data;
}

const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'emberwise-promo-'));
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(userData, 'emberwise-data.json'), JSON.stringify(profile()));
fs.writeFileSync(path.join(userData, 'window-state.json'), JSON.stringify({ width: 1280, height: 800, maximized: false }));
process.env.EMBERWISE_USER_DATA = userData;

const { app } = require('electron');
app.commandLine.appendSwitch('force-device-scale-factor', '2');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function snap(win, name) {
  const img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(out, `${name}.png`), img.toPNG());
  console.log('saved', name, img.getSize());
}

function input(win) {
  const wc = win.webContents;
  const js = (c) => wc.executeJavaScript(c, true);
  const center = (sel, i = 0) =>
    js(`(() => { const el = document.querySelectorAll(${JSON.stringify(sel)})[${i}]; if (!el) return null; el.scrollIntoView({ block: 'nearest' }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  return {
    js,
    async click(sel, i = 0) {
      const p = await center(sel, i);
      if (!p) throw new Error(`missing ${sel}`);
      wc.sendInputEvent({ type: 'mouseMove', x: Math.round(p.x), y: Math.round(p.y) });
      wc.sendInputEvent({ type: 'mouseDown', x: Math.round(p.x), y: Math.round(p.y), button: 'left', clickCount: 1 });
      wc.sendInputEvent({ type: 'mouseUp', x: Math.round(p.x), y: Math.round(p.y), button: 'left', clickCount: 1 });
    },
    async hover(sel, i = 0) {
      const p = await center(sel, i);
      if (p) wc.sendInputEvent({ type: 'mouseMove', x: Math.round(p.x), y: Math.round(p.y) });
    },
    nav: (i) => js(`document.querySelectorAll('.nav-item')[${i}].click()`),
  };
}

const SCENES = {
  async today(win) {
    await snap(win, 'today');
  },
  async levelup(win, h) {
    // hard quest is +80 xp, takes us from 670 past Usta
    const idx = await h.js(`[...document.querySelectorAll('.list .task')].findIndex(t => !t.classList.contains('done') && t.querySelector('.title')?.textContent.includes('Matematik'))`);
    await h.click('.list .task .check', idx);
    await wait(1900);
    await snap(win, 'levelup');
  },
  async focus(win, h) {
    await h.nav(2);
    await wait(800);
    await h.click('.ctl.main');
    await wait(23000);
    await h.js(`document.querySelector('.ctl.main').blur()`);
    await snap(win, 'focus');
  },
  async hero(win, h) {
    await h.nav(3);
    await wait(1400);
    await snap(win, 'hero');
  },
  async shop(win, h) {
    await h.nav(4);
    await wait(900);
    await h.click('.seg button', 1);
    await wait(700);
    await h.hover('.grid .item', 3);
    await wait(900);
    await snap(win, 'shop');
  },
  async gift(win, h) {
    await h.click('.gift-banner');
    await wait(1300);
    await h.click('.gift-pop .actions .btn.primary');
    await wait(2200);
    await snap(win, 'gift');
    console.log('rect', JSON.stringify(await h.js(`(() => { const r = document.querySelector('.modal-root .panel').getBoundingClientRect(); return [r.left, r.top, r.width, r.height, devicePixelRatio]; })()`)));
  },
  async rewards(win, h) {
    await h.nav(5);
    await wait(1500);
    await snap(win, 'rewards');
  },
  async mixer(win, h) {
    await h.nav(2);
    await wait(1200);
    await snap(win, 'mixer');
  },
  async chars(win, h) {
    await h.nav(3);
    await wait(900);
    await h.js(`document.querySelector('.right .field:last-of-type')?.scrollIntoView({ block: 'center' })`);
    await wait(700);
    await snap(win, 'chars');
  },
  async settings(win, h) {
    await h.click('.sidebar .foot .icon-btn:nth-of-type(2)');
    await wait(1200);
    await snap(win, 'settings');
  },
  async about(win, h) {
    await h.click('.sidebar .foot .info');
    await wait(1200);
    await snap(win, 'about');
  },
  async stats(win, h) {
    await h.nav(7);
    await wait(1500);
    await snap(win, 'stats');
  },
  async welcome(win) {
    await wait(600);
    await snap(win, 'welcome');
  },
};

let warmed = false;
app.on('browser-window-created', (_e, win) => {
  win.webContents.on('did-finish-load', () => {
    if (scene !== 'welcome' && !warmed) {
      warmed = true;
      setTimeout(() => win.webContents.reload(), 2500);
      return;
    }
    (async () => {
      win.setContentSize(1280, 800);
      win.center();
      await wait(1600);
      await SCENES[scene](win, input(win));
      app.exit(0);
    })().catch((e) => {
      console.error(e);
      app.exit(1);
    });
  });
});

require('../electron/main.cjs');
