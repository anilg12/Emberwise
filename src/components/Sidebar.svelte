<script lang="ts">
  import { store } from '../lib/state.svelte';
  import { timer } from '../lib/timer.svelte';
  import { t, fmtNumber } from '../lib/i18n.svelte';
  import { platform, modKey } from '../lib/platform';
  import type { Route } from '../lib/types';
  import Icon from './Icon.svelte';
  import Avatar from './Avatar.svelte';
  import XPBar from './XPBar.svelte';
  import Logo from './Logo.svelte';

  const NAV: { id: Route; icon: string }[] = [
    { id: 'today', icon: 'home' },
    { id: 'quests', icon: 'scroll' },
    { id: 'focus', icon: 'flame' },
    { id: 'hero', icon: 'hero' },
    { id: 'shop', icon: 'bag' },
    { id: 'rewards', icon: 'gift' },
    { id: 'awards', icon: 'trophy' },
    { id: 'stats', icon: 'chart' },
  ];

  const index = $derived(NAV.findIndex((n) => n.id === store.route));
  const timerActive = $derived(timer.status !== 'idle');
  const openTasks = $derived(store.todayTasks.open.length);

  function toggleTheme() {
    store.setSetting('theme', store.dark ? 'light' : 'dark');
  }
</script>

<aside class="sidebar">
  <div class="top drag" class:mac={platform === 'mac'}>
    {#if platform !== 'mac'}
      <div class="brand"><Logo size={26} /><span>Emberwise</span></div>
    {/if}
  </div>
  {#if platform === 'mac'}
    <div class="brand mac-brand"><Logo size={26} /><span>Emberwise</span></div>
  {/if}

  <nav class="nav" style="--i:{index}" class:has-active={index >= 0}>
    <span class="indicator" aria-hidden="true"></span>
    {#each NAV as item, i (item.id)}
      <button
        class="nav-item"
        class:active={store.route === item.id}
        onclick={() => store.navigate(item.id)}
        title="{t(`nav.${item.id}`)} · {modKey}+{i + 1}"
      >
        <span class="nav-icon"><Icon name={item.icon} size={19} /></span>
        <span class="nav-label">{t(`nav.${item.id}`)}</span>
        {#if item.id === 'focus' && timerActive}
          <span class="pill timer" class:paused={timer.status === 'paused'}>{timer.clock}</span>
        {:else if item.id === 'quests' && openTasks > 0}
          <span class="pill">{openTasks}</span>
        {:else if item.id === 'today' && store.chestState === 'ready'}
          <span class="dot" title={t('quests.chestOpen')}></span>
        {:else if item.id === 'rewards' && store.rewardsWaiting > 0}
          <span class="pill gift" title={t('rewards.waiting', { n: store.rewardsWaiting })}>{store.rewardsWaiting}</span>
        {/if}
      </button>
    {/each}
  </nav>

  <div class="spacer"></div>

  <button class="hero-card" onclick={() => store.navigate('hero')}>
    <div class="hero-row">
      <span class="face" style="--rank:{store.rank.color}">
        <Avatar look={store.data.profile.look} hat={store.data.equipped.hat} acc={store.data.equipped.acc} level={store.lvl.level} size={44} crop="head" animate={false} decorations={false} />
      </span>
      <div class="who">
        <strong>{store.data.profile.name || '—'}</strong>
        <span><b style="color:{store.rank.color}">{t(`ranks.${store.rank.id}`)}</b> · {t('common.lv')} {store.lvl.level}</span>
      </div>
    </div>
    <XPBar progress={store.lvl.progress} height={6} shimmer={false} />
    <div class="stats">
      <span class="stat" title={t('streak.label')}><Icon name="flame" size={15} /> {store.streakNow}</span>
      <span class="stat gold" title={t('common.gold')}><Icon name="coin" size={15} /> {fmtNumber(store.gold)}</span>
      <span class="stat xp">{store.lvl.into}/{store.lvl.needed} XP</span>
    </div>
  </button>

  <div class="foot">
    <button class="icon-btn" onclick={toggleTheme} title={store.dark ? t('common.lightMode') : t('common.darkMode')} aria-label={store.dark ? t('common.lightMode') : t('common.darkMode')}>
      {#key store.dark}
        <span class="swap"><Icon name={store.dark ? 'sun' : 'moon'} size={18} /></span>
      {/key}
    </button>
    <button
      class="icon-btn"
      class:on={store.route === 'settings'}
      onclick={() => store.navigate('settings')}
      title="{t('nav.settings')} · {modKey}+,"
      aria-label={t('nav.settings')}
    >
      <Icon name="sliders" size={18} />
    </button>
    <button
      class="icon-btn info"
      onclick={() => (store.aboutOpen = true)}
      title={t('common.about')}
      aria-label={t('common.about')}
    >
      <Icon name="info" size={18} />
    </button>
  </div>
</aside>

<style>
  .sidebar {
    position: relative;
    display: flex;
    flex-direction: column;
    width: var(--sidebar-w);
    flex: none;
    height: 100%;
    padding: 0 14px 14px;
    background: var(--bg-2);
    border-right: 1px solid var(--line);
  }
  .top {
    height: var(--titlebar-h);
    flex: none;
    display: flex;
    align-items: center;
    padding: 0 6px;
  }
  .top.mac {
    height: 50px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 9px;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 18px;
    letter-spacing: -0.01em;
    margin-top: 10px;
  }
  .mac-brand {
    margin: 0 0 4px;
    padding: 0 6px;
  }
  .nav {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 22px;
  }
  .indicator {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 40px;
    border-radius: 12px;
    background: var(--surface);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--line);
    transform: translateY(calc(var(--i) * 42px));
    transition: transform 0.38s var(--ease-out), opacity 0.2s;
    opacity: 0;
  }
  .has-active .indicator {
    opacity: 1;
  }
  .nav-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 11px;
    height: 40px;
    padding: 0 10px 0 11px;
    border-radius: 12px;
    color: var(--ink-2);
    font-weight: 700;
    font-size: 14.5px;
    text-align: left;
    transition: color 0.18s, background-color 0.18s;
  }
  .nav-item:hover:not(.active) {
    background: var(--hover);
    color: var(--ink);
  }
  .nav-item.active {
    color: var(--ink);
  }
  .nav-icon {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 9px;
    color: var(--ink-3);
    transition: color 0.2s, background-color 0.2s, transform 0.3s var(--ease-spring);
  }
  .nav-item:hover .nav-icon {
    transform: scale(1.06);
  }
  .active .nav-icon {
    color: var(--accent);
    background: var(--accent-soft);
  }
  .nav-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pill {
    min-width: 22px;
    height: 20px;
    padding: 0 7px;
    border-radius: 99px;
    background: var(--surface-3);
    color: var(--ink-3);
    font-size: 11.5px;
    font-weight: 800;
    display: grid;
    place-items: center;
    font-variant-numeric: tabular-nums;
  }
  .active .pill {
    background: var(--surface-3);
  }
  .pill.timer {
    background: var(--accent);
    color: var(--accent-ink);
  }
  .pill.timer.paused {
    background: var(--surface-3);
    color: var(--ink-2);
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--gold);
    box-shadow: 0 0 0 4px var(--gold-soft);
    margin-right: 6px;
    animation: ping 1.8s ease-in-out infinite;
  }
  @keyframes ping {
    50% {
      box-shadow: 0 0 0 7px transparent;
    }
  }
  .spacer {
    flex: 1;
  }
  .hero-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border-radius: 16px;
    background: var(--surface);
    border: 1px solid var(--line);
    box-shadow: var(--shadow-sm);
    text-align: left;
    transition: transform 0.2s var(--ease-out), box-shadow 0.2s;
  }
  .hero-card:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow);
  }
  .hero-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .face {
    flex: none;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--stage);
    box-shadow: 0 0 0 2px var(--surface), 0 0 0 3.5px color-mix(in srgb, var(--rank) 70%, transparent);
  }
  .who {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .who strong {
    font-weight: 800;
    font-size: 14.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .who span {
    font-size: 12.5px;
    color: var(--ink-3);
    white-space: nowrap;
  }
  .who b {
    font-weight: 800;
  }
  .stats {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12.5px;
    font-weight: 800;
    color: var(--ink-2);
  }
  .stat {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-variant-numeric: tabular-nums;
  }
  .stat:first-child {
    color: var(--accent-text);
  }
  .stat.gold {
    color: color-mix(in srgb, var(--gold) 85%, var(--ink));
  }
  .stat.xp {
    margin-left: auto;
    color: var(--ink-3);
    font-weight: 700;
  }
  .foot {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-top: 10px;
    padding: 0 2px;
  }
  .foot .icon-btn.on {
    color: var(--accent);
    background: var(--accent-soft);
  }
  .swap {
    display: grid;
    animation: swap-in 0.45s var(--ease-spring);
  }
  @keyframes swap-in {
    from {
      transform: rotate(-90deg) scale(0.5);
      opacity: 0;
    }
  }
  .info {
    margin-left: auto;
  }
  .pill.gift {
    background: var(--gold);
    color: #3b2a12;
    animation: glint 2.4s ease-in-out infinite;
  }
  @keyframes glint {
    0%,
    100% {
      box-shadow: 0 0 0 0 var(--gold-soft);
    }
    50% {
      box-shadow: 0 0 0 5px var(--gold-soft);
    }
  }
</style>
