import { describe, expect, it, vi, afterEach } from 'vitest';
import { levelInfo, xpForLevel, rankFor, nextRank, focusReward, seeded } from '../src/lib/game';
import { addDays, diffDays, dayKey, isValidTime, minutesToTime, parseDayKey, formatClock } from '../src/lib/dates';
import { parseQuick } from '../src/lib/quickadd';
import { questsForDay } from '../src/lib/catalog';

afterEach(() => {
  vi.useRealTimers();
});

describe('levels', () => {
  it('first level costs 100 XP like the original', () => {
    expect(levelInfo(0).level).toBe(1);
    expect(levelInfo(99).level).toBe(1);
    expect(levelInfo(100).level).toBe(2);
    expect(levelInfo(100).into).toBe(0);
  });
  it('is monotonic and consistent with xpForLevel', () => {
    let last = 1;
    for (let xp = 0; xp < 20000; xp += 37) {
      const info = levelInfo(xp);
      expect(info.level).toBeGreaterThanOrEqual(last);
      expect(xp).toBeGreaterThanOrEqual(xpForLevel(info.level));
      expect(xp).toBeLessThan(xpForLevel(info.level + 1));
      expect(info.progress).toBeGreaterThanOrEqual(0);
      expect(info.progress).toBeLessThan(1);
      last = info.level;
    }
  });
  it('never goes below level 1 for negative input', () => {
    expect(levelInfo(-50).level).toBe(1);
  });
  it('keeps the original rank ladder', () => {
    expect(rankFor(1).id).toBe('novice');
    expect(rankFor(3).id).toBe('diligent');
    expect(rankFor(6).id).toBe('master');
    expect(rankFor(10).id).toBe('legend');
    expect(rankFor(15).id).toBe('mythic');
    expect(rankFor(99).id).toBe('immortal');
    expect(nextRank(99)).toBeNull();
    expect(nextRank(1)?.id).toBe('diligent');
  });
});

describe('focus rewards', () => {
  it('pays for full sessions and partial ones of 5+ minutes', () => {
    expect(focusReward(25, true)).toEqual({ xp: 60, gold: 5 });
    expect(focusReward(4, false)).toEqual({ xp: 0, gold: 0 });
    expect(focusReward(12, false)).toEqual({ xp: 12, gold: 1 });
  });
});

describe('dates', () => {
  it('adds days across months and years', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('diffDays is DST-safe', () => {
    expect(diffDays('2026-03-28', '2026-03-30')).toBe(2);
    expect(diffDays('2026-10-24', '2026-10-26')).toBe(2);
  });
  it('round-trips day keys', () => {
    expect(dayKey(parseDayKey('2026-07-04'))).toBe('2026-07-04');
  });
  it('validates times', () => {
    expect(isValidTime('09:30')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('9:30')).toBe(false);
    expect(minutesToTime(-30)).toBe('23:30');
    expect(formatClock(25 * 60_000)).toBe('25:00');
    expect(formatClock(1)).toBe('00:01');
  });
});

describe('quick add', () => {
  it('extracts a reminder time and keeps the title', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 3, 9, 0));
    const r = parseQuick('Matematik çalış 14:30', '2026-10-03');
    expect(r).toEqual({ title: 'Matematik çalış', time: '14:30', date: '2026-10-03' });
  });
  it('moves a passed time to tomorrow', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 3, 18, 0));
    expect(parseQuick('Koş 07:00', '2026-10-03')?.date).toBe('2026-10-04');
  });
  it('understands "yarın" and "tomorrow"', () => {
    expect(parseQuick('Annemi ara yarın', '2026-10-03')).toEqual({ title: 'Annemi ara', time: null, date: '2026-10-04' });
    expect(parseQuick('call mom tomorrow 9.15', '2026-10-03')).toEqual({ title: 'call mom', time: '09:15', date: '2026-10-04' });
  });
  it('rejects empty titles', () => {
    expect(parseQuick('   14:30 ', '2026-10-03')).toBeNull();
  });
});

describe('daily quests', () => {
  it('are deterministic per day and always three distinct', () => {
    const a = questsForDay('2026-10-03').map((q) => q.id);
    const b = questsForDay('2026-10-03').map((q) => q.id);
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(3);
  });
  it('seeded PRNG stays in [0, 1)', () => {
    const r = seeded('x');
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
