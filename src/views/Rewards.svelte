<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { store } from '../lib/state.svelte';
  import { t, tv, itemName, fmtNumber, fmtDate } from '../lib/i18n.svelte';
  import { DAILY_GIFTS, LOGIN_PATH, MONTH_CHEST, WEEK_CHEST, shopItem } from '../lib/catalog';
  import { claimGift, claimMonth, claimPath, claimWeek } from '../lib/actions';
  import { addDays, parseDayKey, weekday } from '../lib/dates';
  import { rise } from '../lib/motion';
  import type { HeroClass } from '../lib/types';
  import Icon from '../components/Icon.svelte';
  import GiftBox from '../components/GiftBox.svelte';
  import ChestArt from '../components/ChestArt.svelte';
  import ItemThumb from '../components/ItemThumb.svelte';
  import XPBar from '../components/XPBar.svelte';

  const login = $derived(store.data.login);
  const todayCounted = $derived(login.lastDay === store.today);
  const exclusives = $derived(LOGIN_PATH.filter((p) => p.item));
  const ownedExclusive = $derived(exclusives.filter((p) => store.owns(p.item)).length);
  const nextStep = $derived(LOGIN_PATH.find((p) => p.day > login.total));
  const marks = $derived(tv<Record<number, string>>('rewards.marks'));

  // last 20 weeks, monday first
  const WEEKS = 20;
  const loginSet = $derived(new Set(login.days));
  const calendar = $derived.by(() => {
    const end = store.today;
    const lastMonday = addDays(end, -((weekday(end) + 6) % 7));
    const first = addDays(lastMonday, -(WEEKS - 1) * 7);
    const cols: { key: string; on: boolean; future: boolean }[][] = [];
    for (let w = 0; w < WEEKS; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const key = addDays(first, w * 7 + d);
        col.push({ key, on: loginSet.has(key), future: key > end });
      }
      cols.push(col);
    }
    return cols;
  });

  let track: HTMLDivElement | undefined = $state();

  onMount(async () => {
    await tick();
    const target = track?.querySelector<HTMLElement>('.stop.ready, .stop.next');
    if (track && target) track.scrollLeft = Math.max(0, target.offsetLeft - track.clientWidth / 2 + target.clientWidth / 2);
  });

  function wear(item: string) {
    const it = shopItem(item);
    if (!it) return;
    if (it.slot === 'char') store.setCharacter(item.slice(5) as HeroClass, 0);
    else if (it.slot !== 'consumable') store.equip(it.slot, item);
  }
  function worn(item: string) {
    const it = shopItem(item);
    if (!it) return false;
    if (it.slot === 'char') return store.data.profile.look.heroClass === item.slice(5);
    return it.slot !== 'consumable' && store.data.equipped[it.slot] === item;
  }
</script>

<div class="page">
  <header class="page-head" in:rise>
    <div>
      <h1>{t('rewards.title')}</h1>
      <p>{t('rewards.subtitle')}</p>
    </div>
    <div class="counts">
      <div><b class="num">{fmtNumber(login.total)}</b><span>{t('rewards.totalDays')}</span></div>
      <div><b class="num">{login.streak}</b><span>{t('rewards.inARow')}</span></div>
      <div><b class="num">{login.best}</b><span>{t('rewards.best')}</span></div>
    </div>
  </header>

  <div class="top">
    <section class="card gift" in:rise={{ delay: 40 }}>
      <div class="gift-main">
        <button class="gift-art" onclick={(e) => claimGift(e.currentTarget)} disabled={store.giftClaimed || !todayCounted} aria-label={t('rewards.claim')}>
          <GiftBox size={128} open={store.giftClaimed} tone={store.gift.index === 6 ? 'gold' : 'ember'} />
        </button>
        <div class="gift-text">
          <p class="eyebrow">{t('rewards.giftTitle')} · {t('rewards.day', { n: store.gift.index + 1 })}</p>
          <h2>
            {#if store.gift.gold}<span class="gold"><Icon name="coin" size={20} />+{store.gift.gold}</span>{/if}
            {#if store.gift.xp}<span class="xp">+{store.gift.xp} XP</span>{/if}
          </h2>
          <p class="muted">{t('rewards.giftHint')}</p>
          {#if store.giftClaimed}
            <span class="claimed"><Icon name="check" size={15} />{t('rewards.claimed')} · {t('rewards.later')}</span>
          {:else}
            <button class="btn primary" onclick={(e) => claimGift(e.currentTarget)} disabled={!todayCounted}><Icon name="gift" size={16} />{t('rewards.claim')}</button>
          {/if}
        </div>
      </div>
      <ol class="cycle">
        {#each DAILY_GIFTS as g, i}
          {@const past = i < store.gift.index || (i === store.gift.index && store.giftClaimed)}
          <li class:past class:today={i === store.gift.index} class:big={i === 6}>
            <span class="d">{t('rewards.day', { n: i + 1 })}</span>
            <span class="r">
              {#if past}<Icon name="check" size={13} stroke={3} />{:else if g.gold}<Icon name="coin" size={12} />{g.gold}{:else}{g.xp} XP{/if}
            </span>
          </li>
        {/each}
      </ol>
    </section>

    <div class="chests">
      <section class="card chest" class:ready={store.week.ready && !store.week.claimed} in:rise={{ delay: 80 }}>
        <ChestArt state={store.week.claimed ? 'opened' : store.week.ready ? 'ready' : 'locked'} size={58} />
        <div class="c-body">
          <strong>{t('rewards.weekTitle')}</strong>
          <span>{t('rewards.weekHint', { n: WEEK_CHEST.days })}</span>
          <div class="c-prog">
            <XPBar progress={Math.min(1, store.week.count / WEEK_CHEST.days)} height={6} tone={store.week.ready ? 'success' : 'accent'} shimmer={false} />
            <span class="num">{t('rewards.progress', { have: Math.min(store.week.count, WEEK_CHEST.days), need: WEEK_CHEST.days })}</span>
          </div>
        </div>
        {#if store.week.claimed}
          <span class="claimed"><Icon name="check" size={15} /></span>
        {:else if store.week.ready}
          <button class="btn primary sm" onclick={(e) => claimWeek(e.currentTarget)}>{t('rewards.claim')}</button>
        {:else}
          <span class="loot-mini"><Icon name="coin" size={13} />{WEEK_CHEST.gold}</span>
        {/if}
      </section>
      <section class="card chest" class:ready={store.month.ready && !store.month.claimed} in:rise={{ delay: 110 }}>
        <ChestArt state={store.month.claimed ? 'opened' : store.month.ready ? 'ready' : 'locked'} size={58} />
        <div class="c-body">
          <strong>{t('rewards.monthTitle')}</strong>
          <span>{t('rewards.monthHint', { n: MONTH_CHEST.days })}</span>
          <div class="c-prog">
            <XPBar progress={Math.min(1, store.month.count / MONTH_CHEST.days)} height={6} tone={store.month.ready ? 'success' : 'accent'} shimmer={false} />
            <span class="num">{t('rewards.progress', { have: Math.min(store.month.count, MONTH_CHEST.days), need: MONTH_CHEST.days })}</span>
          </div>
        </div>
        {#if store.month.claimed}
          <span class="claimed"><Icon name="check" size={15} /></span>
        {:else if store.month.ready}
          <button class="btn primary sm" onclick={(e) => claimMonth(e.currentTarget)}>{t('rewards.claim')}</button>
        {:else}
          <span class="loot-mini"><Icon name="coin" size={13} />{MONTH_CHEST.gold}</span>
        {/if}
      </section>
    </div>
  </div>

  <section class="card path-card" in:rise={{ delay: 140 }}>
    <div class="section-title">
      <div>
        <h2><Icon name="path" size={20} />{t('rewards.pathTitle')}</h2>
        <p class="muted">{t('rewards.pathHint')}</p>
      </div>
      <div class="col-count">
        <span class="chip"><Icon name="spark" size={13} />{ownedExclusive} / {exclusives.length}</span>
        <span class="muted small">{nextStep ? t('rewards.nextIn', { n: nextStep.day - login.total }) : t('rewards.pathDone')}</span>
      </div>
    </div>
    <div class="track" bind:this={track}>
      <div class="line" aria-hidden="true"></div>
      {#each LOGIN_PATH as step (step.day)}
        {@const claimed = login.claimed.includes(`path:${step.day}`)}
        {@const reached = step.day <= login.total}
        {@const item = step.item ? shopItem(step.item) : null}
        <div class="stop" class:claimed class:ready={reached && !claimed} class:next={nextStep?.day === step.day} class:locked={!reached} class:hero={item?.slot === 'char'}>
          <span class="day">
            {#if marks[step.day]}<b>{marks[step.day]}</b>{/if}
            {t('rewards.day', { n: step.day })}
          </span>
          <div class="reward">
            {#if step.item}
              <div class="thumb"><ItemThumb id={step.item} size={item?.slot === 'char' ? 104 : 88} /></div>
              <strong>{itemName(step.item)}</strong>
              <span class="kind">{t(`rewards.slotNames.${item?.slot ?? 'hat'}`)} · {t('common.exclusive')}</span>
            {:else}
              <div class="coins">
                <Icon name={step.shields ? 'shield' : 'coin'} size={30} />
              </div>
              <strong>{step.gold ? t('rewards.gold', { n: step.gold }) : ''}{step.xp ? ` · +${step.xp} XP` : ''}</strong>
              <span class="kind">{step.shields ? t('rewards.shield') : t('rewards.pathTitle')}</span>
            {/if}
            {#if step.item && step.gold}<span class="extra"><Icon name="coin" size={12} />+{step.gold}</span>{/if}
          </div>
          <div class="state">
            {#if claimed}
              {#if step.item && !worn(step.item)}
                <button class="btn sm soft" onclick={() => wear(step.item!)}>{t('rewards.wearNow')}</button>
              {:else}
                <span class="ok"><Icon name="check" size={14} stroke={3} />{t('rewards.claimed')}</span>
              {/if}
            {:else if reached}
              <button class="btn primary sm" onclick={(e) => claimPath(step.day, e.currentTarget)}><Icon name="gift" size={14} />{t('rewards.claim')}</button>
            {:else}
              <span class="lock"><Icon name="lock" size={13} />{t('rewards.nextIn', { n: step.day - login.total })}</span>
            {/if}
          </div>
          <span class="node" aria-hidden="true"></span>
        </div>
      {/each}
    </div>
  </section>

  <section class="card cal-card" in:rise={{ delay: 170 }}>
    <div class="section-title">
      <h2><Icon name="calendar" size={19} />{t('rewards.calendar')}</h2>
      <span class="muted small">{t('rewards.calendarHint')}</span>
    </div>
    <div class="cal">
      {#each calendar as col}
        <div class="col">
          {#each col as cell (cell.key)}
            <span
              class="cell"
              class:on={cell.on}
              class:future={cell.future}
              class:today={cell.key === store.today}
              title={fmtDate(parseDayKey(cell.key), { day: 'numeric', month: 'long', weekday: 'short' })}
            ></span>
          {/each}
        </div>
      {/each}
    </div>
  </section>
</div>

<style>
  .counts {
    display: flex;
    gap: 8px;
  }
  .counts div {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 82px;
    padding: 8px 12px;
    border-radius: 14px;
    background: var(--surface);
    border: 1px solid var(--line);
    box-shadow: var(--shadow-sm);
  }
  .counts b {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 650;
    line-height: 1.1;
  }
  .counts span {
    font-size: 11.5px;
    font-weight: 700;
    color: var(--ink-3);
    white-space: nowrap;
  }
  .top {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    gap: 18px;
    align-items: stretch;
  }
  .gift {
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    background:
      radial-gradient(circle at 12% 30%, var(--accent-softer), transparent 55%),
      var(--surface);
  }
  .gift-main {
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .gift-art {
    flex: none;
    border-radius: 20px;
    transition: transform 0.3s var(--ease-spring);
  }
  .gift-art:not(:disabled):hover {
    transform: scale(1.05) rotate(-2deg);
  }
  .gift-art:disabled {
    cursor: default;
  }
  .gift-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  .gift-text h2 {
    display: flex;
    gap: 10px;
    font-size: 26px;
  }
  .gold,
  .xp {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .gold {
    color: color-mix(in srgb, var(--gold) 85%, var(--ink));
  }
  .xp {
    color: var(--accent-text);
  }
  .muted {
    color: var(--ink-3);
    font-size: 13px;
    font-weight: 650;
  }
  .small {
    font-size: 12px;
  }
  .claimed {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    font-weight: 800;
    color: var(--success);
  }
  .cycle {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
  }
  .cycle li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 8px 2px;
    border-radius: 12px;
    background: var(--surface-2);
    border: 1px solid var(--line);
    font-size: 11px;
    font-weight: 800;
    color: var(--ink-3);
    transition: transform 0.3s var(--ease-spring);
  }
  .cycle li.big {
    background: var(--gold-soft);
  }
  .cycle li.today {
    border-color: var(--accent);
    background: var(--accent-softer);
    color: var(--ink);
    transform: translateY(-3px);
  }
  .cycle li.past {
    opacity: 0.6;
  }
  .cycle .r {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 12px;
    color: var(--ink-2);
  }
  .cycle li.past .r {
    color: var(--success);
  }
  .chests {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .chest {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    transition:
      border-color 0.3s,
      box-shadow 0.3s;
  }
  .chest.ready {
    border-color: color-mix(in srgb, var(--gold) 60%, var(--line));
    box-shadow: 0 0 0 4px var(--gold-soft);
  }
  .c-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .c-body strong {
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 650;
  }
  .c-body > span {
    font-size: 12.5px;
    color: var(--ink-3);
    font-weight: 650;
  }
  .c-prog {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    font-size: 11.5px;
    font-weight: 800;
    color: var(--ink-3);
  }
  .c-prog :global(> :first-child) {
    flex: 1;
  }
  .loot-mini {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: 800;
    color: var(--ink-3);
  }
  .path-card,
  .cal-card {
    margin-top: 18px;
    padding: 18px 20px;
  }
  .section-title {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }
  .section-title h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
  }
  .section-title h2 :global(svg) {
    color: var(--accent);
  }
  .col-count {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }
  .chip :global(svg) {
    color: var(--gold);
  }
  .track {
    position: relative;
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding: 4px 4px 26px;
    scroll-snap-type: x proximity;
    scrollbar-width: thin;
  }
  .line {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 14px;
    height: 3px;
    min-width: 100%;
    border-radius: 3px;
    background: var(--surface-3);
  }
  .stop {
    position: relative;
    flex: none;
    width: 150px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    border-radius: 16px;
    background: var(--surface-2);
    border: 1.5px solid var(--line);
    scroll-snap-align: center;
    transition:
      transform 0.3s var(--ease-spring),
      border-color 0.3s,
      box-shadow 0.3s;
  }
  .stop.hero {
    width: 170px;
    background:
      radial-gradient(circle at 50% 30%, var(--gold-soft), transparent 70%),
      var(--surface-2);
  }
  .stop:hover {
    transform: translateY(-3px);
  }
  .stop.ready {
    border-color: var(--gold);
    box-shadow: 0 0 0 4px var(--gold-soft);
    animation: nudge 2.6s ease-in-out infinite;
  }
  @keyframes nudge {
    0%,
    80%,
    100% {
      transform: translateY(0);
    }
    86% {
      transform: translateY(-4px);
    }
    92% {
      transform: translateY(0);
    }
  }
  .stop.next {
    border-color: var(--accent);
  }
  .stop.locked .thumb,
  .stop.locked .coins {
    filter: grayscale(0.7);
    opacity: 0.6;
  }
  .day {
    display: flex;
    flex-direction: column;
    font-size: 11.5px;
    font-weight: 800;
    color: var(--ink-3);
  }
  .day b {
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 650;
    color: var(--accent-text);
  }
  .reward {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
  }
  .reward strong {
    font-size: 13px;
    font-weight: 800;
    line-height: 1.2;
  }
  .kind {
    font-size: 11px;
    font-weight: 750;
    color: var(--ink-3);
  }
  .coins {
    display: grid;
    place-items: center;
    height: 88px;
    border-radius: 14px;
    background: var(--gold-soft);
    color: var(--gold);
  }
  .extra {
    position: absolute;
    top: 6px;
    right: 6px;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    height: 20px;
    padding: 0 7px;
    border-radius: 99px;
    background: var(--surface);
    font-size: 11px;
    font-weight: 900;
    color: color-mix(in srgb, var(--gold) 80%, var(--ink));
    box-shadow: var(--shadow-sm);
  }
  .state {
    min-height: 30px;
    display: flex;
    align-items: center;
  }
  .ok {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 800;
    color: var(--success);
  }
  .lock {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    font-weight: 750;
    color: var(--ink-3);
  }
  .node {
    position: absolute;
    left: 50%;
    bottom: -19px;
    width: 13px;
    height: 13px;
    margin-left: -6.5px;
    border-radius: 50%;
    background: var(--surface-3);
    border: 2.5px solid var(--surface);
  }
  .stop.claimed .node,
  .stop.ready .node {
    background: var(--accent);
  }
  .stop.ready .node {
    background: var(--gold);
  }
  .cal {
    display: flex;
    gap: 4px;
    overflow-x: auto;
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .cell {
    width: 15px;
    height: 15px;
    border-radius: 4px;
    background: var(--surface-3);
  }
  .cell.on {
    background: var(--accent);
  }
  .cell.future {
    background: transparent;
    border: 1px dashed var(--line);
  }
  .cell.today {
    box-shadow:
      0 0 0 2px var(--surface),
      0 0 0 3.5px var(--accent);
  }
  @media (max-width: 1100px) {
    .top {
      grid-template-columns: 1fr;
    }
  }
</style>
