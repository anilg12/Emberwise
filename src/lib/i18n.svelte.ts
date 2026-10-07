import tr from './locales/tr';
import en from './locales/en';
import type { Lang } from './types';

const dicts = { tr, en } as const;

class I18n {
  lang = $state<Lang>('tr');
  dict = $derived(dicts[this.lang]);
  locale = $derived(this.lang === 'tr' ? 'tr-TR' : 'en-US');
}

export const i18n = new I18n();

function lookup(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const part of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

export function t(key: string, params?: Record<string, string | number>): string {
  let v = lookup(i18n.dict, key);
  if (typeof v !== 'string') v = lookup(dicts.en, key);
  if (typeof v !== 'string') {
    if (import.meta.env.DEV) console.warn('[i18n] missing', key);
    return key;
  }
  if (!params) return v as string;
  return (v as string).replace(/\{(\w+)\}/g, (_, k: string) => (k in params ? String(params[k]) : `{${k}}`));
}

// raw value (arrays/tuples)
export function tv<T>(key: string): T {
  const v = lookup(i18n.dict, key);
  return (v ?? lookup(dicts.en, key)) as T;
}

export function itemName(id: string): string {
  return tv<[string, string] | undefined>(`shop.items.${id}`)?.[0] ?? id;
}

export function itemDesc(id: string): string {
  return tv<[string, string] | undefined>(`shop.items.${id}`)?.[1] ?? '';
}

export function upper(s: string): string {
  return s.toLocaleUpperCase(i18n.locale);
}

export function fmtDate(d: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(i18n.locale, opts).format(d);
}

export function fmtTime(d: Date): string {
  return new Intl.DateTimeFormat(i18n.locale, { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
}

export function fmtNumber(n: number): string {
  return new Intl.NumberFormat(i18n.locale).format(n);
}

export function fmtDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return t('common.minutes', { n: m });
  return t('common.hoursMinutes', { h: Math.floor(m / 60), m: m % 60 });
}

export function detectLang(): Lang {
  const langs = typeof navigator !== 'undefined' ? navigator.languages || [navigator.language] : [];
  return langs.some((l) => l && l.toLowerCase().startsWith('tr')) ? 'tr' : 'en';
}
