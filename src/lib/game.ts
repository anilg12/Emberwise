import type { Difficulty } from './types';

export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard', 'epic'];

/** Completing a task: the original "+50 XP" stays the default (normal). */
export const TASK_XP: Record<Difficulty, number> = { easy: 25, normal: 50, hard: 80, epic: 120 };
export const TASK_GOLD: Record<Difficulty, number> = { easy: 5, normal: 10, hard: 16, epic: 25 };
export const SUBTASK_XP = 5;

export function focusReward(minutes: number, completed: boolean) {
  const m = Math.max(0, Math.floor(minutes));
  if (!completed) return { xp: m >= 5 ? m : 0, gold: m >= 5 ? Math.floor(m / 10) : 0 };
  return { xp: m * 2 + 10, gold: Math.floor(m / 5) };
}

/** XP needed to go from `level` to `level + 1`. Level 1 → 2 costs 100, like the original. */
export function xpToNext(level: number): number {
  return 100 + (level - 1) * 20;
}

/** Total XP required to reach `level`. */
export function xpForLevel(level: number): number {
  const n = level - 1;
  return 100 * n + 10 * n * (n - 1);
}

export function levelInfo(totalXp: number) {
  const xp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  const base = xpForLevel(level);
  const needed = xpToNext(level);
  const into = xp - base;
  return { level, into, needed, progress: Math.min(1, into / needed), total: xp };
}

export interface Rank {
  id: 'novice' | 'diligent' | 'master' | 'legend' | 'mythic' | 'immortal';
  minLevel: number;
  color: string;
  glow: string;
}

/** Acemi → Çalışkan → Usta → Efsane, plus two new tiers for the truly dedicated. */
export const RANKS: Rank[] = [
  { id: 'novice', minLevel: 1, color: '#9a8f7f', glow: '#d8cfc2' },
  { id: 'diligent', minLevel: 3, color: '#3e9b6e', glow: '#a6dcc0' },
  { id: 'master', minLevel: 6, color: '#3f7cc8', glow: '#a9c8ef' },
  { id: 'legend', minLevel: 10, color: '#e0912b', glow: '#ffd28a' },
  { id: 'mythic', minLevel: 15, color: '#c4477a', glow: '#f5a9c8' },
  { id: 'immortal', minLevel: 25, color: '#7a55d0', glow: '#cdb8ff' },
];

export function rankFor(level: number): Rank {
  let r = RANKS[0];
  for (const rank of RANKS) if (level >= rank.minLevel) r = rank;
  return r;
}

export function nextRank(level: number): Rank | null {
  return RANKS.find((r) => r.minLevel > level) ?? null;
}

export function rankIndex(level: number): number {
  return RANKS.indexOf(rankFor(level));
}

export const STREAK_MILESTONES: Record<number, number> = { 3: 30, 7: 80, 14: 150, 30: 300, 60: 500, 100: 1000 };

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID().slice(0, 12);
  return Math.random().toString(36).slice(2, 14);
}

/** Small deterministic PRNG so daily quests are the same all day long. */
export function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
