import type { Data, LogEntry } from './types';
import { addDays, dayKeyOfIso } from './dates';
import { seeded } from './game';

/* ------------------------------------------------------------------ */
/* Shop                                                                */
/* ------------------------------------------------------------------ */

export type Slot = 'hat' | 'pet' | 'bg' | 'consumable';

export interface ShopItem {
  id: string;
  slot: Slot;
  price: number;
  minLevel?: number;
}

export const SHOP: ShopItem[] = [
  { id: 'hat_party', slot: 'hat', price: 60 },
  { id: 'hat_beanie', slot: 'hat', price: 80 },
  { id: 'hat_flowers', slot: 'hat', price: 110 },
  { id: 'hat_wizard', slot: 'hat', price: 160 },
  { id: 'hat_viking', slot: 'hat', price: 220, minLevel: 4 },
  { id: 'hat_crown', slot: 'hat', price: 450, minLevel: 10 },

  { id: 'pet_frog', slot: 'pet', price: 120 },
  { id: 'pet_cat', slot: 'pet', price: 150 },
  { id: 'pet_owl', slot: 'pet', price: 220 },
  { id: 'pet_fox', slot: 'pet', price: 280, minLevel: 4 },
  { id: 'pet_ember', slot: 'pet', price: 350, minLevel: 6 },
  { id: 'pet_dragon', slot: 'pet', price: 600, minLevel: 15 },

  { id: 'bg_meadow', slot: 'bg', price: 100 },
  { id: 'bg_night', slot: 'bg', price: 140 },
  { id: 'bg_library', slot: 'bg', price: 180 },
  { id: 'bg_campfire', slot: 'bg', price: 220, minLevel: 3 },
  { id: 'bg_sakura', slot: 'bg', price: 260, minLevel: 5 },
  { id: 'bg_aurora', slot: 'bg', price: 400, minLevel: 10 },

  { id: 'shield', slot: 'consumable', price: 80 },
];

export const MAX_SHIELDS = 3;

export function shopItem(id: string | null | undefined): ShopItem | undefined {
  return id ? SHOP.find((i) => i.id === id) : undefined;
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
