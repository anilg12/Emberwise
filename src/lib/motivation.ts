// Picks a fitting line for a moment and personalises it. Recently shown lines rest for a while,
// so the same words don't come back too soon.

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

/** The text of a quote id in the current language, personalised. */
export function quoteText(id: string, name = ''): string | null {
  const [tag, index] = id.split(':');
  const pair = QUOTES[tag as QuoteTag]?.[Number(index)];
  if (!pair) return null;
  return personalise(pair[i18n.lang === 'tr' ? 0 : 1], name);
}

export function personalise(text: string, name: string): string {
  const n = name.trim();
  if (n) return text.replaceAll('{name}', n);
  // Without a name, "Günaydın {name}!" simply becomes "Günaydın!".
  return text.replace(/,?\s*\{name\}/g, '').replace(/\s+([!.?,])/g, '$1');
}

/** A random line for the moment; one in four times a general life line joins the draw. */
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

/** The same line all day long, different every day. */
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
