<script lang="ts">
  import type { Rank } from '../lib/game';
  import { ICONS } from '../lib/icons';

  let { rank, size = 44, locked = false }: { rank: Rank; size?: number; locked?: boolean } = $props();

  const SYMBOL: Record<Rank['id'], string> = {
    novice: 'spark',
    diligent: 'flame',
    master: 'sword',
    legend: 'crown',
    mythic: 'gem',
    immortal: 'sun',
  };
  const id = `rb${Math.random().toString(36).slice(2, 8)}`;
</script>

<svg width={size} height={size * 1.1} viewBox="0 0 40 44" class:locked aria-hidden="true">
  <defs>
    <linearGradient id="{id}-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color={rank.glow} />
      <stop offset="1" stop-color={rank.color} />
    </linearGradient>
  </defs>
  <path d="M20 2 L36 8 V20 C36 31 29 38.5 20 42 C11 38.5 4 31 4 20 V8 Z" fill="url(#{id}-g)" />
  <path d="M20 2 L36 8 V20 C36 31 29 38.5 20 42 C11 38.5 4 31 4 20 V8 Z" fill="none" stroke="#000" stroke-opacity="0.12" stroke-width="1.5" />
  <path d="M20 5.5 L33 10.4 V20 C33 29 27.4 35.4 20 38.5" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="1.5" stroke-linecap="round" />
  <g transform="translate(10.5 11) scale(0.79)" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    {@html ICONS[SYMBOL[rank.id]]}
  </g>
</svg>

<style>
  svg {
    display: block;
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.12));
    transition: filter 0.3s, opacity 0.3s;
  }
  .locked {
    filter: grayscale(1);
    opacity: 0.4;
  }
</style>
