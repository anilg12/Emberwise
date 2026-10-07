import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { store, createDefault, normalizeData, isScheduledOn } from '../src/lib/state.svelte';
import { dayKey, addDays } from '../src/lib/dates';
import { fx } from '../src/lib/fx.svelte';

function fresh(at = new Date(2026, 9, 3, 10, 0)) {
  vi.useFakeTimers();
  vi.setSystemTime(at);
  store.data = createDefault('tr');
  store.data.onboarded = true;
  store.today = dayKey();
  fx.celebrations = [];
  fx.toasts = [];
}

beforeEach(() => fresh());
afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('tasks & XP', () => {
  it('completing a normal task gives +50 XP (the original rule) and gold', () => {
    const t = store.createTask({ title: 'Matematik' });
    const r = store.completeTask(t.id);
    expect(r).toEqual({ xp: 50, gold: 10 });
    expect(store.totalXp).toBe(50);
    expect(store.gold).toBe(10);
    expect(store.task(t.id)?.done).toBe(true);
  });

  it('cannot farm XP by completing twice, and undo removes the reward', () => {
    const t = store.createTask({ title: 'A', difficulty: 'hard' });
    store.completeTask(t.id);
    expect(store.completeTask(t.id)).toBeNull();
    expect(store.totalXp).toBe(80);
    store.uncompleteTask(t.id);
    expect(store.totalXp).toBe(0);
    expect(store.task(t.id)?.done).toBe(false);
    store.completeTask(t.id);
    expect(store.totalXp).toBe(80);
  });

  it('levels up at 100 XP and celebrates once', () => {
    const a = store.createTask({ title: 'A' });
    const b = store.createTask({ title: 'B' });
    store.completeTask(a.id);
    expect(store.lvl.level).toBe(1);
    store.completeTask(b.id);
    expect(store.lvl.level).toBe(2);
    expect(fx.celebrations.length).toBe(1);
    expect(fx.celebrations[0].level).toBe(2);
  });

  it('repeating tasks can be completed once per day and reset the next day', () => {
    const t = store.createTask({ title: 'Koşu', repeat: 'daily' });
    expect(store.completeTask(t.id)).not.toBeNull();
    expect(store.completeTask(t.id)).toBeNull();
    expect(store.isDoneToday(store.task(t.id)!)).toBe(true);
    vi.setSystemTime(new Date(2026, 9, 4, 9, 0));
    store.tick();
    expect(store.isDoneToday(store.task(t.id)!)).toBe(false);
    expect(store.completeTask(t.id)).not.toBeNull();
    expect(store.totalXp).toBe(100);
  });

  it('weekday and custom schedules are respected', () => {
    const wk = store.createTask({ title: 'Hafta içi', repeat: 'weekdays', date: '2026-10-01' });
    expect(isScheduledOn(wk, '2026-10-03')).toBe(false); // Saturday
    expect(isScheduledOn(wk, '2026-10-05')).toBe(true); // Monday
    const cu = store.createTask({ title: 'Salı', repeat: 'custom', repeatDays: [2], date: '2026-10-01' });
    expect(isScheduledOn(cu, '2026-10-06')).toBe(true);
    expect(isScheduledOn(cu, '2026-10-07')).toBe(false);
    expect(isScheduledOn(cu, '2026-09-29')).toBe(false); // before start date
  });

  it('subtasks give +5 XP and revoke it when unchecked', () => {
    const t = store.createTask({ title: 'A', subtasks: [{ id: 's1', title: 'adım', done: false }] });
    store.toggleSubtask(t.id, 's1');
    expect(store.totalXp).toBe(5);
    store.toggleSubtask(t.id, 's1');
    expect(store.totalXp).toBe(0);
  });

  it('delete + undo restores the task in place', () => {
    const a = store.createTask({ title: 'A' });
    store.createTask({ title: 'B' });
    const removed = store.deleteTask(a.id)!;
    expect(store.data.tasks.map((t) => t.title)).toEqual(['B']);
    store.restoreTask(removed.task, removed.index);
    expect(store.data.tasks.map((t) => t.title)).toEqual(['A', 'B']);
  });

  it('today list puts overdue first, then by time', () => {
    store.createTask({ title: 'later', time: '18:00' });
    store.createTask({ title: 'overdue', date: addDays(store.today, -2) });
    store.createTask({ title: 'soon', time: '11:00' });
    store.createTask({ title: 'future', date: addDays(store.today, 3) });
    expect(store.todayTasks.open.map((t) => t.title)).toEqual(['overdue', 'soon', 'later']);
  });
});

describe('streaks', () => {
  it('counts consecutive days and resets after a gap', () => {
    const t1 = store.createTask({ title: 'd1' });
    store.completeTask(t1.id);
    expect(store.streakNow).toBe(1);
    vi.setSystemTime(new Date(2026, 9, 4, 10, 0));
    store.tick();
    const t2 = store.createTask({ title: 'd2' });
    store.completeTask(t2.id);
    expect(store.streakNow).toBe(2);
    vi.setSystemTime(new Date(2026, 9, 7, 10, 0));
    store.tick();
    expect(store.streakNow).toBe(0);
    const t3 = store.createTask({ title: 'd5' });
    store.completeTask(t3.id);
    expect(store.streakNow).toBe(1);
    expect(store.data.streak.best).toBe(2);
  });

  it('an ember shield bridges a single missed day', () => {
    const t1 = store.createTask({ title: 'd1' });
    store.completeTask(t1.id);
    store.data.shields = 1;
    vi.setSystemTime(new Date(2026, 9, 5, 10, 0)); // skipped the 4th
    store.tick();
    expect(store.data.shields).toBe(0);
    const t2 = store.createTask({ title: 'd3' });
    store.completeTask(t2.id);
    expect(store.streakNow).toBe(2);
  });
});

describe('focus, quests and shop', () => {
  it('a full 25 minute session pays 60 XP and 5 gold', () => {
    const r = store.recordFocus({ start: Date.now() - 25 * 60000, end: Date.now(), minutes: 25, completed: true, taskId: null });
    expect(r).toEqual({ xp: 60, gold: 5 });
    expect(store.todayFocusMin).toBe(25);
    expect(store.todaySessions).toBe(1);
  });

  it('daily quests can only be claimed when done, and only once', () => {
    const q = store.dailyQuests[0];
    expect(store.claimQuest(q.def.id)).toBeNull();
    // complete every quest type for today
    for (let i = 0; i < 6; i++) {
      const t = store.createTask({ title: `t${i}`, difficulty: 'epic', purpose: 'neden', repeat: i === 0 ? 'daily' : 'none', subtasks: [{ id: `s${i}`, title: 'x', done: false }] });
      store.toggleSubtask(t.id, `s${i}`);
      store.completeTask(t.id);
    }
    store.createTask({ title: 'yarın', date: addDays(store.today, 1) });
    for (let i = 0; i < 4; i++) store.recordFocus({ start: Date.now(), end: Date.now(), minutes: 25, completed: true, taskId: null });
    for (const quest of store.dailyQuests) expect(quest.done).toBe(true);
    const before = store.totalXp;
    for (const quest of store.dailyQuests) expect(store.claimQuest(quest.def.id)).not.toBeNull();
    expect(store.claimQuest(store.dailyQuests[0].def.id)).toBeNull();
    expect(store.totalXp).toBeGreaterThan(before);
    expect(store.chestState).toBe('ready');
    expect(store.openChest()).not.toBeNull();
    expect(store.chestState).toBe('opened');
    expect(store.openChest()).toBeNull();
  });

  it('the shop checks gold and level and auto-equips', () => {
    expect(store.canBuy('hat_party')).toBe('gold');
    store.data.log.push({ id: 'g', t: new Date().toISOString(), kind: 'quest', xp: 0, gold: 500, ref: 'test' });
    expect(store.canBuy('hat_crown')).toBe('level');
    expect(store.buy('hat_party')).toBe(true);
    expect(store.data.equipped.hat).toBe('hat_party');
    expect(store.gold).toBe(440);
    expect(store.canBuy('hat_party')).toBe('owned');
    store.buy('shield');
    store.buy('shield');
    store.buy('shield');
    expect(store.data.shields).toBe(3);
    expect(store.canBuy('shield')).toBe('maxed');
  });
});

describe('reminders', () => {
  it('fire once at the set time, and stay quiet when far too late', () => {
    const fired: string[] = [];
    store.onReminder = ({ task }) => fired.push(task.title);
    store.ready = true;
    store.createTask({ title: 'saat 10:30', time: '10:30' });
    store.createTask({ title: 'çok eski', time: '06:00' });
    store.checkReminders();
    expect(fired).toEqual([]); // 06:00 was 4h ago -> silent
    vi.setSystemTime(new Date(2026, 9, 3, 10, 30, 5));
    store.checkReminders();
    store.checkReminders();
    expect(fired).toEqual(['saat 10:30']);
  });

  it('repeating reminders ring again the next day', () => {
    const fired: string[] = [];
    store.onReminder = ({ task }) => fired.push(task.title);
    store.ready = true;
    store.createTask({ title: 'su iç', time: '10:05', repeat: 'daily' });
    vi.setSystemTime(new Date(2026, 9, 3, 10, 6));
    store.checkReminders();
    vi.setSystemTime(new Date(2026, 9, 4, 10, 6));
    store.tick();
    store.checkReminders();
    expect(fired).toEqual(['su iç', 'su iç']);
  });

  it('do not ring for completed tasks', () => {
    const fired: string[] = [];
    store.onReminder = ({ task }) => fired.push(task.title);
    store.ready = true;
    const t = store.createTask({ title: 'bitti', time: '10:20' });
    store.completeTask(t.id);
    vi.setSystemTime(new Date(2026, 9, 3, 10, 21));
    store.checkReminders();
    expect(fired).toEqual([]);
  });
});

describe('data safety', () => {
  it('normalizeData survives garbage', () => {
    for (const junk of [null, 42, 'x', [], { tasks: 'nope', log: [{}], settings: { focusMin: -5, theme: 'neon' } }]) {
      const d = normalizeData(junk);
      expect(d.version).toBe(1);
      expect(Array.isArray(d.tasks)).toBe(true);
      expect(d.settings.focusMin).toBeGreaterThanOrEqual(1);
      expect(['light', 'dark', 'system']).toContain(d.settings.theme);
    }
  });

  it('export → import round-trips', () => {
    const t = store.createTask({ title: 'Kalıcı', purpose: 'test' });
    store.completeTask(t.id);
    const text = store.exportText();
    store.resetAll();
    expect(store.data.tasks.length).toBe(0);
    expect(store.importText(text)).toBe(true);
    expect(store.data.tasks[0].title).toBe('Kalıcı');
    expect(store.totalXp).toBe(50);
    expect(store.importText('{"hello":1}')).toBe(false);
  });

  it('drops equipped items that are not owned', () => {
    const d = normalizeData({ version: 1, profile: {}, owned: ['hat_party'], equipped: { hat: 'hat_crown', pet: null, bg: null } });
    expect(d.equipped.hat).toBeNull();
  });
});
