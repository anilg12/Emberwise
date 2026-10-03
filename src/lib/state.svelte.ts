import type {
  AmbientMix,
  Category,
  Data,
  Difficulty,
  Equipped,
  FocusSession,
  HeroClass,
  JournalEntry,
  Lang,
  LogEntry,
  LoginState,
  Route,
  Settings,
  Task,
} from './types';
import {
  addDays,
  atTime,
  dayKey,
  dayKeyOfIso,
  diffDays,
  isValidTime,
  isoNow,
  nowMinutes,
  timeToMinutes,
  weekday,
} from './dates';
import {
  DIFFICULTIES,
  STREAK_MILESTONES,
  SUBTASK_XP,
  TASK_GOLD,
  TASK_XP,
  focusReward,
  levelInfo,
  rankFor,
  uid,
} from './game';
import {
  ACHIEVEMENTS,
  CHEST_REWARD,
  LOGIN_PATH,
  MAX_SHIELDS,
  MONTH_CHEST,
  WEEK_CHEST,
  achievementContext,
  factsForDay,
  giftForDay,
  questsForDay,
  shopItem,
  type WearSlot,
} from './catalog';
import { AMBIENT_KINDS } from './ambience';
import { CHARACTER_IDS, character } from './characters';
import { detectLang, i18n, itemName, t } from './i18n.svelte';
import { loadText, saveText, saveTextSync } from './platform';
import { fx } from './fx.svelte';
import { sfx } from './sound';
import { pickQuote } from './motivation';

/* ------------------------------------------------------------------ */
/* Defaults & normalisation                                            */
/* ------------------------------------------------------------------ */

/** Categorical identity colors, in a CVD-validated order (light steps; see DARK_STEP for dark mode). */
export const CATEGORY_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
const DARK_STEP: Record<string, string> = {
  '#2a78d6': '#3987e5',
  '#eb6834': '#d95926',
  '#1baf7a': '#199e70',
  '#eda100': '#c98500',
  '#e87ba4': '#d55181',
  '#008300': '#008300',
  '#4a3aa7': '#9085e9',
  '#e34948': '#e66767',
};

/** The same identity hue, stepped for the current surface. */
export function categoryColor(color: string, dark: boolean): string {
  return dark ? (DARK_STEP[color.toLowerCase()] ?? color) : color;
}

export function nextCategoryColor(used: string[]): string {
  const taken = new Set(used.map((c) => c.toLowerCase()));
  return CATEGORY_COLORS.find((c) => !taken.has(c)) ?? CATEGORY_COLORS[used.length % CATEGORY_COLORS.length];
}

function defaultCategories(): Category[] {
  return [
    { id: 'cat_study', key: 'study', name: '', color: '#2a78d6' },
    { id: 'cat_work', key: 'work', name: '', color: '#eb6834' },
    { id: 'cat_health', key: 'health', name: '', color: '#1baf7a' },
    { id: 'cat_personal', key: 'personal', name: '', color: '#e87ba4' },
  ];
}

export function defaultSettings(lang: Lang = detectLang()): Settings {
  return {
    lang,
    theme: 'system',
    accent: 'ember',
    motion: 'system',
    sounds: true,
    volume: 0.6,
    notifications: true,
    focusMin: 25,
    shortMin: 5,
    longMin: 15,
    longEvery: 4,
    autoBreak: true,
    autoFocus: false,
    ambient: { rain: 0.7 },
    ambientVolume: 0.55,
    motivation: true,
    dailyGoal: 60,
    // Reminders only ring while Emberwise runs, so closing keeps it in the tray by default.
    closeToTray: true,
    openAtLogin: false,
    pinWhileFocus: false,
  };
}

export function createDefault(lang?: Lang): Data {
  return {
    version: 1,
    createdAt: isoNow(),
    onboarded: false,
    profile: {
      name: '',
      look: { body: 'f', skin: 1, hair: 1, hairColor: 1, heroClass: 'wizard', tone: 0 },
    },
    settings: defaultSettings(lang),
    tasks: [],
    categories: defaultCategories(),
    log: [],
    sessions: [],
    owned: [],
    equipped: { hat: null, pet: null, bg: null, acc: null },
    shields: 0,
    achievements: {},
    claimed: {},
    streak: { current: 0, best: 0, lastDay: null },
    counters: { tasksCreated: 0, remindersSet: 0, purchases: 0, breaths: 0 },
    login: { total: 0, streak: 0, best: 0, lastDay: null, days: [], claimed: [] },
    journal: {},
    favorites: [],
    timer: null,
  };
}

/** Old builds stored a single ambience name; newer ones a whole mix. */
function normalizeMix(v: unknown, fallback: AmbientMix): AmbientMix {
  if (typeof v === 'string') return v === 'off' ? {} : AMBIENT_KINDS.includes(v as never) ? { [v]: 0.7 } : fallback;
  if (!isObj(v)) return fallback;
  const out: AmbientMix = {};
  for (const k of AMBIENT_KINDS) {
    const n = v[k];
    if (typeof n === 'number' && Number.isFinite(n) && n > 0) out[k] = Math.min(1, Math.round(n * 100) / 100);
  }
  return out;
}

function normalizeLogin(v: unknown): LoginState {
  const l = isObj(v) ? v : {};
  const days = Array.isArray(l.days) ? [...new Set((l.days as unknown[]).filter(isDay))].sort().slice(-400) : [];
  return {
    total: Math.round(num(l.total, days.length, 0)),
    streak: Math.round(num(l.streak, 0, 0)),
    best: Math.round(num(l.best, 0, 0)),
    lastDay: isDay(l.lastDay) ? l.lastDay : (days.at(-1) ?? null),
    days,
    claimed: Array.isArray(l.claimed) ? [...new Set((l.claimed as unknown[]).filter((x): x is string => typeof x === 'string'))] : [],
  };
}

function normalizeJournal(v: unknown): Record<string, JournalEntry> {
  const out: Record<string, JournalEntry> = {};
  if (!isObj(v)) return out;
  for (const [k, e] of Object.entries(v)) {
    if (!isDay(k) || !isObj(e)) continue;
    out[k] = { mood: Math.round(num(e.mood, 3, 1, 5)), note: str(e.note).slice(0, 280) };
  }
  return out;
}

/** Monday of the week a day belongs to. */
export function weekStart(day: string): string {
  return addDays(day, -((weekday(day) + 6) % 7));
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const num = (v: unknown, fallback: number, min = -Infinity, max = Infinity) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

function normalizeTask(raw: unknown): Task | null {
  if (!isObj(raw)) return null;
  const title = str(raw.title).trim();
  if (!title) return null;
  const repeat = ['none', 'daily', 'weekdays', 'custom'].includes(raw.repeat as string) ? (raw.repeat as Task['repeat']) : 'none';
  return {
    id: str(raw.id) || uid(),
    title: title.slice(0, 200),
    purpose: str(raw.purpose).slice(0, 300),
    difficulty: DIFFICULTIES.includes(raw.difficulty as Difficulty) ? (raw.difficulty as Difficulty) : 'normal',
    categoryId: typeof raw.categoryId === 'string' ? raw.categoryId : null,
    date: isDay(raw.date) ? raw.date : null,
    time: isValidTime(raw.time as string) ? (raw.time as string) : null,
    repeat,
    repeatDays: Array.isArray(raw.repeatDays)
      ? [...new Set((raw.repeatDays as unknown[]).filter((d): d is number => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6))]
      : [],
    done: !!raw.done,
    doneAt: typeof raw.doneAt === 'string' ? raw.doneAt : null,
    doneDays: Array.isArray(raw.doneDays) ? (raw.doneDays as unknown[]).filter(isDay).slice(-400) : [],
    remindedKey: typeof raw.remindedKey === 'string' ? raw.remindedKey : null,
    subtasks: Array.isArray(raw.subtasks)
      ? (raw.subtasks as unknown[])
          .filter(isObj)
          .map((s) => ({ id: str(s.id) || uid(), title: str(s.title).slice(0, 200), done: !!s.done }))
          .filter((s) => s.title.trim())
      : [],
    subtasksDay: isDay(raw.subtasksDay) ? raw.subtasksDay : null,
    createdAt: str(raw.createdAt) || isoNow(),
    focusMinutes: num(raw.focusMinutes, 0, 0),
  };
}

export function normalizeData(raw: unknown): Data {
  const base = createDefault();
  if (!isObj(raw)) return base;
  const s = isObj(raw.settings) ? raw.settings : {};
  const ds = base.settings;
  const settings: Settings = {
    lang: s.lang === 'tr' || s.lang === 'en' ? s.lang : ds.lang,
    theme: ['light', 'dark', 'system'].includes(s.theme as string) ? (s.theme as Settings['theme']) : ds.theme,
    accent: ['ember', 'rose', 'ocean', 'forest', 'plum', 'honey'].includes(s.accent as string)
      ? (s.accent as Settings['accent'])
      : ds.accent,
    motion: ['system', 'full', 'reduced'].includes(s.motion as string) ? (s.motion as Settings['motion']) : ds.motion,
    sounds: typeof s.sounds === 'boolean' ? s.sounds : ds.sounds,
    volume: num(s.volume, ds.volume, 0, 1),
    notifications: typeof s.notifications === 'boolean' ? s.notifications : ds.notifications,
    focusMin: Math.round(num(s.focusMin, ds.focusMin, 1, 180)),
    shortMin: Math.round(num(s.shortMin, ds.shortMin, 1, 60)),
    longMin: Math.round(num(s.longMin, ds.longMin, 1, 90)),
    longEvery: Math.round(num(s.longEvery, ds.longEvery, 2, 10)),
    autoBreak: typeof s.autoBreak === 'boolean' ? s.autoBreak : ds.autoBreak,
    autoFocus: typeof s.autoFocus === 'boolean' ? s.autoFocus : ds.autoFocus,
    ambient: normalizeMix(s.ambient, ds.ambient),
    ambientVolume: num(s.ambientVolume, ds.ambientVolume, 0, 1),
    motivation: typeof s.motivation === 'boolean' ? s.motivation : ds.motivation,
    dailyGoal: Math.round(num(s.dailyGoal, ds.dailyGoal, 10, 600)),
    closeToTray: typeof s.closeToTray === 'boolean' ? s.closeToTray : ds.closeToTray,
    openAtLogin: typeof s.openAtLogin === 'boolean' ? s.openAtLogin : ds.openAtLogin,
    pinWhileFocus: typeof s.pinWhileFocus === 'boolean' ? s.pinWhileFocus : ds.pinWhileFocus,
  };

  const p = isObj(raw.profile) ? raw.profile : {};
  const look = isObj(p.look) ? p.look : {};
  const bl = base.profile.look;

  const categories = Array.isArray(raw.categories)
    ? (raw.categories as unknown[])
        .filter(isObj)
        .map((c) => ({
          id: str(c.id) || uid(),
          key: typeof c.key === 'string' ? c.key : undefined,
          name: str(c.name).slice(0, 40),
          color: /^#[0-9a-f]{6}$/i.test(str(c.color)) ? str(c.color) : CATEGORY_COLORS[0],
        }))
        .filter((c) => c.key || c.name.trim())
    : base.categories;

  const log: LogEntry[] = Array.isArray(raw.log)
    ? (raw.log as unknown[])
        .filter(isObj)
        .filter((e) => typeof e.t === 'string' && typeof e.kind === 'string')
        .map((e) => ({
          id: str(e.id) || uid(),
          t: str(e.t),
          kind: e.kind as LogEntry['kind'],
          xp: Math.round(num(e.xp, 0)),
          gold: Math.round(num(e.gold, 0)),
          ref: str(e.ref),
          label: typeof e.label === 'string' ? e.label : undefined,
          meta: isObj(e.meta) ? (e.meta as LogEntry['meta']) : undefined,
        }))
    : [];
  log.sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));

  const sessions: FocusSession[] = Array.isArray(raw.sessions)
    ? (raw.sessions as unknown[])
        .filter(isObj)
        .filter((x) => typeof x.start === 'string' && typeof x.end === 'string')
        .map((x) => ({
          id: str(x.id) || uid(),
          start: str(x.start),
          end: str(x.end),
          minutes: Math.round(num(x.minutes, 0, 0, 600)),
          completed: !!x.completed,
          taskId: typeof x.taskId === 'string' ? x.taskId : null,
        }))
    : [];

  const eq = isObj(raw.equipped) ? raw.equipped : {};
  const owned = Array.isArray(raw.owned) ? [...new Set((raw.owned as unknown[]).filter((x): x is string => typeof x === 'string' && !!shopItem(x)))] : [];
  const equipped: Equipped = {
    hat: typeof eq.hat === 'string' && owned.includes(eq.hat) ? eq.hat : null,
    pet: typeof eq.pet === 'string' && owned.includes(eq.pet) ? eq.pet : null,
    bg: typeof eq.bg === 'string' && owned.includes(eq.bg) ? eq.bg : null,
    acc: typeof eq.acc === 'string' && owned.includes(eq.acc) ? eq.acc : null,
  };
  const cls = CHARACTER_IDS.includes(look.heroClass as HeroClass) ? (look.heroClass as HeroClass) : bl.heroClass;
  const clsOk = character(cls).tier === 'free' || owned.includes(`char_${cls}`);

  const st = isObj(raw.streak) ? raw.streak : {};
  const ct = isObj(raw.counters) ? raw.counters : {};
  const claimed: Record<string, string[]> = {};
  if (isObj(raw.claimed)) {
    for (const [k, v] of Object.entries(raw.claimed)) {
      if (isDay(k) && Array.isArray(v)) claimed[k] = v.filter((x): x is string => typeof x === 'string');
    }
  }
  const achievements: Record<string, string> = {};
  if (isObj(raw.achievements)) {
    for (const [k, v] of Object.entries(raw.achievements)) if (typeof v === 'string') achievements[k] = v;
  }

  const timer = isObj(raw.timer) ? (raw.timer as unknown as Data['timer']) : null;

  return {
    version: 1,
    createdAt: str(raw.createdAt) || base.createdAt,
    onboarded: !!raw.onboarded,
    profile: {
      name: str(p.name).slice(0, 40),
      look: {
        body: look.body === 'm' ? 'm' : look.body === 'f' ? 'f' : bl.body,
        skin: Math.round(num(look.skin, bl.skin, 0, 5)),
        hair: Math.round(num(look.hair, bl.hair, 0, 5)),
        hairColor: Math.round(num(look.hairColor, bl.hairColor, 0, 7)),
        heroClass: clsOk ? cls : bl.heroClass,
        tone: clsOk ? Math.round(num(look.tone, 0, 0, 3)) : 0,
      },
    },
    settings,
    tasks: Array.isArray(raw.tasks) ? (raw.tasks as unknown[]).map(normalizeTask).filter((x): x is Task => !!x) : [],
    categories,
    log,
    sessions,
    owned,
    equipped,
    shields: Math.round(num(raw.shields, 0, 0, MAX_SHIELDS)),
    achievements,
    claimed,
    streak: {
      current: Math.round(num(st.current, 0, 0)),
      best: Math.round(num(st.best, 0, 0)),
      lastDay: isDay(st.lastDay) ? st.lastDay : null,
    },
    counters: {
      tasksCreated: Math.round(num(ct.tasksCreated, 0, 0)),
      remindersSet: Math.round(num(ct.remindersSet, 0, 0)),
      purchases: Math.round(num(ct.purchases, 0, 0)),
      breaths: Math.round(num(ct.breaths, 0, 0)),
    },
    login: normalizeLogin(raw.login),
    journal: normalizeJournal(raw.journal),
    favorites: Array.isArray(raw.favorites) ? [...new Set((raw.favorites as unknown[]).filter((x): x is string => typeof x === 'string'))].slice(0, 500) : [],
    timer,
  };
}

/* ------------------------------------------------------------------ */
/* Task scheduling helpers                                             */
/* ------------------------------------------------------------------ */

export function isScheduledOn(task: Task, day: string): boolean {
  if (task.repeat === 'none') return false;
  if (task.date && day < task.date) return false;
  const wd = weekday(day);
  if (task.repeat === 'daily') return true;
  if (task.repeat === 'weekdays') return wd >= 1 && wd <= 5;
  return task.repeatDays.includes(wd);
}

export function isDoneOn(task: Task, day: string): boolean {
  if (task.repeat === 'none') return task.done;
  return task.doneDays.includes(day);
}

/** Overdue first, then by reminder time, then oldest first. */
export function compareOpen(a: Task, b: Task, day: string): number {
  const oa = a.repeat === 'none' && a.date && a.date < day ? 0 : 1;
  const ob = b.repeat === 'none' && b.date && b.date < day ? 0 : 1;
  if (oa !== ob) return oa - ob;
  const ta = a.time ? timeToMinutes(a.time) : 9999;
  const tb = b.time ? timeToMinutes(b.time) : 9999;
  if (ta !== tb) return ta - tb;
  return a.createdAt.localeCompare(b.createdAt);
}

export function categoryName(c: Category | undefined | null): string {
  if (!c) return '';
  return c.name.trim() || (c.key ? t(`categories.${c.key}`) : '');
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export interface EditorState {
  open: boolean;
  taskId: string | null;
  preset: Partial<Task> | null;
}

export interface ReminderEvent {
  task: Task;
}

class Store {
  data = $state<Data>(createDefault());
  ready = $state(false);
  route = $state<Route>('today');
  today = $state(dayKey());
  clock = $state(Date.now());
  systemDark = $state(false);
  systemReducedMotion = $state(false);
  editor = $state<EditorState>({ open: false, taskId: null, preset: null });
  focusTaskRequest = $state<string | null>(null);
  /** Ambience playing outside a focus session ("just listen"). */
  listening = $state(false);
  aboutOpen = $state(false);
  giftOpen = $state(false);

  totalXp = $derived(this.data.log.reduce((s, e) => s + e.xp, 0));
  gold = $derived(Math.max(0, this.data.log.reduce((s, e) => s + e.gold, 0)));
  lvl = $derived(levelInfo(this.totalXp));
  rank = $derived(rankFor(this.lvl.level));
  dark = $derived(this.data.settings.theme === 'dark' || (this.data.settings.theme === 'system' && this.systemDark));
  reducedMotion = $derived(
    this.data.settings.motion === 'reduced' || (this.data.settings.motion === 'system' && this.systemReducedMotion),
  );
  streakNow = $derived.by(() => {
    const s = this.data.streak;
    if (!s.lastDay) return 0;
    const gap = diffDays(s.lastDay, this.today);
    return gap <= 1 ? s.current : 0;
  });
  todayFocusMin = $derived(
    this.data.sessions.filter((s) => dayKeyOfIso(s.end) === this.today).reduce((a, s) => a + s.minutes, 0),
  );
  todaySessions = $derived(
    this.data.sessions.filter((s) => s.completed && dayKeyOfIso(s.end) === this.today).length,
  );
  dailyQuests = $derived.by(() => {
    const day = this.today;
    const facts = factsForDay(this.data, day);
    const claimed = this.data.claimed[day] ?? [];
    return questsForDay(day).map((q) => {
      const value = Math.min(q.target, q.measure(facts));
      return { def: q, value, done: value >= q.target, claimed: claimed.includes(q.id) };
    });
  });
  /** Everything that belongs to today: open quests (overdue first, then by time) and what's already done. */
  todayTasks = $derived.by(() => {
    const day = this.today;
    const open: Task[] = [];
    const done: Task[] = [];
    for (const task of this.data.tasks) {
      if (task.repeat === 'none') {
        if (task.done) {
          if (task.doneAt && dayKeyOfIso(task.doneAt) === day) done.push(task);
        } else if (!task.date || task.date <= day) open.push(task);
      } else if (isScheduledOn(task, day)) {
        (task.doneDays.includes(day) ? done : open).push(task);
      }
    }
    open.sort((a, b) => compareOpen(a, b, day));
    done.sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? ''));
    return { open, done };
  });
  goalReached = $derived(this.todayFocusMin >= this.data.settings.dailyGoal);
  giftClaimed = $derived(this.data.login.claimed.includes(`gift:${this.today}`));
  gift = $derived(giftForDay(this.data.login.total));
  week = $derived.by(() => {
    const start = weekStart(this.today);
    const count = this.data.login.days.filter((d) => d >= start && d <= this.today).length;
    return { key: `week:${start}`, start, count, ready: count >= WEEK_CHEST.days, claimed: this.data.login.claimed.includes(`week:${start}`) };
  });
  month = $derived.by(() => {
    const key = this.today.slice(0, 7);
    const count = this.data.login.days.filter((d) => d.startsWith(key)).length;
    return { key: `month:${key}`, count, ready: count >= MONTH_CHEST.days, claimed: this.data.login.claimed.includes(`month:${key}`) };
  });
  /** Login path stops that are reached but not yet collected. */
  pathReady = $derived(LOGIN_PATH.filter((p) => p.day <= this.data.login.total && !this.data.login.claimed.includes(`path:${p.day}`)));
  rewardsWaiting = $derived(
    (this.giftClaimed || this.data.login.lastDay !== this.today ? 0 : 1) +
      this.pathReady.length +
      (this.week.ready && !this.week.claimed ? 1 : 0) +
      (this.month.ready && !this.month.claimed ? 1 : 0),
  );
  chestState = $derived.by(() => {
    const claimed = this.data.claimed[this.today] ?? [];
    if (claimed.includes('chest')) return 'opened' as const;
    return this.dailyQuests.every((q) => q.claimed) ? ('ready' as const) : ('locked' as const);
  });

  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private dirty = false;
  private achievementsTimer: ReturnType<typeof setTimeout> | null = null;
  onReminder: ((e: ReminderEvent) => void) | null = null;
  onGoal: (() => void) | null = null;

  /* ---------------- lifecycle ---------------- */

  async init() {
    let text: string | null = null;
    try {
      text = await loadText();
    } catch {
      text = null;
    }
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
    }
    this.data = parsed ? normalizeData(parsed) : createDefault();
    i18n.lang = this.data.settings.lang;
    this.today = dayKey();
    this.checkStreakDecay();
    this.pruneOld();
    this.touchLogin();
    this.ready = true;
    if (parsed) this.queueAchievementCheck(1200);
  }

  persist() {
    this.dirty = true;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveNow(), 350);
  }

  serialize(): string {
    return JSON.stringify($state.snapshot(this.data));
  }

  async saveNow() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    if (!this.dirty) return;
    this.dirty = false;
    const ok = await saveText(this.serialize());
    if (!ok) this.dirty = true;
  }

  flush() {
    if (!this.dirty && !this.saveTimer) return;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    this.dirty = false;
    saveTextSync(this.serialize());
  }

  /** Called periodically: keeps the clock fresh and handles the day changing at midnight. */
  tick() {
    this.clock = Date.now();
    const d = dayKey();
    if (d !== this.today) {
      this.today = d;
      this.checkStreakDecay();
      this.pruneOld();
      this.persist();
    }
    this.touchLogin();
  }

  /* ---------------- daily login ---------------- */

  /** Counts today as a login day — only while the window is actually in front of the user. */
  touchLogin(): boolean {
    if (!this.data.onboarded) return false;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false;
    const l = this.data.login;
    const day = this.today;
    if (l.lastDay === day) return false;
    l.streak = l.lastDay && diffDays(l.lastDay, day) === 1 ? l.streak + 1 : 1;
    l.best = Math.max(l.best, l.streak);
    l.lastDay = day;
    l.total++;
    if (!l.days.includes(day)) l.days.push(day);
    if (l.days.length > 400) l.days.splice(0, l.days.length - 400);
    this.persist();
    this.queueAchievementCheck();
    return true;
  }

  claimGift(): { gold: number; xp: number } | null {
    if (this.giftClaimed || this.data.login.lastDay !== this.today) return null;
    const g = this.gift;
    this.data.login.claimed.push(`gift:${this.today}`);
    this.trimClaims();
    this.reward({ kind: 'login', xp: g.xp, gold: g.gold, ref: `gift:${this.today}`, label: 'gift' });
    return { gold: g.gold, xp: g.xp };
  }

  claimWeek(): { gold: number; xp: number } | null {
    const w = this.week;
    if (!w.ready || w.claimed) return null;
    this.data.login.claimed.push(w.key);
    this.reward({ kind: 'login', xp: WEEK_CHEST.xp, gold: WEEK_CHEST.gold, ref: w.key, label: 'week' });
    return { gold: WEEK_CHEST.gold, xp: WEEK_CHEST.xp };
  }

  claimMonth(): { gold: number; xp: number } | null {
    const m = this.month;
    if (!m.ready || m.claimed) return null;
    this.data.login.claimed.push(m.key);
    this.reward({ kind: 'login', xp: MONTH_CHEST.xp, gold: MONTH_CHEST.gold, ref: m.key, label: 'month' });
    return { gold: MONTH_CHEST.gold, xp: MONTH_CHEST.xp };
  }

  claimPath(day: number): { gold: number; xp: number; item?: string; shields?: number } | null {
    const step = LOGIN_PATH.find((p) => p.day === day);
    const key = `path:${day}`;
    if (!step || step.day > this.data.login.total || this.data.login.claimed.includes(key)) return null;
    this.data.login.claimed.push(key);
    if (step.item && !this.data.owned.includes(step.item)) this.data.owned.push(step.item);
    if (step.shields) this.data.shields = Math.min(MAX_SHIELDS, this.data.shields + step.shields);
    const gold = step.gold ?? 0;
    const xp = step.xp ?? 0;
    if (gold || xp) this.reward({ kind: 'login', xp, gold, ref: key, label: step.item ?? 'path' });
    else this.persist();
    this.queueAchievementCheck();
    return { gold, xp, item: step.item, shields: step.shields };
  }

  /** Daily gift claims only matter for a while; path, week and month keys stay. */
  private trimClaims() {
    const cutoff = `gift:${addDays(this.today, -60)}`;
    this.data.login.claimed = this.data.login.claimed.filter((k) => !k.startsWith('gift:') || k >= cutoff);
  }

  /* ---------------- journal & small rituals ---------------- */

  setMood(mood: number): boolean {
    const day = this.today;
    const prev = this.data.journal[day];
    this.data.journal[day] = { mood: Math.max(1, Math.min(5, Math.round(mood))), note: prev?.note ?? '' };
    if (!prev) this.reward({ kind: 'journal', xp: 10, gold: 0, ref: `journal:${day}` });
    else this.persist();
    this.queueAchievementCheck();
    return !prev;
  }

  setJournalNote(note: string) {
    const e = this.data.journal[this.today];
    if (!e) return;
    e.note = note.slice(0, 280);
    this.persist();
  }

  recordBreath() {
    this.data.counters.breaths++;
    this.persist();
    this.queueAchievementCheck();
  }

  toggleFavorite(id: string): boolean {
    const i = this.data.favorites.indexOf(id);
    if (i >= 0) this.data.favorites.splice(i, 1);
    else this.data.favorites.unshift(id);
    this.persist();
    return i < 0;
  }

  setMix(mix: AmbientMix) {
    this.data.settings.ambient = mix;
    this.persist();
  }

  navigate(route: Route) {
    this.route = route;
  }

  setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    this.data.settings[key] = value;
    if (key === 'lang') i18n.lang = value as Lang;
    this.persist();
  }

  /* ---------------- rewards ---------------- */

  private reward(entry: Omit<LogEntry, 'id' | 't'> & { t?: string }) {
    const before = this.lvl.level;
    const beforeRank = this.rank.id;
    const e: LogEntry = { id: uid(), t: entry.t ?? isoNow(), ...entry };
    this.data.log.push(e);
    const after = this.lvl.level;
    if (after > before) {
      fx.celebrate({ kind: 'level', level: after, rankChanged: rankFor(after).id !== beforeRank });
      setTimeout(() => sfx.levelUp(), 120);
    }
    this.queueAchievementCheck();
    this.persist();
    return e;
  }

  private revoke(ref: string): LogEntry | null {
    const idx = this.data.log.findIndex((e) => e.ref === ref);
    if (idx === -1) return null;
    const [removed] = this.data.log.splice(idx, 1);
    this.persist();
    return removed;
  }

  private touchStreak() {
    const s = this.data.streak;
    const day = this.today;
    if (s.lastDay === day) return;
    s.current = s.lastDay && diffDays(s.lastDay, day) === 1 ? s.current + 1 : 1;
    s.lastDay = day;
    s.best = Math.max(s.best, s.current);
    const bonus = STREAK_MILESTONES[s.current];
    if (bonus) {
      this.reward({ kind: 'streak', xp: bonus, gold: Math.round(bonus / 4), ref: `streak:${s.current}:${day}` });
      fx.toast({ kind: 'success', icon: 'flame', title: t('streak.milestone', { n: s.current, xp: bonus }) });
      if (this.data.settings.motivation) {
        const q = pickQuote('streak', this.data.profile.name);
        setTimeout(() => fx.say(q.text, q.id, 'wow'), 1400);
      }
    }
  }

  checkStreakDecay() {
    const s = this.data.streak;
    if (!s.lastDay || s.current === 0) return;
    const gap = diffDays(s.lastDay, this.today);
    if (gap < 2) return;
    const missed = gap - 1;
    if (this.data.shields >= missed && missed <= MAX_SHIELDS) {
      this.data.shields -= missed;
      s.lastDay = addDays(this.today, -1);
      fx.toast({ kind: 'info', icon: 'shield', title: t('streak.shieldUsed'), duration: 6000 });
    } else {
      s.current = 0;
    }
    this.persist();
  }

  private pruneOld() {
    const cutoff = addDays(this.today, -45);
    for (const k of Object.keys(this.data.claimed)) if (k < cutoff) delete this.data.claimed[k];
  }

  /* ---------------- tasks ---------------- */

  task(id: string | null | undefined): Task | undefined {
    return id ? this.data.tasks.find((x) => x.id === id) : undefined;
  }

  openEditor(taskId: string | null = null, preset: Partial<Task> | null = null) {
    this.editor = { open: true, taskId, preset };
  }

  closeEditor() {
    this.editor = { open: false, taskId: null, preset: null };
  }

  createTask(input: Partial<Task> & { title: string }): Task {
    const task = normalizeTask({
      id: uid(),
      createdAt: isoNow(),
      purpose: '',
      difficulty: 'normal',
      categoryId: null,
      date: null,
      time: null,
      repeat: 'none',
      repeatDays: [],
      done: false,
      doneAt: null,
      doneDays: [],
      remindedKey: null,
      subtasks: [],
      subtasksDay: null,
      focusMinutes: 0,
      ...input,
    })!;
    if (task.repeat !== 'none' && !task.date) task.date = this.today;
    if (task.repeat === 'custom' && task.repeatDays.length === 0) task.repeatDays = [weekday(this.today)];
    this.data.tasks.push(task);
    this.data.counters.tasksCreated++;
    if (task.time) this.data.counters.remindersSet++;
    this.persist();
    this.queueAchievementCheck();
    return task;
  }

  updateTask(id: string, patch: Partial<Task>) {
    const task = this.task(id);
    if (!task) return;
    const hadTime = !!task.time;
    const scheduleChanged =
      ('time' in patch && patch.time !== task.time) ||
      ('date' in patch && patch.date !== task.date) ||
      ('repeat' in patch && patch.repeat !== task.repeat);
    Object.assign(task, patch);
    if (task.repeat !== 'none' && !task.date) task.date = this.today;
    if (task.repeat === 'custom' && task.repeatDays.length === 0) task.repeatDays = [weekday(this.today)];
    if (scheduleChanged) task.remindedKey = null;
    if (!hadTime && task.time) this.data.counters.remindersSet++;
    this.persist();
    this.queueAchievementCheck();
  }

  deleteTask(id: string): { task: Task; index: number } | null {
    const index = this.data.tasks.findIndex((x) => x.id === id);
    if (index === -1) return null;
    const task = $state.snapshot(this.data.tasks[index]) as Task;
    this.data.tasks.splice(index, 1);
    this.persist();
    return { task, index };
  }

  restoreTask(task: Task, index: number) {
    if (this.task(task.id)) return;
    this.data.tasks.splice(Math.min(index, this.data.tasks.length), 0, task);
    this.persist();
  }

  clearCompleted(): number {
    const before = this.data.tasks.length;
    this.data.tasks = this.data.tasks.filter((x) => !(x.repeat === 'none' && x.done));
    this.persist();
    return before - this.data.tasks.length;
  }

  isDoneToday(task: Task) {
    return isDoneOn(task, this.today);
  }

  completeTask(id: string): { xp: number; gold: number } | null {
    const task = this.task(id);
    if (!task) return null;
    const day = this.today;
    let ref: string;
    if (task.repeat === 'none') {
      if (task.done) return null;
      task.done = true;
      task.doneAt = isoNow();
      ref = `task:${task.id}`;
    } else {
      if (task.doneDays.includes(day)) return null;
      task.doneDays.push(day);
      if (task.doneDays.length > 400) task.doneDays.splice(0, task.doneDays.length - 400);
      ref = `task:${task.id}:${day}`;
    }
    const xp = TASK_XP[task.difficulty];
    const gold = TASK_GOLD[task.difficulty];
    this.touchStreak();
    this.reward({
      kind: 'task',
      xp,
      gold,
      ref,
      label: task.title,
      meta: {
        d: task.difficulty,
        p: task.purpose.trim() ? 1 : undefined,
        r: task.repeat !== 'none' ? 1 : undefined,
        c: task.categoryId,
      },
    });
    return { xp, gold };
  }

  uncompleteTask(id: string) {
    const task = this.task(id);
    if (!task) return;
    if (task.repeat === 'none') {
      if (!task.done) return;
      task.done = false;
      task.doneAt = null;
      this.revoke(`task:${task.id}`);
    } else {
      const i = task.doneDays.indexOf(this.today);
      if (i === -1) return;
      task.doneDays.splice(i, 1);
      this.revoke(`task:${task.id}:${this.today}`);
    }
    this.persist();
  }

  /** Repeating tasks start each day with fresh steps. */
  ensureSubtaskDay(task: Task) {
    if (task.repeat === 'none') return;
    if (task.subtasksDay !== this.today) {
      for (const s of task.subtasks) s.done = false;
      task.subtasksDay = this.today;
    }
  }

  toggleSubtask(taskId: string, subId: string): boolean | null {
    const task = this.task(taskId);
    if (!task) return null;
    this.ensureSubtaskDay(task);
    const sub = task.subtasks.find((s) => s.id === subId);
    if (!sub) return null;
    sub.done = !sub.done;
    const ref = `sub:${task.id}:${sub.id}:${task.repeat === 'none' ? 'once' : this.today}`;
    if (sub.done) this.reward({ kind: 'subtask', xp: SUBTASK_XP, gold: 0, ref, label: sub.title });
    else this.revoke(ref);
    this.persist();
    return sub.done;
  }

  /* ---------------- focus ---------------- */

  recordFocus(input: { start: number; end: number; minutes: number; completed: boolean; taskId: string | null }) {
    const minutes = Math.max(0, Math.round(input.minutes));
    if (minutes < 1) return { xp: 0, gold: 0 };
    const session: FocusSession = {
      id: uid(),
      start: new Date(input.start).toISOString(),
      end: new Date(input.end).toISOString(),
      minutes,
      completed: input.completed,
      taskId: input.taskId,
    };
    this.data.sessions.push(session);
    const task = this.task(input.taskId);
    if (task) task.focusMinutes += minutes;
    const { xp, gold } = focusReward(minutes, input.completed);
    const goalBefore = this.goalReached;
    if (input.completed || minutes >= 5) this.touchStreak();
    if (xp > 0 || gold > 0) {
      this.reward({
        kind: 'focus',
        xp,
        gold,
        ref: `focus:${session.id}`,
        label: task?.title,
        meta: { m: minutes, full: input.completed ? 1 : undefined },
      });
    } else {
      this.persist();
    }
    if (!goalBefore && this.goalReached && !(this.data.claimed[this.today] ?? []).includes('goal')) {
      (this.data.claimed[this.today] ??= []).push('goal');
      this.reward({ kind: 'quest', xp: 25, gold: 10, ref: `goal:${this.today}`, label: 'goal' });
      this.onGoal?.();
    }
    return { xp, gold };
  }

  /* ---------------- daily quests ---------------- */

  claimQuest(id: string): { xp: number; gold: number } | null {
    const q = this.dailyQuests.find((x) => x.def.id === id);
    if (!q || !q.done || q.claimed) return null;
    const day = this.today;
    (this.data.claimed[day] ??= []).push(id);
    this.reward({ kind: 'quest', xp: q.def.xp, gold: q.def.gold, ref: `quest:${day}:${id}`, label: id });
    return { xp: q.def.xp, gold: q.def.gold };
  }

  openChest(): { xp: number; gold: number } | null {
    if (this.chestState !== 'ready') return null;
    const day = this.today;
    (this.data.claimed[day] ??= []).push('chest');
    this.reward({ kind: 'chest', xp: CHEST_REWARD.xp, gold: CHEST_REWARD.gold, ref: `chest:${day}` });
    return { ...CHEST_REWARD };
  }

  /* ---------------- shop ---------------- */

  owns(id: string | null | undefined): boolean {
    return !!id && this.data.owned.includes(id);
  }

  hasCharacter(id: HeroClass): boolean {
    return character(id).tier === 'free' || this.data.owned.includes(`char_${id}`);
  }

  setCharacter(id: HeroClass, tone = 0) {
    if (!this.hasCharacter(id)) return;
    this.data.profile.look.heroClass = id;
    this.data.profile.look.tone = Math.max(0, Math.min(3, tone));
    this.persist();
  }

  canBuy(id: string): 'ok' | 'owned' | 'level' | 'gold' | 'maxed' | 'exclusive' {
    const item = shopItem(id);
    if (!item) return 'owned';
    if (item.login) return this.data.owned.includes(id) ? 'owned' : 'exclusive';
    if (item.slot === 'consumable') {
      if (this.data.shields >= MAX_SHIELDS) return 'maxed';
    } else if (this.data.owned.includes(id)) return 'owned';
    if (item.minLevel && this.lvl.level < item.minLevel) return 'level';
    if (this.gold < item.price) return 'gold';
    return 'ok';
  }

  buy(id: string): boolean {
    const item = shopItem(id);
    if (!item || this.canBuy(id) !== 'ok') return false;
    if (item.slot === 'consumable') this.data.shields = Math.min(MAX_SHIELDS, this.data.shields + 1);
    else {
      this.data.owned.push(id);
      if (item.slot === 'char') this.setCharacter(id.slice(5) as HeroClass, 0);
      else this.data.equipped[item.slot] = id;
    }
    this.data.counters.purchases++;
    this.reward({ kind: 'purchase', xp: 0, gold: -item.price, ref: `buy:${id}:${uid()}`, label: itemName(id) });
    return true;
  }

  equip(slot: WearSlot, id: string | null) {
    if (id && !this.data.owned.includes(id)) return;
    this.data.equipped[slot] = id;
    this.persist();
  }

  /* ---------------- achievements ---------------- */

  queueAchievementCheck(delay = 450) {
    if (this.achievementsTimer) clearTimeout(this.achievementsTimer);
    this.achievementsTimer = setTimeout(() => this.checkAchievements(), delay);
  }

  checkAchievements() {
    this.achievementsTimer = null;
    if (!this.data.onboarded) return;
    let changed = true;
    let rounds = 0;
    let delay = 0;
    while (changed && rounds++ < 4) {
      changed = false;
      const ctx = achievementContext(this.data, this.lvl.level);
      for (const a of ACHIEVEMENTS) {
        if (this.data.achievements[a.id]) continue;
        const [cur, target] = a.progress(ctx);
        if (cur < target) continue;
        this.data.achievements[a.id] = isoNow();
        changed = true;
        if (a.xp || a.gold) this.reward({ kind: 'achievement', xp: a.xp, gold: a.gold, ref: `ach:${a.id}`, label: a.id });
        const d = delay;
        delay += 900;
        setTimeout(() => {
          sfx.achievement();
          fx.toast({
            kind: 'achievement',
            icon: a.icon,
            title: t('awards.unlocked'),
            body: `${t(`awards.items.${a.id}.0`)} · +${a.xp} XP${a.gold ? ` · +${a.gold} ${t('common.gold')}` : ''}`,
            duration: 5200,
          });
        }, d);
      }
    }
    if (rounds > 1) this.persist();
  }

  /* ---------------- reminders ---------------- */

  checkReminders() {
    if (!this.ready) return;
    const now = new Date();
    const today = dayKey(now);
    const mins = nowMinutes(now);
    const GRACE = 180; // minutes: older reminders are marked silently instead of ringing late
    let changed = false;
    for (const task of this.data.tasks) {
      if (!task.time) continue;
      if (task.repeat === 'none') {
        if (task.done) continue;
        const date = task.date ?? today;
        if (task.remindedKey === date) continue;
        const due = atTime(date, task.time);
        if (now.getTime() < due.getTime()) continue;
        task.remindedKey = date;
        changed = true;
        if ((now.getTime() - due.getTime()) / 60000 <= GRACE) this.onReminder?.({ task });
      } else {
        if (!isScheduledOn(task, today) || task.doneDays.includes(today) || task.remindedKey === today) continue;
        const tm = timeToMinutes(task.time);
        if (mins < tm) continue;
        task.remindedKey = today;
        changed = true;
        if (mins - tm <= GRACE) this.onReminder?.({ task });
      }
    }
    if (changed) this.persist();
  }

  /* ---------------- data management ---------------- */

  exportText(): string {
    return JSON.stringify({ app: 'emberwise', exportedAt: isoNow(), data: $state.snapshot(this.data) }, null, 2);
  }

  importText(text: string): boolean {
    try {
      const parsed = JSON.parse(text);
      const raw = isObj(parsed) && parsed.app === 'emberwise' ? parsed.data : parsed;
      if (!isObj(raw) || raw.version !== 1 || !isObj(raw.profile)) return false;
      this.data = normalizeData(raw);
      this.data.onboarded = true;
      i18n.lang = this.data.settings.lang;
      this.persist();
      return true;
    } catch {
      return false;
    }
  }

  resetAll() {
    const lang = this.data.settings.lang;
    this.data = createDefault(lang);
    this.route = 'today';
    this.persist();
  }
}

export const store = new Store();
