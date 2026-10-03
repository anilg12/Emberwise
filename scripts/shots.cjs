'use strict';
// Screenshot harness: launches the real Electron app with a seeded profile and captures every page.
// Usage: npx electron scripts/shots.cjs --theme=dark --lang=tr --out=shots [--onboarding] [--only=today,focus]

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { seed } = require('./seed.cjs');

const arg = (name, def) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : def;
};
const flag = (name) => process.argv.includes(`--${name}`);

const theme = arg('theme', 'light');
const lang = arg('lang', 'tr');
const out = path.resolve(arg('out', 'shots'));
const only = arg('only', '');
const onboarding = flag('onboarding');
const width = Number(arg('w', 1280));
const height = Number(arg('h', 800));

const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'emberwise-shots-'));
fs.mkdirSync(out, { recursive: true });
const data = onboarding
  ? { version: 1, onboarded: false, profile: { name: '' }, settings: { lang, theme } }
  : seed({ lang, theme, onboarded: true });
fs.writeFileSync(path.join(userData, 'emberwise-data.json'), JSON.stringify(data));
fs.writeFileSync(path.join(userData, 'window-state.json'), JSON.stringify({ width, height, maximized: false }));
process.env.EMBERWISE_USER_DATA = userData;

const { app } = require('electron');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

app.on('browser-window-created', (_e, win) => {
  win.webContents.once('did-finish-load', () => run(win).catch((err) => {
    console.error(err);
    app.exit(1);
  }));
});

async function shot(win, name) {
  const img = await win.webContents.capturePage();
  const file = path.join(out, `${theme}-${lang}-${name}.png`);
  fs.writeFileSync(file, img.toPNG());
  console.log('saved', file);
}

async function js(win, code) {
  return win.webContents.executeJavaScript(code, true);
}

let warmed = false;

async function run(win) {
  win.setContentSize(width, height);
  win.center();
  if (!onboarding && !warmed && !flag('nowarm')) {
    // First load unlocks achievements for the seeded history; let that settle, then reload clean.
    warmed = true;
    await wait(16000);
    win.webContents.once('did-finish-load', () => run(win).catch((err) => {
      console.error(err);
      app.exit(1);
    }));
    win.webContents.reload();
    return;
  }
  await wait(1800);

  if (onboarding) {
    await shot(win, 'onb-1');
    for (let i = 2; i <= 4; i++) {
      if (i === 3) await js(win, `(() => { const el = document.querySelector('.input.big'); if (el) { el.value = 'Anıl'; el.dispatchEvent(new Event('input', { bubbles: true })); } })()`);
      await js(win, `document.querySelector('.nav .btn.primary').click()`);
      await wait(900);
      await shot(win, `onb-${i}`);
    }
    app.exit(0);
    return;
  }

  const routes = ['today', 'quests', 'focus', 'hero', 'shop', 'rewards', 'awards', 'stats'];
  for (let i = 0; i < routes.length; i++) {
    if (only && !only.split(',').includes(routes[i])) continue;
    await js(win, `document.querySelectorAll('.nav-item')[${i}].click()`);
    await wait(1100);
    await shot(win, `${i + 1}-${routes[i]}`);
  }
  if (!only || only.includes('settings')) {
    await js(win, `document.querySelector('.foot .icon-btn:nth-of-type(2)').click()`);
    await wait(1100);
    await shot(win, '9-settings');
    await js(win, `document.querySelector('.scroller').scrollTop = 99999`);
    await wait(1800);
    await shot(win, '9b-settings-bottom');
  }
  if (!only || only.includes('editor')) {
    await js(win, `document.querySelectorAll('.nav-item')[1].click()`);
    await wait(600);
    await js(win, `document.querySelector('.task .body').click()`);
    await wait(900);
    await shot(win, '10-editor');
  }
  if (!only || only.includes('levelup')) {
    await js(win, `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
    await wait(500);
  }
  app.exit(0);
}

require('../electron/main.cjs');
