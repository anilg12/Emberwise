<script lang="ts">
  import { fade } from 'svelte/transition';
  import { fx } from '../lib/fx.svelte';
  import { store } from '../lib/state.svelte';
  import { t } from '../lib/i18n.svelte';
  import { rankFor } from '../lib/game';
  import { burst } from '../lib/confetti';
  import { d, pop, rise } from '../lib/motion';
  import { pickQuote } from '../lib/motivation';
  import Avatar from './Avatar.svelte';

  const current = $derived(fx.celebrations[0]);
  const rank = $derived(current ? rankFor(current.level) : null);

  $effect(() => {
    if (!current) return;
    const id = setTimeout(() => {
      if (!store.reducedMotion) {
        burst({ y: window.innerHeight * 0.38, count: 120 });
        setTimeout(() => burst({ x: window.innerWidth * 0.3, y: window.innerHeight * 0.5, count: 50, spread: 0.7 }), 260);
        setTimeout(() => burst({ x: window.innerWidth * 0.7, y: window.innerHeight * 0.5, count: 50, spread: 0.7 }), 420);
      }
    }, 180);
    return () => clearTimeout(id);
  });

  function close() {
    fx.closeCelebration();
  }

  function onkeydown(e: KeyboardEvent) {
    if (current && (e.key === 'Escape' || e.key === 'Enter')) {
      e.preventDefault();
      close();
    }
  }
  // A fresh line for every celebration.
  const words = $derived(current ? pickQuote('level', store.data.profile.name, false).text : '');
</script>

<svelte:window {onkeydown} />

{#if current && rank}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="overlay" transition:fade={{ duration: d(260) }} onclick={close}>
    <div class="card" role="dialog" aria-modal="true" aria-label={t('level.up')} in:pop={{ duration: 520, from: 0.82 }}>
      <div class="rays" aria-hidden="true"></div>
      <div class="stage" style="--rank:{rank.color};--glow:{rank.glow}">
        <Avatar
          look={store.data.profile.look}
          hat={store.data.equipped.hat}
          acc={store.data.equipped.acc}
          level={current.level}
          size={150}
          crop="bust"
        />
      </div>
      <p class="eyebrow" in:rise={{ delay: 160 }}>{t('level.up')}</p>
      <h2 in:rise={{ delay: 220 }}>{t('level.reached', { n: current.level })}</h2>
      {#if current.rankChanged}
        <div class="rank" style="--rank:{rank.color}" in:pop={{ delay: 420 }}>
          <span>{t('level.rankUp')}</span>
          <strong>{t(`ranks.${rank.id}`)}</strong>
        </div>
        <p class="desc" in:rise={{ delay: 480 }}>{t(`rankDesc.${rank.id}`)}</p>
      {:else}
        <p class="desc" in:rise={{ delay: 300 }}>{words}</p>
      {/if}
      <button class="btn primary lg" onclick={close} in:rise={{ delay: 360 }}>{t('level.continue')}</button>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 400;
    display: grid;
    place-items: center;
    background: var(--scrim);
    backdrop-filter: blur(3px);
  }
  .card {
    position: relative;
    width: min(400px, calc(100vw - 48px));
    padding: 28px 28px 26px;
    border-radius: 28px;
    background: var(--surface);
    border: 1px solid var(--line);
    box-shadow: var(--shadow-lg);
    text-align: center;
    overflow: hidden;
  }
  .rays {
    position: absolute;
    left: 50%;
    top: 92px;
    width: 520px;
    height: 520px;
    margin: -260px 0 0 -260px;
    background: repeating-conic-gradient(from 0deg, color-mix(in srgb, var(--xp) 18%, transparent) 0deg 10deg, transparent 10deg 24deg);
    mask-image: radial-gradient(circle, #000 20%, transparent 62%);
    animation: spin 26s linear infinite;
    pointer-events: none;
  }
  .stage {
    position: relative;
    display: grid;
    place-items: center;
    width: 172px;
    height: 172px;
    margin: 0 auto 10px;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 60%, color-mix(in srgb, var(--glow) 55%, var(--surface)), var(--surface-2) 70%);
    border: 3px solid color-mix(in srgb, var(--rank) 60%, transparent);
    overflow: hidden;
  }
  .stage :global(svg) {
    margin-top: 26px;
  }
  .eyebrow {
    position: relative;
    color: var(--xp);
    font-weight: 900;
  }
  h2 {
    position: relative;
    font-size: 30px;
    margin: 4px 0 8px;
  }
  .rank {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px 6px 12px;
    border-radius: 99px;
    background: color-mix(in srgb, var(--rank) 14%, var(--surface));
    border: 1px solid color-mix(in srgb, var(--rank) 40%, transparent);
    margin-bottom: 8px;
  }
  .rank span {
    font-size: 12px;
    font-weight: 800;
    color: var(--ink-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .rank strong {
    font-family: var(--font-display);
    font-size: 18px;
    color: var(--rank);
  }
  .desc {
    position: relative;
    color: var(--ink-2);
    margin-bottom: 20px;
  }
  .btn {
    position: relative;
    min-width: 180px;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
