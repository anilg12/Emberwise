<script lang="ts">
  import { store } from '../lib/state.svelte';
  import { timer, type Phase } from '../lib/timer.svelte';
  import { t, tv } from '../lib/i18n.svelte';
  import { focusReward } from '../lib/game';
  import { playAmbient, stopAmbient } from '../lib/ambient';
  import { fx } from '../lib/fx.svelte';
  import { sfx } from '../lib/sound';
  import { rise } from '../lib/motion';
  import type { AmbientKind } from '../lib/types';
  import Icon from '../components/Icon.svelte';
  import Ember from '../components/Ember.svelte';
  import Segmented from '../components/Segmented.svelte';

  const R = 132;
  const C = 2 * Math.PI * R;

  let confirmStop = $state(false);
  let pickerOpen = $state(false);
  let previewTimer: ReturnType<typeof setTimeout> | null = null;

  const phaseOptions = $derived([
    { value: 'focus' as Phase, label: t('focus.phase.focus') },
    { value: 'short' as Phase, label: t('focus.phase.short') },
    { value: 'long' as Phase, label: t('focus.phase.long') },
  ]);
  const AMBIENT: { id: AmbientKind; icon: string }[] = [
    { id: 'off', icon: 'mute' },
    { id: 'rain', icon: 'drop' },
    { id: 'fire', icon: 'flame' },
    { id: 'waves', icon: 'wave' },
    { id: 'wind', icon: 'wind' },
    { id: 'brown', icon: 'volume' },
  ];

  const digits = $derived(timer.clock.split(''));
  const linked = $derived(store.task(timer.taskId));
  const isBreak = $derived(timer.phase !== 'focus');
  const sessionNo = $derived((timer.cycle % store.data.settings.longEvery) + 1);
  const untilLong = $derived(store.data.settings.longEvery - (timer.cycle % store.data.settings.longEvery));
  const reward = $derived(focusReward(Math.round(timer.totalMs / 60000), true));
  const openTasks = $derived(store.todayTasks.open);
  const tip = $derived.by(() => {
    const tips = tv<string[]>('focus.emberSays');
    return tips[(timer.cycle + new Date(store.clock).getHours()) % tips.length];
  });
  // Ember grows brighter as the session goes on.
  const emberScale = $derived(timer.phase === 'focus' && timer.status !== 'idle' ? 0.82 + timer.progress * 0.32 : 0.92);

  function primary() {
    confirmStop = false;
    timer.toggle();
  }

  function stop() {
    if (timer.phase !== 'focus') {
      timer.skipBreak();
      return;
    }
    if (!confirmStop) {
      confirmStop = true;
      setTimeout(() => (confirmStop = false), 4000);
      return;
    }
    confirmStop = false;
    const r = timer.finishEarly();
    if (r && r.xp > 0) {
      sfx.complete();
      fx.toast({ kind: 'success', icon: 'flame', title: t('focus.stopped', { xp: r.xp }) });
    }
  }

  function chooseAmbient(kind: AmbientKind) {
    store.setSetting('ambient', kind);
    // Give a short taste when nothing is running yet.
    if (timer.status !== 'running' || timer.phase !== 'focus') {
      if (previewTimer) clearTimeout(previewTimer);
      if (kind === 'off') stopAmbient();
      else {
        playAmbient(kind);
        previewTimer = setTimeout(() => {
          if (timer.status !== 'running' || timer.phase !== 'focus') stopAmbient();
        }, 3500);
      }
    }
  }

  $effect(() => {
    return () => {
      if (previewTimer) clearTimeout(previewTimer);
      if (timer.status !== 'running' || timer.phase !== 'focus') stopAmbient();
    };
  });
</script>

<div class="page">
  <header class="page-head" in:rise>
    <div>
      <h1>{t('focus.title')}</h1>
      <p>{t('focus.subtitle')}</p>
    </div>
    <div class="today-stats">
      <div><b class="num">{store.todayFocusMin}</b><span>{t('focus.todayMin')}</span></div>
      <div><b class="num">{store.todaySessions}</b><span>{t('focus.todaySessions')}</span></div>
      <div><b class="num">{store.streakNow}</b><span>{t('focus.streak')}</span></div>
    </div>
  </header>

  <div class="layout">
    <section class="card timer-card" class:break={isBreak} class:running={timer.status === 'running'}>
      <div class="phases" class:locked={timer.status !== 'idle'}>
        <Segmented
          options={phaseOptions}
          value={timer.phase}
          onchange={(p) => timer.setPhase(p)}
          size="sm"
        />
      </div>

      <div class="dial">
        <svg class="ring" viewBox="0 0 300 300" aria-hidden="true">
          <circle class="track" cx="150" cy="150" r={R} />
          <circle
            class="progress"
            cx="150"
            cy="150"
            r={R}
            stroke-dasharray={C}
            stroke-dashoffset={C * (1 - timer.progress)}
            transform="rotate(-90 150 150)"
          />
          {#each Array.from({ length: 60 }) as _, i}
            <line
              class="tick"
              class:major={i % 5 === 0}
              x1="150"
              y1={150 - R + 14}
              x2="150"
              y2={150 - R + (i % 5 === 0 ? 22 : 18)}
              transform="rotate({i * 6} 150 150)"
            />
          {/each}
        </svg>
        <div class="center">
          <div class="ember" style="transform:scale({emberScale})">
            <Ember size={78} mood={isBreak ? 'sleepy' : timer.status === 'running' ? 'calm' : 'happy'} />
          </div>
          <div class="time" aria-live="off">
            {#each digits as ch, i (i)}
              <span class:colon={ch === ':'}>{ch}</span>
            {/each}
          </div>
          <p class="phase-label">
            {#if isBreak}
              <Icon name="coffee" size={15} /> {t(`focus.phase.${timer.phase}`)}
            {:else}
              {t('focus.session', { n: sessionNo })} · {t('focus.untilLong', { n: untilLong })}
            {/if}
          </p>
        </div>
      </div>

      <div class="controls">
        <button class="ctl ghost" onclick={() => timer.reset()} disabled={timer.status === 'idle'} title={t('focus.reset')} aria-label={t('focus.reset')}>
          <Icon name="reset" size={20} />
        </button>
        <button class="ctl main" onclick={primary} aria-label={timer.status === 'running' ? t('focus.pause') : t('focus.start')}>
          {#key timer.status === 'running'}
            <span class="ic"><Icon name={timer.status === 'running' ? 'pause' : 'play'} size={26} /></span>
          {/key}
          <span>{timer.status === 'running' ? t('focus.pause') : timer.status === 'paused' ? t('focus.resume') : t('focus.start')}</span>
        </button>
        <button
          class="ctl ghost"
          class:confirm={confirmStop}
          onclick={stop}
          disabled={timer.status === 'idle' && !isBreak}
          title={isBreak ? t('focus.skip') : t('focus.stop')}
          aria-label={isBreak ? t('focus.skip') : t('focus.stop')}
        >
          <Icon name={isBreak ? 'skip' : 'stop'} size={20} />
        </button>
      </div>
      {#if confirmStop}
        <p class="confirm-text" in:rise={{ y: 4 }}>
          {timer.elapsedMin >= 5 ? t('focus.stopConfirm', { m: Math.floor(timer.elapsedMin) }) : t('focus.stopConfirmShort')}
        </p>
      {:else if !isBreak}
        <p class="reward-text"><Icon name="spark" size={14} /> {t('focus.reward', reward)}</p>
      {:else}
        <p class="reward-text">{tip}</p>
      {/if}
    </section>

    <aside class="side">
      <section class="card panel">
        <p class="eyebrow">{t('focus.linkTask')}</p>
        <button class="task-pick" onclick={() => (pickerOpen = !pickerOpen)}>
          <span class="tp-icon"><Icon name={linked ? 'target' : 'spark'} size={17} /></span>
          <span class="tp-title">{linked ? linked.title : t('focus.freeFocus')}</span>
          <span class="chev" class:open={pickerOpen}><Icon name="down" size={15} /></span>
        </button>
        {#if pickerOpen}
          <ul class="picker" in:rise={{ y: -4, duration: 200 }}>
            <li>
              <button class:sel={!timer.taskId} onclick={() => { timer.setTask(null); pickerOpen = false; }}>
                <Icon name="spark" size={15} />{t('focus.freeFocus')}
              </button>
            </li>
            {#each openTasks as task (task.id)}
              <li>
                <button class:sel={timer.taskId === task.id} onclick={() => { timer.setTask(task.id); pickerOpen = false; }}>
                  <Icon name="target" size={15} /><span>{task.title}</span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <section class="card panel">
        <p class="eyebrow">{t('focus.ambient')}</p>
        <div class="ambient">
          {#each AMBIENT as a (a.id)}
            <button class="amb" class:on={store.data.settings.ambient === a.id} onclick={() => chooseAmbient(a.id)}>
              <Icon name={a.icon} size={19} />
              <span>{t(`focus.sounds.${a.id}`)}</span>
            </button>
          {/each}
        </div>
        <label class="vol" class:dim={store.data.settings.ambient === 'off'}>
          <Icon name="volume" size={16} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={store.data.settings.ambientVolume}
            style="--p:{store.data.settings.ambientVolume * 100}%"
            oninput={(e) => store.setSetting('ambientVolume', Number((e.currentTarget as HTMLInputElement).value))}
            aria-label={t('focus.volume')}
          />
        </label>
      </section>

      <section class="card panel tip-card">
        <Ember size={36} mood="happy" glow={false} animate={false} />
        <p>{tip}</p>
      </section>
      <p class="kb"><span class="kbd">Space</span> {t('focus.shortcut').split(':')[1] ?? ''}</p>
    </aside>
  </div>
</div>

<style>
  .today-stats {
    display: flex;
    gap: 8px;
  }
  .today-stats div {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 74px;
    padding: 8px 12px;
    border-radius: 14px;
    background: var(--surface);
    border: 1px solid var(--line);
    box-shadow: var(--shadow-sm);
  }
  .today-stats b {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 650;
    line-height: 1.1;
  }
  .today-stats span {
    font-size: 11.5px;
    font-weight: 700;
    color: var(--ink-3);
    white-space: nowrap;
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 18px;
    align-items: start;
  }
  .timer-card {
    --ring: var(--accent);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 22px 24px 24px;
    background:
      radial-gradient(circle at 50% 46%, var(--accent-softer), transparent 60%),
      var(--surface);
  }
  .timer-card.break {
    --ring: var(--success);
    background:
      radial-gradient(circle at 50% 46%, var(--success-soft), transparent 60%),
      var(--surface);
  }
  .phases {
    transition: opacity 0.25s;
  }
  .phases.locked {
    opacity: 0.55;
    pointer-events: none;
  }
  .dial {
    position: relative;
    width: min(340px, 100%);
    aspect-ratio: 1;
    margin: 18px 0 14px;
  }
  .ring {
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .track {
    fill: none;
    stroke: var(--surface-3);
    stroke-width: 14;
  }
  .progress {
    fill: none;
    stroke: var(--ring);
    stroke-width: 14;
    stroke-linecap: round;
    transition: stroke-dashoffset 1s linear, stroke 0.4s;
    filter: drop-shadow(0 4px 10px color-mix(in srgb, var(--ring) 40%, transparent));
  }
  .tick {
    stroke: var(--line-2);
    stroke-width: 1.5;
    stroke-linecap: round;
  }
  .tick.major {
    stroke: var(--ink-4);
    stroke-width: 2;
  }
  .center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }
  .ember {
    margin-bottom: -2px;
    transition: transform 1s var(--ease-out);
    transform-origin: 50% 90%;
  }
  .time {
    display: flex;
    font-family: var(--font-display);
    font-size: 64px;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1;
    font-variation-settings: 'SOFT' 100, 'opsz' 72;
  }
  .time span {
    display: inline-block;
    width: 0.6em;
    text-align: center;
  }
  .time .colon {
    width: 0.3em;
    margin-top: -0.06em;
    color: var(--ink-3);
  }
  .running .time .colon {
    animation: blink-colon 1s steps(2, start) infinite;
  }
  @keyframes blink-colon {
    to {
      opacity: 0.25;
    }
  }
  .phase-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: var(--ink-3);
    margin-top: 8px;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .ctl {
    display: grid;
    place-items: center;
    border-radius: 50%;
    transition:
      transform 0.25s var(--ease-spring),
      background-color 0.2s,
      color 0.2s,
      box-shadow 0.2s;
  }
  .ctl.ghost {
    width: 52px;
    height: 52px;
    background: var(--surface-2);
    border: 1px solid var(--line);
    color: var(--ink-2);
  }
  .ctl.ghost:hover:not(:disabled) {
    background: var(--surface-3);
    color: var(--ink);
    transform: scale(1.05);
  }
  .ctl.ghost:disabled {
    opacity: 0.4;
  }
  .ctl.confirm {
    background: var(--danger-soft);
    color: var(--danger);
    border-color: transparent;
  }
  .ctl.main {
    display: inline-flex;
    gap: 10px;
    height: 64px;
    min-width: 190px;
    padding: 0 28px 0 22px;
    border-radius: 99px;
    background: var(--ring);
    color: #fff;
    font-weight: 800;
    font-size: 17px;
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.25) inset,
      0 12px 26px -10px color-mix(in srgb, var(--ring) 80%, transparent);
  }
  .ctl.main:hover {
    transform: translateY(-1px) scale(1.02);
  }
  .ctl.main:active {
    transform: scale(0.97);
  }
  .ic {
    display: grid;
    animation: ic-in 0.35s var(--ease-spring);
  }
  @keyframes ic-in {
    from {
      transform: scale(0.4) rotate(-30deg);
      opacity: 0;
    }
  }
  .reward-text,
  .confirm-text {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 16px;
    font-size: 13px;
    font-weight: 700;
    color: var(--ink-3);
    text-align: center;
  }
  .confirm-text {
    color: var(--danger);
  }

  .side {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .panel {
    padding: 16px;
  }
  .panel .eyebrow {
    margin-bottom: 10px;
  }
  .task-pick {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--surface-2);
    border: 1px solid var(--line);
    text-align: left;
    font-weight: 700;
    transition: border-color 0.16s;
  }
  .task-pick:hover {
    border-color: var(--line-2);
  }
  .tp-icon {
    color: var(--accent);
    display: grid;
  }
  .tp-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .chev {
    display: grid;
    color: var(--ink-3);
    transition: transform 0.25s var(--ease-out);
  }
  .chev.open {
    transform: rotate(180deg);
  }
  .picker {
    list-style: none;
    margin: 8px 0 0;
    padding: 4px;
    max-height: 220px;
    overflow: auto;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: var(--surface);
  }
  .picker button {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
    border-radius: 9px;
    text-align: left;
    font-weight: 650;
    font-size: 13.5px;
    color: var(--ink-2);
  }
  .picker button span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .picker button:hover {
    background: var(--hover);
  }
  .picker button.sel {
    background: var(--accent-soft);
    color: var(--accent-text);
  }
  .ambient {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  .amb {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 4px 8px;
    border-radius: 12px;
    background: var(--surface-2);
    border: 1px solid var(--line);
    color: var(--ink-3);
    font-size: 11.5px;
    font-weight: 750;
    transition: all 0.18s var(--ease-out);
  }
  .amb:hover {
    color: var(--ink);
    border-color: var(--line-2);
  }
  .amb.on {
    background: var(--accent-soft);
    border-color: color-mix(in srgb, var(--accent) 40%, transparent);
    color: var(--accent-text);
  }
  .vol {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
    color: var(--ink-3);
    transition: opacity 0.2s;
  }
  .vol.dim {
    opacity: 0.45;
  }
  input[type='range'] {
    flex: 1;
  }
  .tip-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--accent-softer);
    border-color: transparent;
    box-shadow: none;
  }
  .tip-card p {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 14.5px;
    color: var(--ink-2);
    line-height: 1.35;
  }
  .kb {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
    color: var(--ink-3);
    font-weight: 700;
    padding-left: 4px;
  }
  @media (max-width: 1100px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }
</style>
