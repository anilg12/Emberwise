// date helpers. "day key" = YYYY-MM-DD in local time

const pad = (n: number) => String(n).padStart(2, '0');

export function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

export function addDays(key: string, n: number): string {
  const d = parseDayKey(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

// calendar days from a to b (b - a), rounded so DST doesn't break it
export function diffDays(a: string, b: string): number {
  return Math.round((parseDayKey(b).getTime() - parseDayKey(a).getTime()) / 86_400_000);
}

export function weekday(key: string): number {
  return parseDayKey(key).getDay();
}

export function isValidTime(t: string | null | undefined): t is string {
  return !!t && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function nowMinutes(d: Date = new Date()): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function atTime(key: string, time: string): Date {
  const d = parseDayKey(key);
  const mins = timeToMinutes(time);
  d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return d;
}

export function isoNow(): string {
  return new Date().toISOString();
}

export function dayKeyOfIso(iso: string): string {
  return dayKey(new Date(iso));
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${pad(m)}:${pad(s)}`;
}

export function msUntilMidnight(d: Date = new Date()): number {
  const next = new Date(d);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - d.getTime();
}
