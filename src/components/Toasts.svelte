<script lang="ts">
  import { flip } from 'svelte/animate';
  import { fx } from '../lib/fx.svelte';
  import { d } from '../lib/motion';
  import { cubicOut, backOut } from 'svelte/easing';
  import Icon from './Icon.svelte';

  function enter(_n: Element) {
    return {
      duration: d(420),
      easing: backOut,
      css: (t: number, u: number) => `opacity:${Math.min(1, t * 2)};transform:translateY(${u * 18}px) scale(${0.94 + 0.06 * t})`,
    };
  }
  function leave(_n: Element) {
    return {
      duration: d(220),
      easing: cubicOut,
      css: (t: number, u: number) => `opacity:${t};transform:translateX(${u * 24}px) scale(${0.98 + 0.02 * t})`,
    };
  }

  const ICON: Record<string, string> = {
    info: 'info',
    success: 'check',
    xp: 'spark',
    gold: 'coin',
    achievement: 'trophy',
    reminder: 'bell',
    warn: 'alert',
  };
</script>

<div class="toasts" aria-live="polite">
  {#each fx.toasts as toast (toast.id)}
    <div class="toast {toast.kind}" in:enter out:leave animate:flip={{ duration: d(260) }}>
      <span class="badge"><Icon name={toast.icon ?? ICON[toast.kind]} size={18} /></span>
      <div class="text">
        <strong>{toast.title}</strong>
        {#if toast.body}<span>{toast.body}</span>{/if}
      </div>
      {#if toast.action}
        <button
          class="act"
          onclick={() => {
            toast.action?.run();
            fx.dismiss(toast.id);
          }}>{toast.action.label}</button
        >
      {/if}
      <button class="close" aria-label="×" onclick={() => fx.dismiss(toast.id)}><Icon name="x" size={14} /></button>
    </div>
  {/each}
</div>

<style>
  .toasts {
    position: fixed;
    right: 22px;
    bottom: 22px;
    z-index: 200;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    pointer-events: none;
    max-width: min(420px, calc(100vw - 44px));
  }
  .toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 280px;
    padding: 12px 10px 12px 12px;
    border-radius: 16px;
    background: var(--surface);
    border: 1px solid var(--line);
    box-shadow: var(--shadow-lg);
  }
  .badge {
    flex: none;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 11px;
    background: var(--surface-3);
    color: var(--ink-2);
  }
  .success .badge {
    background: var(--success-soft);
    color: var(--success);
  }
  .xp .badge,
  .achievement .badge,
  .gold .badge {
    background: var(--gold-soft);
    color: var(--gold);
  }
  .reminder .badge {
    background: var(--accent-soft);
    color: var(--accent-text);
  }
  .warn .badge {
    background: var(--danger-soft);
    color: var(--danger);
  }
  .info .badge {
    background: var(--info-soft);
    color: var(--info);
  }
  .achievement {
    border-color: color-mix(in srgb, var(--gold) 40%, var(--line));
  }
  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }
  .text strong {
    font-weight: 800;
    font-size: 14px;
    line-height: 1.3;
  }
  .text span {
    color: var(--ink-3);
    font-size: 13px;
    line-height: 1.35;
  }
  .act {
    flex: none;
    height: 30px;
    padding: 0 12px;
    border-radius: 9px;
    background: var(--accent-soft);
    color: var(--accent-text);
    font-weight: 800;
    font-size: 13px;
    transition: background-color 0.15s;
  }
  .act:hover {
    background: color-mix(in srgb, var(--accent-soft) 75%, var(--accent));
  }
  .close {
    flex: none;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 8px;
    color: var(--ink-4);
  }
  .close:hover {
    background: var(--hover);
    color: var(--ink-2);
  }
</style>
