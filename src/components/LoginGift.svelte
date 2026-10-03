<script lang="ts">
  import { store } from '../lib/state.svelte';
  import { t, itemName } from '../lib/i18n.svelte';
  import { DAILY_GIFTS, LOGIN_PATH, shopItem } from '../lib/catalog';
  import { claimGift } from '../lib/actions';
  import { pickQuote } from '../lib/motivation';
  import { addDays } from '../lib/dates';
  import { rise, pop } from '../lib/motion';
  import Modal from './Modal.svelte';
  import Icon from './Icon.svelte';
  import GiftBox from './GiftBox.svelte';
  import ItemThumb from './ItemThumb.svelte';

  let { open, onclose }: { open: boolean; onclose: () => void } = $props();

  let opened = $state(false);
  let words = $state('');

  const comeback = $derived.by(() => {
    const days = store.data.login.days;
    return days.length > 1 && days[days.length - 2] < addDays(store.today, -3);
  });
  const nextStep = $derived(LOGIN_PATH.find((p) => p.day > store.data.login.total));
  const ready = $derived(store.pathReady.length);

  $effect(() => {
    if (open) {
      opened = store.giftClaimed;
      words = pickQuote(comeback ? 'comeback' : 'login', store.data.profile.name).text;
    }
  });

  function openGift(e: MouseEvent) {
    if (opened) return;
    opened = true;
    claimGift(e.currentTarget as Element);
  }

  function seeAll() {
    onclose();
    store.navigate('rewards');
  }
</script>

<Modal {open} {onclose} width={460} label={t('rewards.welcome')}>
  <div class="gift-pop">
    <div class="halo" aria-hidden="true"></div>
    <h2 in:rise>{t('rewards.welcome')}</h2>
    <p class="words" in:rise={{ delay: 80 }}>{words}</p>

    <button class="box" class:opened onclick={openGift} disabled={opened} aria-label={t('rewards.openGift')}>
      <GiftBox size={150} open={opened} tone={store.gift.index === 6 ? 'gold' : 'ember'} />
      {#if opened}
        <span class="loot" in:pop={{ delay: 240 }}>
          {#if store.gift.gold}<span class="gold"><Icon name="coin" size={16} />+{store.gift.gold}</span>{/if}
          {#if store.gift.xp}<span class="xp">+{store.gift.xp} XP</span>{/if}
        </span>
      {/if}
    </button>

    <ol class="week" aria-label={t('rewards.giftTitle')}>
      {#each DAILY_GIFTS as g, i}
        <li class:past={i < store.gift.index || (i === store.gift.index && opened)} class:today={i === store.gift.index} class:big={i === 6}>
          <span class="d">{t('rewards.day', { n: i + 1 })}</span>
          <span class="r">
            {#if i < store.gift.index || (i === store.gift.index && opened)}
              <Icon name="check" size={13} stroke={3} />
            {:else if g.gold}
              <Icon name="coin" size={12} />{g.gold}
            {:else}
              {g.xp}
            {/if}
          </span>
        </li>
      {/each}
    </ol>

    <div class="path">
      <span class="pday">{t('rewards.onDay', { n: store.data.login.total })}</span>
      {#if nextStep?.item}
        <span class="next">
          <span class="thumb"><ItemThumb id={nextStep.item} size={40} /></span>
          <span>{itemName(nextStep.item)} · {t('rewards.nextIn', { n: nextStep.day - store.data.login.total })}</span>
        </span>
      {:else if nextStep}
        <span class="next">{t('rewards.nextIn', { n: nextStep.day - store.data.login.total })}</span>
      {/if}
    </div>

    <div class="actions">
      {#if !opened}
        <button class="btn ghost" onclick={onclose}>{t('rewards.notNow')}</button>
        <!-- svelte-ignore a11y_autofocus -->
        <button class="btn primary lg" onclick={openGift} autofocus><Icon name="gift" size={17} />{t('rewards.openGift')}</button>
      {:else}
        <button class="btn ghost" onclick={seeAll}>
          {ready ? t('rewards.waiting', { n: ready }) : t('rewards.seeAll')}
          {#if ready}<span class="dot"></span>{/if}
        </button>
        <!-- svelte-ignore a11y_autofocus -->
        <button class="btn primary lg" onclick={onclose} autofocus>{t('level.continue')}</button>
      {/if}
    </div>
    {#if nextStep?.item && shopItem(nextStep.item)?.slot === 'char'}
      <p class="tease"><Icon name="spark" size={13} />{t('common.exclusive')} · {t(`rewards.slotNames.char`)}</p>
    {/if}
  </div>
</Modal>

<style>
  .gift-pop {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 26px 24px 22px;
    text-align: center;
    overflow: hidden;
  }
  .halo {
    position: absolute;
    top: -120px;
    left: 50%;
    width: 420px;
    height: 320px;
    transform: translateX(-50%);
    background: radial-gradient(ellipse at center, var(--accent-soft), transparent 65%);
    pointer-events: none;
  }
  h2 {
    position: relative;
    font-size: 28px;
  }
  .words {
    position: relative;
    max-width: 340px;
    margin-top: 6px;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 16px;
    line-height: 1.4;
    color: var(--ink-2);
  }
  .box {
    position: relative;
    margin: 10px 0 4px;
    border-radius: 24px;
    transition: transform 0.3s var(--ease-spring);
  }
  .box:not(.opened):hover {
    transform: scale(1.04) rotate(-1deg);
  }
  .box:disabled {
    cursor: default;
  }
  .loot {
    position: absolute;
    left: 50%;
    top: 30px;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    white-space: nowrap;
  }
  .loot span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 30px;
    padding: 0 12px;
    border-radius: 99px;
    font-weight: 900;
    font-size: 15px;
    box-shadow: var(--shadow);
  }
  .gold {
    background: var(--gold-soft);
    color: color-mix(in srgb, var(--gold) 80%, var(--ink));
  }
  .xp {
    background: var(--accent-soft);
    color: var(--accent-text);
  }
  .week {
    list-style: none;
    margin: 6px 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 5px;
    width: 100%;
  }
  .week li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 7px 2px;
    border-radius: 12px;
    background: var(--surface-2);
    border: 1px solid var(--line);
    font-size: 10.5px;
    font-weight: 800;
    color: var(--ink-3);
  }
  .week li.big {
    background: var(--gold-soft);
  }
  .week li.today {
    border-color: var(--accent);
    background: var(--accent-softer);
    color: var(--ink);
    transform: translateY(-2px);
  }
  .week li.past {
    opacity: 0.6;
  }
  .week .r {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 11.5px;
    color: var(--ink-2);
  }
  .week li.past .r {
    color: var(--success);
  }
  .path {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    margin-top: 14px;
    font-size: 13px;
    font-weight: 750;
    color: var(--ink-3);
  }
  .pday {
    color: var(--ink-2);
    font-weight: 800;
  }
  .next {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .thumb {
    width: 40px;
    flex: none;
  }
  .thumb :global(.thumb) {
    border-radius: 10px;
  }
  .actions {
    display: flex;
    gap: 8px;
    margin-top: 18px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--gold);
    box-shadow: 0 0 0 3px var(--gold-soft);
  }
  .tease {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 10px;
    font-size: 11.5px;
    font-weight: 800;
    color: var(--accent-text);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
</style>
