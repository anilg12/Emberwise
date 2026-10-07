<script lang="ts" module>
  export const MOOD_COLORS = ['#8a96bf', '#7fb2c9', '#e3b95a', '#f29a4a', '#f4743b'];
</script>

<script lang="ts">
  // 5 faces, 1 = rough day ... 5 = great
  let { mood, size = 32 }: { mood: number; size?: number } = $props();

  const c = $derived(MOOD_COLORS[Math.max(0, Math.min(4, mood - 1))]);
  const mouth = $derived(
    mood === 1 ? 'M12 24.5 q6 -4.4 12 0' : mood === 2 ? 'M12.5 24 q5.5 -2 11 0' : mood === 3 ? 'M12.5 23.4 h11' : mood === 4 ? 'M12 22.4 q6 4.4 12 0' : 'M11 21.6 q7 7 14 0 z',
  );
</script>

<svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
  <circle cx="18" cy="18" r="16" fill={c} />
  <ellipse cx="13" cy="10.5" rx="5" ry="3" fill="#fff" opacity="0.22" />
  {#if mood === 1}
    <path d="M10.6 14.6 l4 1.6 M25.4 14.6 l-4 1.6" stroke="#3b3149" stroke-width="1.8" stroke-linecap="round" />
  {/if}
  {#if mood === 5}
    <path d="M10.6 16 q2.4 -3 4.8 0 M20.6 16 q2.4 -3 4.8 0" fill="none" stroke="#3b3149" stroke-width="2" stroke-linecap="round" />
  {:else}
    <ellipse cx="13" cy="17" rx="1.9" ry={mood === 2 ? 1.5 : 2.3} fill="#3b3149" />
    <ellipse cx="23" cy="17" rx="1.9" ry={mood === 2 ? 1.5 : 2.3} fill="#3b3149" />
  {/if}
  <path d={mouth} fill={mood === 5 ? '#7a2f28' : 'none'} stroke="#3b3149" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  {#if mood >= 4}
    <ellipse cx="9.6" cy="21.6" rx="2.6" ry="1.6" fill="#ff7a6b" opacity="0.45" />
    <ellipse cx="26.4" cy="21.6" rx="2.6" ry="1.6" fill="#ff7a6b" opacity="0.45" />
  {/if}
</svg>
