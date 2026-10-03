import { addDays, parseDayKey } from './dates';
import { fmtDate, t, tv } from './i18n.svelte';
import type { Difficulty, Task } from './types';

export const DIFF_COLOR: Record<Difficulty, string> = {
  easy: '#4aa97a',
  normal: '#4a78c2',
  hard: '#d9822b',
  epic: '#c4477a',
};

export function dayLabel(key: string, today: string): string {
  if (key === today) return t('common.today');
  if (key === addDays(today, 1)) return t('common.tomorrow');
  if (key === addDays(today, -1)) return t('common.yesterday');
  const d = parseDayKey(key);
  const sameYear = d.getFullYear() === parseDayKey(today).getFullYear();
  return fmtDate(d, sameYear ? { day: 'numeric', month: 'short', weekday: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
}

export function repeatLabel(task: Task): string {
  if (task.repeat === 'custom') {
    const names = tv<string[]>('calendar.weekdaysMid');
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.filter((d) => task.repeatDays.includes(d)).map((d) => names[d]).join(', ');
  }
  return t(`repeat.${task.repeat}`);
}

export function greetingKey(date = new Date()): string {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'greeting.morning';
  if (h >= 12 && h < 18) return 'greeting.afternoon';
  if (h >= 18 && h < 23) return 'greeting.evening';
  return 'greeting.night';
}
