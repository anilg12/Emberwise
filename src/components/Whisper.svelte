<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { backOut } from 'svelte/easing';
  import { fx } from '../lib/fx.svelte';
  import { store } from '../lib/state.svelte';
  import { t } from '../lib/i18n.svelte';
  import { d } from '../lib/motion';
  import Ember from './Ember.svelte';
  import Icon from './Icon.svelte';

  const w = $derived(fx.whisper);
  const saved = $derived(!!w && store.data.favorites.includes(w.quoteId));
</script>

{#if w}
  {#key w.id}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="whisper"
      role="status"
      aria-live="polite"
      in:fly={{ y: 18, duration: d(420), easing: backOut }}
      out:fade={{ duration: d(220) }}
      onmouseenter={() => fx.hold(true)}
      onmouseleave={() => fx.hold(false)}
    >
      <span class="mascot"><Ember size={40} mood={w.mood} glow={false} /></span>
      <p>{w.text}</p>
      <div class="actions">
        <button
          class="icon-btn sm"
          class:saved
          onclick={() => store.toggleFavorite(w.quoteId)}
          title={saved ? t('today.savedWords') : t('today.saveWords')}
          aria-label={saved ? t('today.savedWords') : t('today.saveWords')}
          aria-pressed={saved}
        >
          <Icon name="heart" size={15} />
        </button>
        <button class="icon-btn sm" onclick={() => fx.hush()} aria-label={t('common.close')}><Icon name="x" size={15} /></button>
      </div>
    </div>
  {/key}
{/if}

<style>
  .whisper {
    position: fixed;
    left: calc(var(--sidebar-w) + 22px);
    bottom: 22px;
    z-index: 70;
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: min(400px, calc(100vw - var(--sidebar-w) - 360px));
    min-width: 240px;
    padding: 10px 10px 10px 8px;
    border-radius: 20px;
    background: var(--surface);
    border: 1px solid var(--line);
    box-shadow: var(--shadow-lg, var(--shadow));
  }
  .whisper::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background: radial-gradient(circle at 10% 50%, var(--accent-softer), transparent 55%);
  }
  .mascot {
    flex: none;
    display: grid;
    animation: hop 0.7s var(--ease-spring) 0.15s both;
  }
  @keyframes hop {
    from {
      transform: translateY(6px) scale(0.85);
    }
  }
  p {
    position: relative;
    z-index: 1;
    font-family: var(--font-display);
    font-size: 14.5px;
    line-height: 1.38;
    color: var(--ink-2);
  }
  .actions {
    position: relative;
    z-index: 1;
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
    align-self: flex-start;
  }
  .icon-btn.sm {
    width: 28px;
    height: 28px;
  }
  .saved {
    color: #e5484d;
  }
  .saved :global(svg path) {
    fill: currentColor;
  }
  :global(html.reduce-motion) .mascot {
    animation: none;
  }
</style>
