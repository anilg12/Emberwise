// picks a quote for the moment and fills in the name.
// recently shown ones are skipped for a while so they don't repeat

import { QUOTES, type QuoteTag } from './quotes';
import { i18n } from './i18n.svelte';
import { seeded } from './game';

const RECENT_KEY = 'emberwise-recent-quotes';
const RECENT_MAX = 60;

let recent: string[] = [];
try {
  recent = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  if (!Array.isArray(recent)) recent = [];
} catch {
  recent = [];
}

function remember(id: string) {
  recent = [id, ...recent.filter((r) => r !== id)].slice(0, RECENT_MAX);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch {
    /* storage may be unavailable */
  }
}

export interface Quote {
  id: string;
  tag: QuoteTag;
  text: string;
}

// quote text in the current language, name filled in
export function quoteText(id: string, name = ''): string | null {
  const [tag, index] = id.split(':');
  const pair = QUOTES[tag as QuoteTag]?.[Number(index)];
  if (!pair) return null;
  return personalise(pair[i18n.lang === 'tr' ? 0 : 1], name);
}

export function personalise(text: string, name: string): string {
  const n = name.trim();
  if (n) return text.replaceAll('{name}', n);
  // no name: "Günaydın {name}!" -> "Günaydın!"
  return text.replace(/,?\s*\{name\}/g, '').replace(/\s+([!.?,])/g, '$1');
}

// random line for the moment, 1 in 4 times the general ones are in the pool too
export function pickQuote(tag: QuoteTag, name = '', withLife = true): Quote {
  const pool: { id: string; tag: QuoteTag }[] = QUOTES[tag].map((_, i) => ({ id: `${tag}:${i}`, tag }));
  if (withLife && tag !== 'life' && Math.random() < 0.25) {
    QUOTES.life.forEach((_, i) => pool.push({ id: `life:${i}`, tag: 'life' }));
  }
  const fresh = pool.filter((p) => !recent.includes(p.id));
  const from = fresh.length ? fresh : pool;
  const pick = from[Math.floor(Math.random() * from.length)];
  remember(pick.id);
  return { ...pick, text: quoteText(pick.id, name) ?? '' };
}

// quote of the day (same all day)
export function quoteOfDay(day: string, name = '', offset = 0): Quote {
  const rnd = seeded(`words-${day}`);
  const base = Math.floor(rnd() * QUOTES.life.length);
  const index = (base + offset * 37) % QUOTES.life.length;
  const id = `life:${index}`;
  return { id, tag: 'life', text: quoteText(id, name) ?? '' };
}

export function timeTag(date = new Date()): QuoteTag {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}
