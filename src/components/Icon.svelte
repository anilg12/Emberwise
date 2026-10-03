<script lang="ts">
  import { ICONS, FILLED } from '../lib/icons';

  let {
    name,
    size = 20,
    stroke = 1.8,
    class: cls = '',
  }: { name: string; size?: number; stroke?: number; class?: string } = $props();

  const filled = $derived(FILLED.has(name));
</script>

<svg
  class="icon {cls}"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill={filled ? 'currentColor' : 'none'}
  stroke={filled ? 'none' : 'currentColor'}
  stroke-width={stroke}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
>
  {@html ICONS[name] ?? ICONS.spark}
</svg>

<style>
  .icon {
    flex: none;
    display: block;
  }
</style>
