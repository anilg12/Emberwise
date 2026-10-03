'use strict';
// End-to-end smoke test: drives the real Electron app through the main user flows
// with a fresh profile and fails on any assertion or renderer error.
// Usage: npx electron scripts/e2e.cjs

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'emberwise-e2e-'));
fs.writeFileSync(path.join(userData, 'emberwise-data.json'), JSON.stringify({ version: 1, onboarded: false, profile: { name: '' }, settings: { lang: 'tr', theme: 'light', sounds: false, notifications: false } }));
process.env.EMBERWISE_USER_DATA = userData;

const { app } = require('electron');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
let passed = 0;

function check(cond, label) {
  if (!cond) throw new Error(`FAILED: ${label}`);
  passed++;
  console.log(`  ✓ ${label}`);
}

app.on('browser-window-created', (_e, win) => {
  win.webContents.on('console-message', (event) => {
    if (event.level === 'error') errors.push(event.message);
  });
  win.webContents.on('render-process-gone', (_ev, d) => errors.push(`renderer gone: ${d.reason}`));
  win.webContents.once('did-finish-load', () =>
    run(win)
      .then(() => {
        console.log(`\nE2E OK — ${passed} checks passed, ${errors.length} console errors`);
        if (errors.length) {
          console.log(errors.join('\n'));
          app.exit(1);
        } else app.exit(0);
      })
      .catch((err) => {
        console.error(err.message);
        if (errors.length) console.error('console errors:\n' + errors.join('\n'));
        app.exit(1);
      }),
  );
});

async function run(win) {
  const js = (code) => win.webContents.executeJavaScript(code, true);
  const text = (sel) => js(`(document.querySelector(${JSON.stringify(sel)})?.textContent ?? '').trim()`);
  const exists = (sel) => js(`!!document.querySelector(${JSON.stringify(sel)})`);
  const click = (sel) => js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ' + ${JSON.stringify(sel)}); el.click(); })()`);
  const type = (sel, value) =>
    js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); el.focus(); el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  const key = (sel, k, extra = {}) =>
    js(`(() => { const el = ${sel ? `document.querySelector(${JSON.stringify(sel)})` : 'window'}; el.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key: ${JSON.stringify(k)}, bubbles: true }, ${JSON.stringify(extra)}))); })()`);

  await wait(1500);
  console.log('Onboarding');
  check(await exists('.onb'), 'first launch shows onboarding');
  await click('.nav .btn.primary');
  await wait(600);
  await click('.nav .btn.primary');
  await wait(400);
  check(await exists('.input.big.shake'), 'empty name is rejected with a shake');
  await type('.input.big', 'Anıl');
  await click('.nav .btn.primary');
  await wait(600);
  await click('.hairs .hair:nth-child(3)');
  await click('.nav .btn.primary');
  await wait(600);
  await click('.nav .btn.primary');
  await wait(1200);
  check(await exists('.shell'), 'onboarding finishes into the app');
  check((await text('h1')).includes('Anıl'), 'greeting uses the hero name');
  check((await js(`document.querySelectorAll('.list .task').length`)) === 1, 'a starter quest is created');
  check(!(await exists('.sidebar .sig')), 'no signature in the sidebar');

  console.log('Daily gift');
  await wait(1000);
  check(await exists('.gift-pop'), 'the first daily gift opens on its own');
  const goldBefore = await text('.hero-card .stat.gold');
  await click('.gift-pop .actions .btn.primary');
  await wait(900);
  check((await text('.hero-card .stat.gold')) !== goldBefore, `opening the gift pays out (${goldBefore} → ${await text('.hero-card .stat.gold')})`);
  await key('.modal-root', 'Escape');
  await wait(600);
  check(!(await exists('.gift-pop')), 'the gift window closes');

  console.log('Quests');
  await type('.qa input', 'Test görevi 23:59');
  await key('.qa input', 'Enter');
  await wait(600);
  check((await js(`document.querySelectorAll('.list .task').length`)) === 2, 'quick add creates a quest');
  check((await js(`[...document.querySelectorAll('.list .task .title')].some(e => e.textContent.trim() === 'Test görevi')`)), 'quick add strips the time from the title');
  check((await js(`[...document.querySelectorAll('.list .task .chip')].some(e => e.textContent.includes('23:59'))`)), 'quick add sets a reminder');

  const xpBefore = await text('.hero-card .stat.xp');
  await click('.list .task .check');
  await wait(900);
  const xpAfter = await text('.hero-card .stat.xp');
  check(xpBefore !== xpAfter, `completing a quest grants XP (${xpBefore} → ${xpAfter})`);
  check(await exists('.toast'), 'completion shows a toast');
  if (await exists('.overlay')) {
    check(true, 'level-up celebration appears');
    await key(null, 'Escape');
    await wait(500);
    check(!(await exists('.overlay')), 'Escape closes the celebration');
  }

  await key(null, 'n', { ctrlKey: true, metaKey: process.platform === 'darwin' });
  await wait(600);
  check(await exists('.editor'), 'Ctrl+N opens the quest editor');
  await click('.editor footer .btn.primary');
  await wait(300);
  check(await exists('.editor .error'), 'editor refuses an empty name');
  await type('.editor .title-input', 'Editörden görev');
  await type('.editor .purpose input', 'Test için');
  await click('.editor .diff:nth-child(4)');
  await click('.editor footer .btn.primary');
  await wait(700);
  check(!(await exists('.editor')), 'editor closes after saving');
  check((await js(`[...document.querySelectorAll('.task .title')].some(e => e.textContent.trim() === 'Editörden görev')`)), 'saved quest appears in the list');

  console.log('Pages');
  for (let i = 0; i < 8; i++) {
    await js(`document.querySelectorAll('.nav-item')[${i}].click()`);
    await wait(500);
    check(await exists('.page'), `page ${i + 1} renders`);
  }

  console.log('Rewards');
  await js(`document.querySelectorAll('.nav-item')[5].click()`);
  await wait(800);
  check((await js(`document.querySelectorAll('.track .stop').length`)) >= 15, 'the reward path lists its stops');
  check(await exists('.stop.ready .btn.primary'), 'day 1 on the path is ready to claim');
  await click('.stop.ready .btn.primary');
  await wait(600);
  check(await exists('.stop.claimed'), 'claiming a path stop marks it claimed');

  console.log('Mood & words');
  await js(`document.querySelectorAll('.nav-item')[0].click()`);
  await wait(700);
  check(await exists('.words .text'), 'the words of the day are shown');
  await click('.mood .face:nth-child(4)');
  await wait(500);
  check(await exists('.mood .note input'), 'picking a mood opens the gratitude note');

  console.log('Ambience');
  const bytes = await js(`window.ember.readSound('cafe').then(b => b ? b.byteLength : 0)`);
  check(bytes > 100000, `the café loop ships with the app (${Math.round(bytes / 1024)} KB)`);
  check((await js(`window.ember.readSound('../package')`)) === null, 'the sound bridge refuses other files');
  const secs = await js(`window.ember.readSound('rain').then(b => new AudioContext().decodeAudioData(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))).then(a => a.duration)`);
  check(secs > 40, `the rain loop decodes (${secs.toFixed(1)} s)`);

  console.log('Focus timer');
  await js(`document.querySelectorAll('.nav-item')[2].click()`);
  await wait(600);
  const onBefore = await js(`document.querySelectorAll('.mixer .tile.on').length`);
  await js(`document.querySelector('.mixer .tile:not(.on) .tile-btn').click()`);
  await wait(400);
  check((await js(`document.querySelectorAll('.mixer .tile.on').length`)) === onBefore + 1, 'a sound joins the mix');
  check(await exists('.mixer .listen.on'), 'the mixer starts listening');
  await click('.mixer .listen');
  await wait(300);
  const before = await text('.time');
  await click('.ctl.main');
  await wait(2300);
  const during = await text('.time');
  check(before !== during, `timer counts down (${before} → ${during})`);
  check(await exists('.nav-item .pill.timer'), 'sidebar shows the running timer');
  await key(null, ' ');
  await wait(1300);
  const paused1 = await text('.time');
  await wait(1200);
  check(paused1 === (await text('.time')), 'Space pauses the timer');
  await click('.ctl.ghost[aria-label]');
  await wait(400);

  console.log('About');
  await click('.sidebar .foot .info');
  await wait(600);
  check(await exists('.about .sig svg, .about svg'), 'the About window shows the signature');
  await key('.modal-root', 'Escape');
  await wait(500);

  console.log('Theme & language');
  const darkBefore = await js(`document.documentElement.classList.contains('dark')`);
  await click('.sidebar .foot .icon-btn');
  await wait(400);
  check((await js(`document.documentElement.classList.contains('dark')`)) !== darkBefore, 'theme toggle switches light/dark');
  await click('.sidebar .foot .icon-btn:nth-of-type(2)');
  await wait(700);
  await js(`[...document.querySelectorAll('.seg button')].find(b => b.textContent.trim() === 'English').click()`);
  await wait(500);
  check((await text('.nav-item .nav-label')) === 'Today', 'language switches to English');

  console.log('Persistence');
  await wait(800);
  const saved = JSON.parse(fs.readFileSync(path.join(userData, 'emberwise-data.json'), 'utf8'));
  check(saved.onboarded === true && saved.profile.name === 'Anıl', 'profile is saved to disk');
  check(saved.tasks.length === 3, 'quests are saved to disk');
  check(saved.settings.lang === 'en', 'settings are saved to disk');
  check(saved.log.some((e) => e.kind === 'task' && e.xp > 0), 'XP log is saved to disk');
  check(saved.login.total === 1 && saved.login.claimed.includes('path:1'), 'login rewards are saved to disk');
  check(Object.keys(saved.journal).length === 1, 'the mood journal is saved to disk');
  await wait(300);
}

require('../electron/main.cjs');
