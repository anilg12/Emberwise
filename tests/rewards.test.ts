import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { store, createDefault, normalizeData, weekStart } from '../src/lib/state.svelte';
import { dayKey } from '../src/lib/dates';
import { fx } from '../src/lib/fx.svelte';
import { FOR_SALE, LOGIN_PATH, SHOP, giftForDay, shopItem } from '../src/lib/catalog';
import { CHARACTERS } from '../src/lib/characters';
import { QUOTES } from '../src/lib/quotes';
import { personalise, quoteOfDay } from '../src/lib/motivation';
import { AMBIENCES } from '../src/lib/ambience';
import { AMBIENCE_CREDITS } from '../src/lib/ambience-credits';
import tr from '../src/lib/locales/tr';
import en from '../src/lib/locales/en';

function at(date: Date) {
  vi.setSystemTime(date);
  store.today = dayKey();
}

function fresh(date = new Date(2026, 9, 5, 10, 0)) {
  vi.useFakeTimers();
  vi.setSystemTime(date);
  store.data = createDefault('tr');
  store.data.onboarded = true;
  store.today = dayKey();
  fx.celebrations = [];
  fx.toasts = [];
}

beforeEach(() => fresh());
afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('daily login', () => {
  it('counts a day once and tracks the run of days', () => {
    expect(store.touchLogin()).toBe(true);
    expect(store.touchLogin()).toBe(false);
    expect(store.data.login.total).toBe(1);
    at(new Date(2026, 9, 6, 9, 0));
    store.touchLogin();
    expect(store.data.login.streak).toBe(2);
    at(new Date(2026, 9, 9, 9, 0));
    store.touchLogin();
    expect(store.data.login).toMatchObject({ total: 3, streak: 1, best: 2 });
  });

  it('does not count before onboarding is finished', () => {
    store.data.onboarded = false;
    expect(store.touchLogin()).toBe(false);
    expect(store.data.login.total).toBe(0);
  });

  it('the daily gift follows a seven-day cycle and can be claimed once a day', () => {
    store.touchLogin();
    expect(store.gift.index).toBe(0);
    const r = store.claimGift();
    expect(r).toEqual({ gold: 20, xp: 0 });
    expect(store.claimGift()).toBeNull();
    expect(store.gold).toBe(20);
    expect(giftForDay(7).index).toBe(6);
    expect(giftForDay(8).index).toBe(0);
  });

  it('the gift waits until today is counted', () => {
    expect(store.claimGift()).toBeNull();
    store.touchLogin();
    expect(store.claimGift()).not.toBeNull();
  });

  it('weekly and monthly chests open after enough visits', () => {
    // Monday 5 Oct 2026 … Friday 9 Oct.
    expect(weekStart('2026-10-08')).toBe('2026-10-05');
    for (let d = 5; d <= 9; d++) {
      at(new Date(2026, 9, d, 9, 0));
      store.touchLogin();
      if (d < 9) expect(store.week.ready).toBe(false);
    }
    expect(store.week.ready).toBe(true);
    expect(store.claimWeek()).not.toBeNull();
    expect(store.claimWeek()).toBeNull();
    expect(store.month.ready).toBe(false);
    for (let d = 10; d <= 24; d++) {
      at(new Date(2026, 9, d, 9, 0));
      store.touchLogin();
    }
    expect(store.month.count).toBe(20);
    expect(store.claimMonth()).not.toBeNull();
  });
});

describe('reward path', () => {
  it('unlocks exclusive items only on the path', () => {
    const exclusive = SHOP.filter((i) => i.login);
    expect(exclusive.length).toBeGreaterThanOrEqual(10);
    for (const i of exclusive) {
      expect(FOR_SALE.includes(i)).toBe(false);
      expect(LOGIN_PATH.some((p) => p.item === i.id && p.day === i.login)).toBe(true);
    }
    store.data.login.total = 7;
    expect(store.canBuy('char_guardian')).toBe('exclusive');
    expect(store.pathReady.map((p) => p.day)).toEqual([1, 2, 3, 5, 7]);
    const r = store.claimPath(7);
    expect(r?.item).toBe('char_guardian');
    expect(store.owns('char_guardian')).toBe(true);
    expect(store.hasCharacter('guardian')).toBe(true);
    expect(store.claimPath(7)).toBeNull();
    expect(store.claimPath(14)).toBeNull();
  });

  it('a path step with a shield adds one', () => {
    store.data.login.total = 10;
    store.claimPath(10);
    expect(store.data.shields).toBe(1);
  });

  it('every path day is unique and ascending up to a full year', () => {
    const days = LOGIN_PATH.map((p) => p.day);
    expect([...days].sort((a, b) => a - b)).toEqual(days);
    expect(new Set(days).size).toBe(days.length);
    expect(days.at(-1)).toBe(365);
  });
});

describe('characters & wardrobe', () => {
  it('free characters are open, shop and login ones need the item', () => {
    expect(store.hasCharacter('chef')).toBe(true);
    expect(store.hasCharacter('astronaut')).toBe(false);
    store.setCharacter('astronaut');
    expect(store.data.profile.look.heroClass).toBe('wizard');
    store.data.owned.push('char_astronaut');
    store.setCharacter('astronaut', 2);
    expect(store.data.profile.look).toMatchObject({ heroClass: 'astronaut', tone: 2 });
  });

  it('buying a character wears it', () => {
    store.data.log.push({ id: 'g', t: new Date().toISOString(), kind: 'quest', xp: 0, gold: 1000, ref: 'g' });
    expect(store.buy('char_explorer')).toBe(true);
    expect(store.data.profile.look.heroClass).toBe('explorer');
  });

  it('every character has four tones and every item a name in both languages', () => {
    for (const c of CHARACTERS) {
      expect(c.tones.length).toBe(4);
      expect(tr.hero.classes[c.id as keyof typeof tr.hero.classes]).toBeTruthy();
      expect(en.hero.classes[c.id as keyof typeof en.hero.classes]).toBeTruthy();
      if (c.tier !== 'free') expect(shopItem(`char_${c.id}`)).toBeTruthy();
    }
    for (const i of SHOP) {
      expect(tr.shop.items[i.id]?.[0]).toBeTruthy();
      expect(en.shop.items[i.id]?.[0]).toBeTruthy();
    }
  });

  it('normalizeData keeps owned exclusives and drops characters you do not own', () => {
    const raw = JSON.parse(JSON.stringify(createDefault('tr')));
    raw.owned = ['char_oracle', 'acc_glasses', 'nope'];
    raw.equipped = { hat: null, pet: null, bg: null, acc: 'acc_glasses' };
    raw.profile.look = { body: 'm', skin: 2, hair: 3, hairColor: 1, heroClass: 'pirate', tone: 3 };
    const d = normalizeData(raw);
    expect(d.owned).toEqual(['char_oracle', 'acc_glasses']);
    expect(d.equipped.acc).toBe('acc_glasses');
    expect(d.profile.look.heroClass).toBe('wizard');
    raw.profile.look.heroClass = 'oracle';
    expect(normalizeData(raw).profile.look).toMatchObject({ heroClass: 'oracle', tone: 3 });
  });
});

describe('ambience', () => {
  it('migrates the old single ambience to a mix', () => {
    const raw = JSON.parse(JSON.stringify(createDefault('tr')));
    raw.settings.ambient = 'fire';
    expect(normalizeData(raw).settings.ambient).toEqual({ fire: 0.7 });
    raw.settings.ambient = 'off';
    expect(normalizeData(raw).settings.ambient).toEqual({});
    raw.settings.ambient = { cafe: 0.5, rain: 2, bogus: 1, wind: -1 };
    expect(normalizeData(raw).settings.ambient).toEqual({ cafe: 0.5, rain: 1 });
  });

  it('every recorded sound has credits and a loop length', () => {
    const recorded = AMBIENCES.filter((a) => a.group !== 'noise').map((a) => a.id);
    for (const id of recorded) {
      const c = AMBIENCE_CREDITS.find((x) => x.id === id);
      expect(c, id).toBeTruthy();
      expect(c!.samples).toBeGreaterThan(48000 * 20);
      expect(c!.license).toBeTruthy();
    }
  });
});

describe('journal & words', () => {
  it('the first mood of the day gives a little XP, changes are free', () => {
    expect(store.setMood(4)).toBe(true);
    expect(store.totalXp).toBe(10);
    expect(store.setMood(2)).toBe(false);
    expect(store.totalXp).toBe(10);
    store.setJournalNote('Güneşli bir sabah');
    expect(store.data.journal[store.today]).toEqual({ mood: 2, note: 'Güneşli bir sabah' });
  });

  it('there are hundreds of lines, paired in both languages', () => {
    const all = Object.values(QUOTES).flat();
    expect(all.length).toBeGreaterThanOrEqual(300);
    for (const [a, b] of all) {
      expect(a.trim().length).toBeGreaterThan(5);
      expect(b.trim().length).toBeGreaterThan(5);
      expect(a.includes('{name}')).toBe(b.includes('{name}'));
    }
  });

  it('personalises lines and drops the name gracefully', () => {
    expect(personalise('Günaydın {name}!', 'Anıl')).toBe('Günaydın Anıl!');
    expect(personalise('Günaydın {name}!', '')).toBe('Günaydın!');
    expect(personalise('Good morning, {name}!', '')).toBe('Good morning!');
    expect(quoteOfDay('2026-10-05').id).toBe(quoteOfDay('2026-10-05').id);
  });

  it('favourites toggle', () => {
    expect(store.toggleFavorite('life:3')).toBe(true);
    expect(store.data.favorites).toEqual(['life:3']);
    expect(store.toggleFavorite('life:3')).toBe(false);
  });
});
