import type { Data, LogEntry } from './types';
import { addDays, dayKeyOfIso } from './dates';
import { seeded } from './game';

/* ------------------------------------------------------------------ */
/* Shop                                                                */
/* ------------------------------------------------------------------ */

export type Slot = 'char' | 'hat' | 'acc' | 'pet' | 'bg' | 'consumable';
export type WearSlot = 'hat' | 'acc' | 'pet' | 'bg';

export interface ShopItem {
  id: string;
  slot: Slot;
  price: number;
  minLevel?: number;
  /** Exclusive: never sold, earned on the login path after this many days. */
  login?: number;
}

export const SHOP: ShopItem[] = [
  { id: 'char_explorer', slot: 'char', price: 260 },
  { id: 'char_coder', slot: 'char', price: 260 },
  { id: 'char_pirate', slot: 'char', price: 320, minLevel: 3 },
  { id: 'char_detective', slot: 'char', price: 340, minLevel: 3 },
  { id: 'char_ninja', slot: 'char', price: 380, minLevel: 4 },
  { id: 'char_astronaut', slot: 'char', price: 450, minLevel: 6 },

  { id: 'hat_party', slot: 'hat', price: 60 },
  { id: 'hat_headband', slot: 'hat', price: 70 },
  { id: 'hat_cap', slot: 'hat', price: 80 },
  { id: 'hat_beret', slot: 'hat', price: 90 },
  { id: 'hat_chef', slot: 'hat', price: 100 },
  { id: 'hat_straw', slot: 'hat', price: 110 },
  { id: 'hat_safari', slot: 'hat', price: 150 },
  { id: 'hat_fedora', slot: 'hat', price: 180, minLevel: 3 },
  { id: 'hat_tricorn', slot: 'hat', price: 220, minLevel: 4 },
  { id: 'hat_beanie', slot: 'hat', price: 80 },
  { id: 'hat_flowers', slot: 'hat', price: 110 },
  { id: 'hat_wizard', slot: 'hat', price: 160 },
  { id: 'hat_viking', slot: 'hat', price: 220, minLevel: 4 },
  { id: 'hat_crown', slot: 'hat', price: 450, minLevel: 10 },

  { id: 'acc_flower', slot: 'acc', price: 60 },
  { id: 'acc_bowtie', slot: 'acc', price: 70 },
  { id: 'acc_glasses', slot: 'acc', price: 90 },
  { id: 'acc_earrings', slot: 'acc', price: 100 },
  { id: 'acc_sunglasses', slot: 'acc', price: 120 },
  { id: 'acc_backpack', slot: 'acc', price: 150 },
  { id: 'acc_headphones', slot: 'acc', price: 160, minLevel: 2 },
  { id: 'acc_monocle', slot: 'acc', price: 180, minLevel: 4 },

  { id: 'pet_frog', slot: 'pet', price: 120 },
  { id: 'pet_bunny', slot: 'pet', price: 140 },
  { id: 'pet_cat', slot: 'pet', price: 150 },
  { id: 'pet_turtle', slot: 'pet', price: 170 },
  { id: 'pet_owl', slot: 'pet', price: 220 },
  { id: 'pet_penguin', slot: 'pet', price: 240, minLevel: 3 },
  { id: 'pet_fox', slot: 'pet', price: 280, minLevel: 4 },
  { id: 'pet_ember', slot: 'pet', price: 350, minLevel: 6 },
  { id: 'pet_dragon', slot: 'pet', price: 600, minLevel: 15 },

  { id: 'bg_meadow', slot: 'bg', price: 100 },
  { id: 'bg_night', slot: 'bg', price: 140 },
  { id: 'bg_rain', slot: 'bg', price: 160 },
  { id: 'bg_library', slot: 'bg', price: 180 },
  { id: 'bg_beach', slot: 'bg', price: 190 },
  { id: 'bg_cafe', slot: 'bg', price: 210, minLevel: 2 },
  { id: 'bg_campfire', slot: 'bg', price: 220, minLevel: 3 },
  { id: 'bg_sakura', slot: 'bg', price: 260, minLevel: 5 },
  { id: 'bg_space', slot: 'bg', price: 380, minLevel: 7 },
  { id: 'bg_aurora', slot: 'bg', price: 400, minLevel: 10 },

  { id: 'shield', slot: 'consumable', price: 80 },

  // Login path exclusives: they can only be earned by coming back, day after day.
  { id: 'acc_ember_pin', slot: 'acc', price: 0, login: 2 },
  { id: 'hat_sprout', slot: 'hat', price: 0, login: 5 },
  { id: 'char_guardian', slot: 'char', price: 0, login: 7 },
  { id: 'pet_moonbunny', slot: 'pet', price: 0, login: 14 },
  { id: 'bg_moonlake', slot: 'bg', price: 0, login: 21 },
  { id: 'char_oracle', slot: 'char', price: 0, login: 30 },
  { id: 'acc_star_glasses', slot: 'acc', price: 0, login: 45 },
  { id: 'pet_starwhale', slot: 'pet', price: 0, login: 60 },
  { id: 'char_frost', slot: 'char', price: 0, login: 90 },
  { id: 'bg_crystal', slot: 'bg', price: 0, login: 120 },
  { id: 'hat_laurel', slot: 'hat', price: 0, login: 150 },
  { id: 'char_timekeeper', slot: 'char', price: 0, login: 180 },
  { id: 'pet_phoenix', slot: 'pet', price: 0, login: 240 },
  { id: 'bg_celestial', slot: 'bg', price: 0, login: 300 },
  { id: 'char_sovereign', slot: 'char', price: 0, login: 365 },
];

/** Items you can buy (exclusives are earned, not sold). */
export const FOR_SALE = SHOP.filter((i) => !i.login);

export const MAX_SHIELDS = 3;

export function shopItem(id: string | null | undefined): ShopItem | undefined {
  return id ? SHOP.find((i) => i.id === id) : undefined;
}

/* ------------------------------------------------------------------ */
/* Login rewards                                                       */
/* ------------------------------------------------------------------ */

export interface PathStep {
  day: number;
  gold?: number;
  xp?: number;
  shields?: number;
  item?: string;
}

/** The long road: one stop for the first week, then each week, month and season up to a full year. */
export const LOGIN_PATH: PathStep[] = [
  { day: 1, gold: 40 },
  { day: 2, item: 'acc_ember_pin' },
  { day: 3, gold: 60, xp: 30 },
  { day: 5, item: 'hat_sprout' },
  { day: 7, item: 'char_guardian', gold: 100 },
  { day: 10, gold: 80, shields: 1 },
  { day: 14, item: 'pet_moonbunny' },
  { day: 21, item: 'bg_moonlake' },
  { day: 30, item: 'char_oracle', gold: 200 },
  { day: 45, item: 'acc_star_glasses' },
  { day: 60, item: 'pet_starwhale' },
  { day: 75, gold: 300, xp: 150 },
  { day: 90, item: 'char_frost', gold: 300 },
  { day: 120, item: 'bg_crystal' },
  { day: 150, item: 'hat_laurel' },
  { day: 180, item: 'char_timekeeper', gold: 500 },
  { day: 240, item: 'pet_phoenix' },
  { day: 300, item: 'bg_celestial' },
  { day: 365, item: 'char_sovereign', gold: 1000 },
];

/** A seven-day cycle of small daily gifts; the seventh is a little treasure. */
export const DAILY_GIFTS: { gold: number; xp: number }[] = [
  { gold: 20, xp: 0 },
  { gold: 0, xp: 30 },
  { gold: 30, xp: 0 },
  { gold: 0, xp: 45 },
  { gold: 45, xp: 0 },
  { gold: 25, xp: 40 },
  { gold: 80, xp: 60 },
];

export const WEEK_CHEST = { days: 5, gold: 120, xp: 60 };
export const MONTH_CHEST = { days: 20, gold: 400, xp: 200 };

export function giftForDay(total: number) {
  const index = (Math.max(1, total) - 1) % DAILY_GIFTS.length;
  return { index, ...DAILY_GIFTS[index] };
}

/* ------------------------------------------------------------------ */
/* Daily quests                                                        */
/* ------------------------------------------------------------------ */

export interface DayFacts {
  tasks: number;
  hard: number;
  early: number;
  purpose: number;
  habit: number;
  subtasks: number;
  focusMin: number;
  sessions: number;
  plannedTomorrow: number;
}

export interface QuestDef {
  id: string;
  target: number;
  xp: number;
  gold: number;
  measure: (f: DayFacts) => number;
}

export const QUEST_POOL: QuestDef[] = [
  { id: 'tasks3', target: 3, xp: 40, gold: 12, measure: (f) => f.tasks },
  { id: 'tasks5', target: 5, xp: 60, gold: 18, measure: (f) => f.tasks },
  { id: 'focus25', target: 25, xp: 35, gold: 10, measure: (f) => f.focusMin },
  { id: 'focus50', target: 50, xp: 55, gold: 16, measure: (f) => f.focusMin },
  { id: 'focus90', target: 90, xp: 80, gold: 24, measure: (f) => f.focusMin },
  { id: 'sessions2', target: 2, xp: 45, gold: 14, measure: (f) => f.sessions },
  { id: 'hard', target: 1, xp: 45, gold: 14, measure: (f) => f.hard },
  { id: 'early', target: 1, xp: 35, gold: 10, measure: (f) => f.early },
  { id: 'purpose', target: 1, xp: 30, gold: 10, measure: (f) => f.purpose },
  { id: 'subtasks3', target: 3, xp: 30, gold: 10, measure: (f) => f.subtasks },
  { id: 'plan', target: 1, xp: 25, gold: 8, measure: (f) => f.plannedTomorrow },
  { id: 'habit', target: 1, xp: 35, gold: 10, measure: (f) => f.habit },
];

export const CHEST_REWARD = { xp: 60, gold: 30 };

/** Three quests per day, deterministic per date, always one task, one focus and one "flavour" quest. */
export function questsForDay(day: string): QuestDef[] {
  const rnd = seeded(`ember-${day}`);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  const byId = (id: string) => QUEST_POOL.find((q) => q.id === id)!;
  const taskQ = byId(pick(['tasks3', 'tasks3', 'tasks5']));
  const focusQ = byId(pick(['focus25', 'focus50', 'focus50', 'focus90', 'sessions2']));
  const flavour = byId(pick(['hard', 'early', 'purpose', 'subtasks3', 'plan', 'habit']));
  return [taskQ, focusQ, flavour];
}

export function factsForDay(data: Data, day: string): DayFacts {
  const f: DayFacts = {
    tasks: 0,
    hard: 0,
    early: 0,
    purpose: 0,
    habit: 0,
    subtasks: 0,
    focusMin: 0,
    sessions: 0,
    plannedTomorrow: 0,
  };
  const stopBefore = addDays(day, -1);
  for (let i = data.log.length - 1; i >= 0; i--) {
    const e = data.log[i];
    const k = dayKeyOfIso(e.t);
    if (k !== day) {
      // The log is chronological; once we are two days back we can stop.
      if (k < stopBefore) break;
      continue;
    }
    if (e.kind === 'task') {
      f.tasks++;
      if (e.meta?.d === 'hard' || e.meta?.d === 'epic') f.hard++;
      if (e.meta?.p) f.purpose++;
      if (e.meta?.r) f.habit++;
      if (new Date(e.t).getHours() < 12) f.early++;
    } else if (e.kind === 'subtask') {
      f.subtasks++;
    } else if (e.kind === 'focus') {
      f.focusMin += e.meta?.m ?? 0;
      if (e.meta?.full) f.sessions++;
    }
  }
  const tomorrow = addDays(day, 1);
  for (const t of data.tasks) {
    if (t.repeat === 'none' && t.date === tomorrow && dayKeyOfIso(t.createdAt) === day) f.plannedTomorrow++;
  }
  return f;
}

/* ------------------------------------------------------------------ */
/* Achievements                                                        */
/* ------------------------------------------------------------------ */

export interface AchievementCtx {
  tasksDone: number;
  purposeDone: number;
  epicDone: number;
  habitDone: number;
  earlyBird: boolean;
  nightOwl: boolean;
  focusMin: number;
  sessions: number;
  longest: number;
  bestStreak: number;
  level: number;
  purchases: number;
  owned: number;
  questDays: number;
  reminders: number;
  logins: number;
  journalDays: number;
  breaths: number;
}

export interface AchievementDef {
  id: string;
  icon: string;
  xp: number;
  gold: number;
  /** Returns [current, target] so locked badges can show progress. */
  progress: (c: AchievementCtx) => [number, number];
}

const count = (n: number, target: number): [number, number] => [Math.min(n, target), target];
const flag = (b: boolean): [number, number] => [b ? 1 : 0, 1];

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_task', icon: 'check', xp: 25, gold: 10, progress: (c) => count(c.tasksDone, 1) },
  { id: 'tasks_10', icon: 'scroll', xp: 50, gold: 20, progress: (c) => count(c.tasksDone, 10) },
  { id: 'tasks_50', icon: 'shield', xp: 120, gold: 50, progress: (c) => count(c.tasksDone, 50) },
  { id: 'tasks_100', icon: 'crown', xp: 250, gold: 100, progress: (c) => count(c.tasksDone, 100) },
  { id: 'first_focus', icon: 'flame', xp: 25, gold: 10, progress: (c) => count(c.sessions, 1) },
  { id: 'deep_dive', icon: 'wave', xp: 60, gold: 25, progress: (c) => count(c.longest, 50) },
  { id: 'focus_5h', icon: 'hourglass', xp: 100, gold: 40, progress: (c) => count(c.focusMin, 300) },
  { id: 'focus_25h', icon: 'sun', xp: 250, gold: 100, progress: (c) => count(c.focusMin, 1500) },
  { id: 'streak_3', icon: 'spark', xp: 30, gold: 10, progress: (c) => count(c.bestStreak, 3) },
  { id: 'streak_7', icon: 'flame', xp: 80, gold: 30, progress: (c) => count(c.bestStreak, 7) },
  { id: 'streak_30', icon: 'gem', xp: 300, gold: 120, progress: (c) => count(c.bestStreak, 30) },
  { id: 'early_bird', icon: 'sunrise', xp: 40, gold: 15, progress: (c) => flag(c.earlyBird) },
  { id: 'night_owl', icon: 'moon', xp: 40, gold: 15, progress: (c) => flag(c.nightOwl) },
  { id: 'epic', icon: 'sword', xp: 60, gold: 25, progress: (c) => count(c.epicDone, 1) },
  { id: 'purposeful', icon: 'compass', xp: 70, gold: 25, progress: (c) => count(c.purposeDone, 10) },
  { id: 'habit_7', icon: 'repeat', xp: 70, gold: 25, progress: (c) => count(c.habitDone, 7) },
  { id: 'planner', icon: 'bell', xp: 50, gold: 20, progress: (c) => count(c.reminders, 10) },
  { id: 'quest_day', icon: 'chest', xp: 50, gold: 20, progress: (c) => count(c.questDays, 1) },
  { id: 'quest_week', icon: 'map', xp: 150, gold: 60, progress: (c) => count(c.questDays, 7) },
  { id: 'rank_diligent', icon: 'medal', xp: 0, gold: 25, progress: (c) => count(c.level, 3) },
  { id: 'rank_master', icon: 'medal', xp: 0, gold: 50, progress: (c) => count(c.level, 6) },
  { id: 'rank_legend', icon: 'crown', xp: 0, gold: 100, progress: (c) => count(c.level, 10) },
  { id: 'shopper', icon: 'bag', xp: 20, gold: 0, progress: (c) => count(c.purchases, 1) },
  { id: 'collector', icon: 'gem', xp: 120, gold: 0, progress: (c) => count(c.owned, 8) },
  { id: 'login_7', icon: 'gift', xp: 50, gold: 20, progress: (c) => count(c.logins, 7) },
  { id: 'login_30', icon: 'calendar', xp: 150, gold: 60, progress: (c) => count(c.logins, 30) },
  { id: 'login_100', icon: 'crown', xp: 400, gold: 150, progress: (c) => count(c.logins, 100) },
  { id: 'journal_7', icon: 'heart', xp: 60, gold: 20, progress: (c) => count(c.journalDays, 7) },
  { id: 'breathe_5', icon: 'leaf', xp: 40, gold: 15, progress: (c) => count(c.breaths, 5) },
];

export function achievementContext(data: Data, level: number): AchievementCtx {
  const ctx: AchievementCtx = {
    tasksDone: 0,
    purposeDone: 0,
    epicDone: 0,
    habitDone: 0,
    earlyBird: false,
    nightOwl: false,
    focusMin: 0,
    sessions: 0,
    longest: 0,
    bestStreak: data.streak.best,
    level,
    purchases: data.counters.purchases,
    owned: data.owned.length,
    questDays: 0,
    reminders: data.counters.remindersSet,
    logins: data.login.total,
    journalDays: Object.keys(data.journal).length,
    breaths: data.counters.breaths,
  };
  for (const e of data.log as LogEntry[]) {
    if (e.kind === 'task') {
      ctx.tasksDone++;
      if (e.meta?.p) ctx.purposeDone++;
      if (e.meta?.d === 'epic') ctx.epicDone++;
      if (e.meta?.r) ctx.habitDone++;
      const h = new Date(e.t).getHours();
      if (h >= 4 && h < 8) ctx.earlyBird = true;
    } else if (e.kind === 'chest') {
      ctx.questDays++;
    }
  }
  for (const s of data.sessions) {
    ctx.focusMin += s.minutes;
    if (s.completed) ctx.sessions++;
    if (s.minutes > ctx.longest) ctx.longest = s.minutes;
    const h = new Date(s.end).getHours();
    if (s.minutes >= 10 && (h >= 23 || h < 4)) ctx.nightOwl = true;
  }
  return ctx;
}
