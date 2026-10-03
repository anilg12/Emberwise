<script lang="ts" generics="T extends string | number">
  import Icon from './Icon.svelte';

  let {
    options,
    value,
    onchange,
    size = 'md',
    full = false,
    label = '',
  }: {
    options: { value: T; label: string; icon?: string; hint?: string }[];
    value: T;
    onchange: (v: T) => void;
    size?: 'sm' | 'md';
    full?: boolean;
    label?: string;
  } = $props();

  const index = $derived(Math.max(0, options.findIndex((o) => o.value === value)));

  function onkeydown(e: KeyboardEvent) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const next = options[(index + dir + options.length) % options.length];
    onchange(next.value);
  }
</script>

<div
  class="seg {size}"
  class:full
  role="radiogroup"
  aria-label={label}
  tabindex="0"
  {onkeydown}
  style="--n:{options.length};--i:{index}"
>
  <span class="thumb" aria-hidden="true"></span>
  {#each options as o (o.value)}
    <button
      type="button"
      role="radio"
      aria-checked={o.value === value}
      class:active={o.value === value}
      tabindex="-1"
      title={o.hint ?? ''}
      onclick={() => onchange(o.value)}
    >
      {#if o.icon}<Icon name={o.icon} size={size === 'sm' ? 15 : 16} />{/if}
      <span>{o.label}</span>
    </button>
  {/each}
</div>

<style>
  .seg {
    position: relative;
    display: inline-grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    padding: 3px;
    border-radius: 13px;
    background: var(--surface-3);
    border: 1px solid var(--line);
    isolation: isolate;
  }
  .seg.full {
    display: grid;
    width: 100%;
  }
  .thumb {
    position: absolute;
    z-index: -1;
    top: 3px;
    bottom: 3px;
    left: 3px;
    width: calc((100% - 6px) / var(--n));
    transform: translateX(calc(100% * var(--i)));
    border-radius: 10px;
    background: var(--surface);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.08),
      0 2px 8px -2px rgba(0, 0, 0, 0.1);
    transition: transform 0.32s var(--ease-out);
  }
  :global(html.dark) .thumb {
    background: var(--line-2);
  }
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    height: 34px;
    padding: 0 14px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 13.5px;
    color: var(--ink-3);
    transition: color 0.2s;
    white-space: nowrap;
    min-width: 0;
  }
  button span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sm button {
    height: 28px;
    padding: 0 10px;
    font-size: 12.5px;
  }
  button:hover {
    color: var(--ink-2);
  }
  button.active {
    color: var(--ink);
  }
</style>
