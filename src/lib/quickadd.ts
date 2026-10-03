import { addDays, nowMinutes, timeToMinutes } from './dates';

export interface QuickParse {
  title: string;
  time: string | null;
  date: string | null;
}

const TIME_RE = /(^|\s)(?:saat\s+|at\s+)?([01]?\d|2[0-3])[:.]([0-5]\d)(?=\s|$)/i;
const TOMORROW_RE = /(^|\s)(yarın|yarin|tomorrow)(?=\s|$)/i;
const TODAY_RE = /(^|\s)(bugün|bugun|today)(?=\s|$)/i;

/** "Matematik çalış 14:30 yarın" → title + reminder time + date. */
export function parseQuick(input: string, today: string): QuickParse | null {
  let s = ` ${input.trim()} `;
  let time: string | null = null;
  let date: string | null = today;
  let explicitDay = false;

  const tm = s.match(TIME_RE);
  if (tm) {
    time = `${tm[2].padStart(2, '0')}:${tm[3]}`;
    s = s.replace(tm[0], ' ');
  }
  if (TOMORROW_RE.test(s)) {
    date = addDays(today, 1);
    explicitDay = true;
    s = s.replace(TOMORROW_RE, ' ');
  } else if (TODAY_RE.test(s)) {
    explicitDay = true;
    s = s.replace(TODAY_RE, ' ');
  }
  const title = s.replace(/\s+/g, ' ').trim();
  if (!title) return null;
  if (time && !explicitDay && timeToMinutes(time) <= nowMinutes()) date = addDays(today, 1);
  return { title, time, date };
}
