<script lang="ts">
  import { flip } from 'svelte/animate';
  import { store } from '../lib/state.svelte';
  import { timer } from '../lib/timer.svelte';
  import { t, fmtDate, fmtNumber, fmtDuration } from '../lib/i18n.svelte';
  import { nextRank } from '../lib/game';
  import { greetingKey } from '../lib/format';
  import { claimQuest, openChest } from '../lib/actions';
  import { msUntilMidnight } from '../lib/dates';
  import { CHEST_REWARD } from '../lib/catalog';
  import { rise, pop, d } from '../lib/motion';
  import Icon from '../components/Icon.svelte';
  import Avatar from '../components/Avatar.svelte';
  import Scene from '../components/Scene.svelte';
  import XPBar from '../components/XPBar.svelte';
  import Ember from '../components/Ember.svelte';
  import TaskItem from '../components/TaskItem.svelte';
  import QuickAdd from '../components/QuickAdd.svelte';
  import ChestArt from '../components/ChestArt.svelte';

  const QUEST_ICON: Record<string, string> = {
    tasks3: 'check',
    tasks5: 'check',
    focus25: 'flame',
    focus50: 'flame',
    focus90: 'flame',
    sessions2: 'hourglass',
    hard: 'sword',
    early: 'sunrise',
    purpose: 'quill',
    subtasks3: 'list',
    plan: 'calendar',
    habit: 'repeat',
  };

  const now = $derived(new Date(store.clock));
  const greeting = $derived(t(greetingKey(now), { name: store.data.profile.name || '…' }));
  const dateLine = $derived(fmtDate(now, { weekday: 'long', day: 'numeric', month: 'long' }));
  const next = $derived(nextRank(store.lvl.level));
  const list = $derived([
    ...store.todayTasks.open.map((task) => ({ key: task.id, task, sep: false })),
    ...(store.todayTasks.done.length ? [{ key: '__sep', task: null, sep: true }] : []),
    ...store.todayTasks.done.map((task) => ({ key: task.id, task, sep: false })),
  ]);
  const resetIn = $derived.by(() => {
    store.clock;
    const mins = Math.ceil(msUntilMidnight() / 60000);
    return fmtDuration(mins);
  });
  const focusRunning = $derived(timer.status !== 'idle' && timer.phase === 'focus');
  const linkedTask = $derived(store.task(timer.taskId));
</script>

<div class="page">
  <header class="head" in:rise>
    <div>
      <p class="date">{dateLine}</p>
      <h1>{greeting}</h1>
    </div>
    <div class="pills">
      <span class="pill streak" title={t('streak.hint')}>
        <Icon name="flame" size={17} />
        <b class="num">{store.streakNow}</b>
        <span>{t('focus.streak')}</span>
      </span>
      <span class="pill gold" title={t('common.gold')}>
        <Icon name="coin" size={17} />
        <b class="num">{fmtNumber(store.gold)}</b>
      </span>
    </div>
  </header>

  <div class="grid">
    <section class="card hero" in:rise={{ delay: 40 }}>
      <button class="stage" onclick={() => store.navigate('hero')} aria-label={t('nav.hero')}>
        <Scene id={store.data.equipped.bg} />
        <div class="figure">
          <Avatar
            look={store.data.profile.look}
            hat={store.data.equipped.hat}
            pet={store.data.equipped.pet}
            level={store.lvl.level}
            size={150}
          />
        </div>
      </button>
      <div class="info">
        <p class="eyebrow">{t('today.heroTitle')}</p>
        <h2 class="name">{store.data.profile.name}</h2>
        <div class="rank-line">
          <span class="rank" style="--rank:{store.rank.color}">
            <Icon name="shield" size={14} />{t(`ranks.${store.rank.id}`)}
          </span>
          <span class="lv">{t('common.level')} <b>{store.lvl.level}</b></span>
        </div>
        <div class="xp">
          <div class="xp-top">
            <span class="num"><b>{fmtNumber(store.lvl.into)}</b> / {fmtNumber(store.lvl.needed)} XP</span>
            <span class="muted">{t('today.xpToNext', { n: fmtNumber(store.lvl.needed - store.lvl.into) })}</span>
          </div>
          <XPBar progress={store.lvl.progress} height={12} />
        </div>
        <p class="next">
          {#if next}
            <Icon name="arrow" size={14} />
            {t('hero.nextRank', { rank: t(`ranks.${next.id}`), level: next.minLevel })}
          {:else}
            <Icon name="crown" size={14} /> {t('hero.maxRank')}
          {/if}
        </p>
      </div>
    </section>

    <section class="card focus" class:running={focusRunning} in:rise={{ delay: 80 }}>
      <div class="focus-top">
        <div class="ember-wrap">
          <Ember size={64} mood={focusRunning ? 'calm' : store.todayFocusMin > 0 ? 'happy' : 'calm'} />
        </div>
        <div>
          <p class="eyebrow">{t('today.focusTitle')}</p>
          {#if focusRunning}
            <p class="clock num">{timer.clock}</p>
          {:else}
            <p class="focus-text">
              {store.todayFocusMin > 0 ? t('today.focusToday', { m: store.todayFocusMin }) : t('today.focusNone')}
            </p>
          {/if}
        </div>
      </div>
      {#if focusRunning}
        <XPBar progress={timer.progress} height={8} tone="accent" shimmer={false} />
        {#if linkedTask}<p class="linked"><Icon name="target" size={14} /> {linkedTask.title}</p>{/if}
        <div class="focus-actions">
          <button class="btn primary" onclick={() => timer.toggle()}>
            <Icon name={timer.status === 'running' ? 'pause' : 'play'} size={16} />
            {timer.status === 'running' ? t('focus.pause') : t('focus.resume')}
          </button>
          <button class="btn ghost" onclick={() => store.navigate('focus')}>{t('today.focusOpen')}</button>
        </div>
      {:else}
        <div class="mini-stats">
          <div><b class="num">{store.todayFocusMin}</b><span>{t('focus.todayMin')}</span></div>
          <div><b class="num">{store.todaySessions}</b><span>{t('focus.todaySessions')}</span></div>
        </div>
        <div class="focus-actions">
          <button
            class="btn primary"
            onclick={() => {
              if (timer.phase !== 'focus' && timer.status === 'idle') timer.setPhase('focus');
              timer.start();
            }}
          >
            <Icon name="play" size={15} />
            {timer.phase === 'focus' ? t('today.focusStart', { m: store.data.settings.focusMin }) : t('focus.start')}
          </button>
          <button class="btn ghost" onclick={() => store.navigate('focus')}>{t('today.focusOpen')}</button>
        </div>
      {/if}
    </section>

    <section class="card tasks" in:rise={{ delay: 120 }}>
      <div class="section-title">
        <h2>{t('today.tasksTitle')}</h2>
        <div class="title-right">
          {#if store.todayTasks.open.length}
            <span class="chip">{t('today.tasksLeft', { n: store.todayTasks.open.length })}</span>
          {/if}
          <button class="btn ghost sm" onclick={() => store.navigate('quests')}>{t('today.viewAll')}<Icon name="right" size={14} /></button>
        </div>
      </div>
      <QuickAdd />
      <div class="list">
        {#each list as item (item.key)}
          <div class="item" animate:flip={{ duration: d(320) }} in:rise={{ y: 6, duration: 240 }}>
            {#if item.sep}
              <p class="sep">{t('tasks.doneToday')}</p>
            {:else if item.task}
              <TaskItem task={item.task} compact />
            {/if}
          </div>
        {/each}
      </div>
      {#if list.length === 0}
        <div class="empty">
          <Ember size={58} mood="sleepy" />
          <p>{t('tasks.empty.today')}</p>
        </div>
      {:else if store.todayTasks.open.length === 0}
        <div class="all-done" in:pop>
          <Ember size={40} mood="wow" glow={false} />
          <p>{t('today.allDone')}</p>
        </div>
      {/if}
    </section>

    <section class="card quests" in:rise={{ delay: 160 }}>
      <div class="section-title">
        <h2>{t('quests.title')}</h2>
        <span class="muted reset">{t('quests.resetIn', { time: resetIn })}</span>
      </div>
      <ul class="qlist">
        {#each store.dailyQuests as q (q.def.id)}
          <li class="quest" class:done={q.done} class:claimed={q.claimed}>
            <span class="qicon"><Icon name={QUEST_ICON[q.def.id] ?? 'star'} size={18} /></span>
            <div class="qbody">
              <p class="qtitle">{t(`quests.items.${q.def.id}`)}</p>
              <div class="qprog">
                <XPBar progress={q.value / q.def.target} height={6} tone={q.done ? 'success' : 'accent'} shimmer={false} />
                <span class="num">{q.value}/{q.def.target}</span>
              </div>
            </div>
            {#if q.claimed}
              <span class="claimed"><Icon name="check" size={15} />{t('quests.claimed')}</span>
            {:else if q.done}
              <button class="btn primary sm claim" onclick={(e) => claimQuest(q.def.id, e.currentTarget)}>{t('quests.claim')}</button>
            {:else}
              <span class="reward">+{q.def.xp} XP</span>
            {/if}
          </li>
        {/each}
      </ul>
      <div class="chest {store.chestState}">
        <ChestArt state={store.chestState} size={58} />
        <div class="chest-text">
          <strong>{t('quests.chest')}</strong>
          <span>
            {#if store.chestState === 'opened'}
              {t('quests.chestOpened')}
            {:else}
              {t('quests.chestHint')} <b>+{CHEST_REWARD.xp} XP · +{CHEST_REWARD.gold}</b>
            {/if}
          </span>
        </div>
        {#if store.chestState === 'ready'}
          <button class="btn primary sm" onclick={(e) => openChest(e.currentTarget)}><Icon name="gift" size={15} />{t('quests.chestOpen')}</button>
        {/if}
      </div>
    </section>
  </div>
</div>

<style>
  .head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 22px;
  }
  .date {
    color: var(--ink-3);
    font-weight: 700;
    font-size: 14px;
    text-transform: capitalize;
    margin-bottom: 2px;
  }
  h1 {
    font-size: 32px;
    font-weight: 650;
  }
  .pills {
    display: flex;
    gap: 8px;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 38px;
    padding: 0 14px;
    border-radius: 99px;
    background: var(--surface);
    border: 1px solid var(--line);
    box-shadow: var(--shadow-sm);
    font-size: 13px;
    font-weight: 700;
    color: var(--ink-3);
  }
  .pill b {
    font-size: 15px;
    font-weight: 900;
    color: var(--ink);
  }
  .pill.streak :global(svg) {
    color: var(--accent);
  }
  .pill.gold :global(svg) {
    color: var(--gold);
  }
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    gap: 18px;
    align-items: start;
  }
  .card {
    padding: 20px;
  }

  /* hero */
  .hero {
    display: flex;
    gap: 20px;
    padding: 14px;
    align-items: stretch;
  }
  .stage {
    position: relative;
    flex: none;
    width: 190px;
    height: 196px;
    border-radius: 16px;
    overflow: hidden;
    isolation: isolate;
    transition: transform 0.3s var(--ease-out);
  }
  .stage:hover {
    transform: scale(1.015);
  }
  .figure {
    position: absolute;
    left: 50%;
    bottom: 4px;
    transform: translateX(-50%);
  }
  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 6px 8px 6px 0;
  }
  .name {
    font-size: 26px;
    margin: 2px 0 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .rank-line {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }
  .rank {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 26px;
    padding: 0 10px;
    border-radius: 99px;
    font-size: 12.5px;
    font-weight: 800;
    color: var(--rank);
    background: color-mix(in srgb, var(--rank) 13%, transparent);
  }
  .lv {
    color: var(--ink-3);
    font-weight: 700;
    font-size: 13.5px;
  }
  .lv b {
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 17px;
  }
  .xp-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 7px;
    font-size: 13px;
    font-weight: 700;
    color: var(--ink-2);
  }
  .xp-top b {
    color: var(--ink);
    font-size: 15px;
  }
  .xp-top .muted {
    font-size: 12.5px;
  }
  .next {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
    font-size: 13px;
    font-weight: 700;
    color: var(--ink-3);
  }

  /* focus */
  .focus {
    display: flex;
    flex-direction: column;
    gap: 14px;
    background:
      radial-gradient(circle at 12% 0%, var(--accent-soft), transparent 55%),
      var(--surface);
  }
  .focus-top {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .ember-wrap {
    width: 72px;
    height: 72px;
    display: grid;
    place-items: center;
    border-radius: 20px;
    background: var(--accent-softer);
    flex: none;
  }
  .focus-text {
    font-family: var(--font-display);
    font-size: 19px;
    font-weight: 600;
    line-height: 1.25;
    margin-top: 2px;
  }
  .clock {
    font-family: var(--font-display);
    font-size: 34px;
    font-weight: 650;
    line-height: 1.1;
  }
  .linked {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: var(--ink-2);
    margin-top: -4px;
  }
  .mini-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .mini-stats div {
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--surface-2);
    border: 1px solid var(--line);
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  .mini-stats b {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 650;
  }
  .mini-stats span {
    font-size: 12.5px;
    color: var(--ink-3);
    font-weight: 700;
  }
  .focus-actions {
    display: flex;
    gap: 8px;
  }
  .focus-actions .primary {
    flex: 1;
  }

  /* tasks */
  .tasks {
    grid-row: span 2;
  }
  .title-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 14px;
  }
  .sep {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-4);
    margin: 8px 2px 0;
  }
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 26px 0 14px;
    color: var(--ink-3);
    font-weight: 700;
  }
  .all-done {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 14px;
    padding: 12px;
    border-radius: 14px;
    background: var(--success-soft);
    color: var(--success);
    font-weight: 800;
    font-size: 14px;
  }

  /* quests */
  .reset {
    font-size: 12px;
    font-weight: 700;
  }
  .qlist {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .quest {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 14px;
    background: var(--surface-2);
    border: 1px solid var(--line);
    transition: background-color 0.3s, border-color 0.3s;
  }
  .quest.done:not(.claimed) {
    border-color: color-mix(in srgb, var(--success) 40%, var(--line));
    background: color-mix(in srgb, var(--success-soft) 60%, var(--surface));
  }
  .quest.claimed {
    opacity: 0.7;
  }
  .qicon {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 11px;
    background: var(--surface);
    color: var(--accent);
    border: 1px solid var(--line);
    flex: none;
  }
  .done .qicon {
    color: var(--success);
  }
  .qbody {
    flex: 1;
    min-width: 0;
  }
  .qtitle {
    font-weight: 750;
    font-size: 13.5px;
    margin-bottom: 6px;
  }
  .qprog {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .qprog :global(.bar) {
    flex: 1;
  }
  .qprog span {
    font-size: 11.5px;
    font-weight: 800;
    color: var(--ink-3);
    min-width: 34px;
    text-align: right;
  }
  .reward {
    font-size: 12px;
    font-weight: 800;
    color: var(--xp);
    white-space: nowrap;
  }
  .claim {
    animation: nudge 2s ease-in-out infinite;
  }
  @keyframes nudge {
    0%,
    80%,
    100% {
      transform: none;
    }
    86% {
      transform: translateY(-2px);
    }
    92% {
      transform: translateY(1px);
    }
  }
  .claimed {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12.5px;
    font-weight: 800;
    color: var(--success);
  }
  .chest {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    padding: 10px 12px 10px 8px;
    border-radius: 14px;
    border: 1px dashed var(--line-2);
  }
  .chest.ready {
    border-style: solid;
    border-color: color-mix(in srgb, var(--gold) 50%, var(--line));
    background: var(--gold-soft);
  }
  .chest-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .chest-text strong {
    font-weight: 800;
    font-size: 14px;
  }
  .chest-text span {
    font-size: 12.5px;
    color: var(--ink-3);
  }
  .chest-text b {
    color: var(--gold);
  }

  @media (max-width: 1180px) {
    .grid {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
    .hero {
      grid-column: span 2;
    }
    .tasks {
      grid-row: auto;
    }
  }
</style>
