<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade } from 'svelte/transition';
  import { panel, d } from '../lib/motion';

  let {
    open,
    onclose,
    width = 520,
    label = '',
    children,
  }: { open: boolean; onclose: () => void; width?: number; label?: string; children: Snippet } = $props();

  let panelEl: HTMLDivElement | undefined = $state();
  let lastFocus: Element | null = null;

  $effect(() => {
    if (!open) return;
    lastFocus = document.activeElement;
    const id = requestAnimationFrame(() => {
      const target =
        panelEl?.querySelector<HTMLElement>('[autofocus]') ??
        panelEl?.querySelector<HTMLElement>('input, textarea') ??
        panelEl;
      target?.focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(id);
      if (lastFocus instanceof HTMLElement) lastFocus.focus({ preventScroll: true });
    };
  });

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onclose();
      return;
    }
    if (e.key !== 'Tab' || !panelEl) return;
    const items = [...panelEl.querySelectorAll<HTMLElement>('button, input, textarea, select, [tabindex]:not([tabindex="-1"])')].filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
    );
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-root" {onkeydown}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="scrim" transition:fade={{ duration: d(220) }} onclick={onclose}></div>
    <div
      class="panel"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      style="--w:{width}px"
      tabindex="-1"
      bind:this={panelEl}
      transition:panel
    >
      {@render children()}
    </div>
  </div>
{/if}

<style>
  .modal-root {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    padding: 56px 24px 24px;
  }
  .scrim {
    position: absolute;
    inset: 0;
    background: var(--scrim);
  }
  .panel {
    position: relative;
    display: flex;
    flex-direction: column;
    width: min(var(--w), 100%);
    max-height: calc(100vh - 80px);
    overflow: hidden;
    outline: none;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
  }
</style>
