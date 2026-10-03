'use strict';
// Builds a realistic, lived-in Emberwise profile for screenshots and manual QA.

function pad(n) {
  return String(n).padStart(2, '0');
}
function dayKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function daysAgo(n, h = 10, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, m, 0, 0);
  return d;
}
let seq = 0;
const id = () => `seed${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function seed(opts = {}) {
  const lang = opts.lang || 'tr';
  const tr = lang === 'tr';
  const today = dayKey(new Date());
  const tomorrow = dayKey(daysAgo(-1));
  const later = dayKey(daysAgo(-4));
  const log = [];
  const sessions = [];
  let rnd = 42;
  const r = () => {
    rnd = (rnd * 9301 + 49297) % 233280;
    return rnd / 233280;
  };

  const cats = ['cat_study', 'cat_work', 'cat_health', 'cat_personal', null];
  const diffs = ['easy', 'normal', 'normal', 'hard', 'epic'];
  const XP = { easy: 25, normal: 50, hard: 80, epic: 120 };
  const GOLD = { easy: 5, normal: 10, hard: 16, epic: 25 };

  for (let day = 34; day >= 1; day--) {
    if (r() < 0.3) continue;
    const nTasks = Math.floor(r() * 2.2);
    for (let i = 0; i < nTasks; i++) {
      const d = diffs[Math.floor(r() * diffs.length)];
      const t = daysAgo(day, 8 + Math.floor(r() * 12), Math.floor(r() * 59));
      log.push({ id: id(), t: t.toISOString(), kind: 'task', xp: XP[d], gold: GOLD[d], ref: `task:old${day}${i}`, label: tr ? 'Eski görev' : 'Old quest', meta: { d, p: r() < 0.5 ? 1 : undefined, c: cats[Math.floor(r() * cats.length)] } });
    }
    const nFocus = r() < 0.55 ? 1 : 0;
    for (let i = 0; i < nFocus; i++) {
      const minutes = [25, 25, 25, 50, 15][Math.floor(r() * 5)];
      const end = daysAgo(day, 9 + i * 3 + Math.floor(r() * 3), Math.floor(r() * 59));
      const start = new Date(end.getTime() - minutes * 60000);
      const sid = id();
      sessions.push({ id: sid, start: start.toISOString(), end: end.toISOString(), minutes, completed: true, taskId: null });
      log.push({ id: id(), t: end.toISOString(), kind: 'focus', xp: minutes * 2 + 10, gold: Math.floor(minutes / 5), ref: `focus:${sid}`, meta: { m: minutes, full: 1 } });
    }
  }
  // Today so far
  const t1 = new Date();
  t1.setHours(Math.max(0, t1.getHours() - 2), 10, 0, 0);
  const sid = id();
  sessions.push({ id: sid, start: new Date(t1.getTime() - 25 * 60000).toISOString(), end: t1.toISOString(), minutes: 25, completed: true, taskId: null });
  log.push({ id: id(), t: t1.toISOString(), kind: 'focus', xp: 60, gold: 5, ref: `focus:${sid}`, meta: { m: 25, full: 1 } });
  log.push({ id: id(), t: new Date(t1.getTime() + 5 * 60000).toISOString(), kind: 'task', xp: 50, gold: 10, ref: 'task:done1', label: tr ? 'Fizik notlarını gözden geçir' : 'Review physics notes', meta: { d: 'normal', p: 1, c: 'cat_study' } });
  log.push({ id: id(), t: new Date(t1.getTime() + 8 * 60000).toISOString(), kind: 'purchase', xp: 0, gold: -150, ref: 'buy:pet_cat:x', label: tr ? 'Kedi Pamuk' : 'Mochi the cat' });
  log.sort((a, b) => (a.t < b.t ? -1 : 1));

  const T = (title, extra) => ({
    id: id(),
    title,
    purpose: '',
    difficulty: 'normal',
    categoryId: null,
    date: today,
    time: null,
    repeat: 'none',
    repeatDays: [],
    done: false,
    doneAt: null,
    doneDays: [],
    remindedKey: null,
    subtasks: [],
    subtasksDay: null,
    createdAt: daysAgo(1).toISOString(),
    focusMinutes: 0,
    ...extra,
  });

  const tasks = [
    T(tr ? 'Matematik çalış' : 'Study math', { purpose: tr ? 'Sınav için' : 'For the exam', categoryId: 'cat_study', time: '14:30', difficulty: 'hard', subtasks: [
      { id: id(), title: tr ? 'Türev konusunu tekrar et' : 'Revise derivatives', done: true },
      { id: id(), title: tr ? '20 soru çöz' : 'Solve 20 problems', done: false },
      { id: id(), title: tr ? 'Hatalarımı not al' : 'Note my mistakes', done: false },
    ], focusMinutes: 50 }),
    T(tr ? 'Sabah koşusu' : 'Morning run', { categoryId: 'cat_health', repeat: 'daily', time: '07:30', difficulty: 'easy', date: dayKey(daysAgo(20)) }),
    T(tr ? 'Sunum taslağını bitir' : 'Finish the slide draft', { purpose: tr ? 'Cuma toplantısı' : 'Friday meeting', categoryId: 'cat_work', difficulty: 'epic', time: '17:00' }),
    T(tr ? 'Kitaptan 20 sayfa oku' : 'Read 20 pages', { categoryId: 'cat_personal', repeat: 'weekdays', date: dayKey(daysAgo(10)) }),
    T(tr ? 'Fizik notlarını gözden geçir' : 'Review physics notes', { categoryId: 'cat_study', done: true, doneAt: new Date(t1.getTime() + 5 * 60000).toISOString(), purpose: tr ? 'Vize haftası' : 'Midterm week' }),
    T(tr ? 'Su içmeyi unutma' : 'Remember to drink water', { categoryId: 'cat_health', difficulty: 'easy', date: null }),
    T(tr ? 'Proje raporu' : 'Project report', { categoryId: 'cat_work', date: tomorrow, time: '10:00', difficulty: 'hard' }),
    T(tr ? 'Annemi ara' : 'Call mom', { categoryId: 'cat_personal', date: tomorrow, difficulty: 'easy' }),
    T(tr ? 'İngilizce kelime çalış' : 'Practice vocabulary', { categoryId: 'cat_study', date: later }),
    T(tr ? 'Eski görev — dün kaldı' : 'Leftover from yesterday', { categoryId: 'cat_work', date: dayKey(daysAgo(1)), difficulty: 'easy' }),
  ];

  return {
    version: 1,
    createdAt: daysAgo(71).toISOString(),
    onboarded: opts.onboarded !== false,
    profile: { name: tr ? 'Anıl' : 'Anıl', look: { body: 'm', skin: 1, hair: 0, hairColor: 1, heroClass: 'wizard' } },
    settings: {
      lang,
      theme: opts.theme || 'light',
      accent: 'ember',
      motion: 'full',
      sounds: false,
      volume: 0.6,
      notifications: false,
      focusMin: 25,
      shortMin: 5,
      longMin: 15,
      longEvery: 4,
      autoBreak: true,
      autoFocus: false,
      ambient: 'rain',
      ambientVolume: 0.5,
      closeToTray: false,
      openAtLogin: false,
      pinWhileFocus: false,
    },
    tasks,
    categories: [
      { id: 'cat_study', key: 'study', name: '', color: '#2a78d6' },
      { id: 'cat_work', key: 'work', name: '', color: '#eb6834' },
      { id: 'cat_health', key: 'health', name: '', color: '#1baf7a' },
      { id: 'cat_personal', key: 'personal', name: '', color: '#e87ba4' },
    ],
    log,
    sessions,
    owned: ['pet_cat', 'hat_wizard', 'bg_night', 'hat_party', 'bg_meadow'],
    equipped: { hat: 'hat_wizard', pet: 'pet_cat', bg: 'bg_night' },
    shields: 1,
    achievements: {},
    claimed: {},
    streak: { current: 6, best: 9, lastDay: today },
    counters: { tasksCreated: 120, remindersSet: 12, purchases: 5 },
    timer: null,
  };
}

module.exports = { seed };
