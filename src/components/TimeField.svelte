<script lang="ts">
  // Hour and minute spinners — scroll, arrow keys, or just type the digits.
  import Icon from './Icon.svelte';

  let { value, onchange, disabled = false }: { value: string; onchange: (v: string) => void; disabled?: boolean } = $props();

  const pad = (n: number) => String(n).padStart(2, '0');
  const h = $derived(Number(value.split(':')[0]) || 0);
  const m = $derived(Number(value.split(':')[1]) || 0);

  let buffer = '';
  let bufferTimer: ReturnType<typeof setTimeout> | null = null;

  function set(nh: number, nm: number) {
    nh = ((nh % 24) + 24) % 24;
    nm = ((nm % 60) + 60) % 60;
    onchange(`${pad(nh)}:${pad(nm)}`);
  }

  function step(part: 'h' | 'm', dir: number, big = false) {
    if (part === 'h') set(h + dir, m);
    else {
      const s = big ? 15 : 5;
      // Snap to the step grid first so 14:07 → 14:10, then move.
      const snapped = dir > 0 ? Math.floor(m / s) * s + s : Math.ceil(m / s) * s - s;
      set(h, snapped >= 60 ? 0 : snapped < 0 ? 60 - s : snapped);
    }
  }

  function key(part: 'h' | 'm', e: KeyboardEvent) {
    if (disabled) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const dir = e.key === 'ArrowUp' ? 1 : -1;
      if (part === 'm' && !e.shiftKey) set(h, m + dir);
      else step(part, dir, e.shiftKey);
      return;
    }
    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      buffer = (buffer + e.key).slice(-2);
      if (bufferTimer) clearTimeout(bufferTimer);
      bufferTimer = setTimeout(() => (buffer = ''), 1200);
      const n = Number(buffer);
      if (part === 'h') set(Math.min(23, n), m);
      else set(h, Math.min(59, n));
      if (buffer.length === 2 && part === 'h') {
        const next = (e.currentTarget as HTMLElement).parentElement?.querySelector<HTMLElement>('[data-part="m"]');
        buffer = '';
        next?.focus();
      }
    }
  }

  function wheel(part: 'h' | 'm', e: WheelEvent) {
    if (disabled) return;
    e.preventDefault();
    step(part, e.deltaY < 0 ? 1 : -1);
  }
</script>

<div class="tf" class:disabled>
  {#each ['h', 'm'] as const as part (part)}
    {#if part === 'm'}<span class="colon">:</span>{/if}
    <div class="seg">
      <button class="arrow" tabindex="-1" {disabled} onclick={() => step(part, 1)} aria-hidden="true"><Icon name="up" size={14} /></button>
      <div
        class="val"
        role="spinbutton"
        tabindex={disabled ? -1 : 0}
        data-part={part}
        aria-valuenow={part === 'h' ? h : m}
        aria-valuemin={0}
        aria-valuemax={part === 'h' ? 23 : 59}
        onkeydown={(e) => key(part, e)}
        onwheel={(e) => wheel(part, e)}
        onblur={() => (buffer = '')}
      >
        {pad(part === 'h' ? h : m)}
      </div>
      <button class="arrow" tabindex="-1" {disabled} onclick={() => step(part, -1)} aria-hidden="true"><Icon name="down" size={14} /></button>
    </div>
  {/each}
</div>

<style>
  .tf {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 6px;
    border-radius: 14px;
    background: var(--surface-2);
    border: 1px solid var(--line-2);
  }
  .tf.disabled {
    opacity: 0.45;
    pointer-events: none;
  }
  .seg {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .arrow {
    display: grid;
    place-items: center;
    width: 40px;
    height: 18px;
    border-radius: 6px;
    color: var(--ink-4);
    transition: color 0.15s, background-color 0.15s;
  }
  .arrow:hover {
    color: var(--ink);
    background: var(--hover);
  }
  .val {
    width: 52px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    font-family: var(--font-display);
    font-size: 26px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    cursor: ns-resize;
    transition: background-color 0.15s, box-shadow 0.15s;
  }
  .val:hover {
    background: var(--hover);
  }
  .val:focus-visible {
    background: var(--accent-soft);
    color: var(--accent-text);
    box-shadow: none;
  }
  .colon {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 700;
    color: var(--ink-3);
    margin-top: -2px;
  }
</style>
