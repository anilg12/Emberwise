<script lang="ts">
  import { store } from '../lib/state.svelte';
  import { t } from '../lib/i18n.svelte';
  import { sfx } from '../lib/sound';
  import Modal from './Modal.svelte';
  import Icon from './Icon.svelte';

  let { open, onclose }: { open: boolean; onclose: () => void } = $props();

  const ROUNDS = 4;
  const PHASES = [
    { key: 'in', secs: 4, scale: 1 },
    { key: 'hold', secs: 4, scale: 1 },
    { key: 'out', secs: 6, scale: 0.55 },
  ] as const;

  let status = $state<'idle' | 'running' | 'done'>('idle');
  let round = $state(1);
  let phase = $state(0);
  let left = $state(4);
  let timer: ReturnType<typeof setInterval> | null = null;

  const current = $derived(PHASES[phase]);
  const label = $derived(
    status === 'running' ? t(current.key === 'in' ? 'focus.breatheIn' : current.key === 'hold' ? 'focus.breatheHold' : 'focus.breatheOut') : '',
  );

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function start() {
    stop();
    status = 'running';
    round = 1;
    phase = 0;
    left = PHASES[0].secs;
    timer = setInterval(() => {
      left--;
      if (left > 0) return;
      if (phase < PHASES.length - 1) {
        phase++;
      } else if (round < ROUNDS) {
        round++;
        phase = 0;
      } else {
        stop();
        status = 'done';
        sfx.chime();
        store.recordBreath();
        return;
      }
      left = PHASES[phase].secs;
    }, 1000);
  }

  function close() {
    stop();
    status = 'idle';
    onclose();
  }

  $effect(() => {
    if (!open) stop();
    return stop;
  });
</script>

<Modal {open} onclose={close} width={420} label={t('focus.breathe')}>
  <div class="breathe">
    <h2>{t('focus.breathe')}</h2>
    <p class="hint">{t('focus.breatheHint')}</p>

    <div class="stage" class:running={status === 'running'}>
      <span
        class="ring"
        style="transform:scale({status === 'running' ? current.scale : 0.7});transition-duration:{status === 'running' ? (current.key === 'hold' ? 0.4 : current.secs) : 0.6}s"
      ></span>
      <span
        class="orb"
        style="transform:scale({status === 'running' ? current.scale : 0.7});transition-duration:{status === 'running' ? (current.key === 'hold' ? 0.4 : current.secs) : 0.6}s"
      ></span>
      <div class="center">
        {#if status === 'running'}
          <strong>{label}</strong>
          <span class="num">{left}</span>
        {:else if status === 'done'}
          <Icon name="leaf" size={30} />
        {/if}
      </div>
    </div>

    {#if status === 'running'}
      <p class="round num">{t('focus.breatheRound', { n: round, total: ROUNDS })}</p>
      <button class="btn ghost" onclick={close}>{t('common.close')}</button>
    {:else if status === 'done'}
      <p class="done">{t('focus.breatheDone')}</p>
      <div class="row">
        <button class="btn ghost" onclick={start}>{t('focus.breatheStart')}</button>
        <button class="btn primary" onclick={close}>{t('common.done')}</button>
      </div>
    {:else}
      <!-- svelte-ignore a11y_autofocus -->
      <button class="btn primary lg" onclick={start} autofocus><Icon name="play" size={15} />{t('focus.breatheStart')}</button>
    {/if}
  </div>
</Modal>

<style>
  .breathe {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 26px 24px 24px;
    text-align: center;
  }
  h2 {
    font-size: 22px;
  }
  .hint {
    color: var(--ink-3);
    font-weight: 700;
    font-size: 13.5px;
  }
  .stage {
    position: relative;
    width: 220px;
    height: 220px;
    margin: 12px 0 6px;
    display: grid;
    place-items: center;
  }
  .ring,
  .orb {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    transition-property: transform;
    transition-timing-function: cubic-bezier(0.45, 0, 0.3, 1);
    will-change: transform;
  }
  .ring {
    border: 2px solid color-mix(in srgb, var(--success) 45%, transparent);
  }
  .orb {
    inset: 18px;
    background: radial-gradient(circle at 40% 35%, color-mix(in srgb, var(--success) 35%, var(--surface)), color-mix(in srgb, var(--success) 70%, var(--surface)));
    box-shadow: 0 18px 50px -18px color-mix(in srgb, var(--success) 70%, transparent);
  }
  .center {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    color: #fff;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.18);
  }
  .center strong {
    font-family: var(--font-display);
    font-size: 21px;
    font-weight: 650;
  }
  .center span {
    font-size: 30px;
    font-weight: 800;
  }
  .round {
    font-weight: 800;
    color: var(--ink-3);
  }
  .done {
    max-width: 300px;
    font-family: var(--font-display);
    font-size: 17px;
    font-style: italic;
    color: var(--ink-2);
  }
  .row {
    display: flex;
    gap: 8px;
  }
</style>
