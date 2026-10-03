<script lang="ts">
  let {
    progress,
    height = 10,
    tone = 'xp',
    shimmer = true,
  }: { progress: number; height?: number; tone?: 'xp' | 'accent' | 'success'; shimmer?: boolean } = $props();

  const pct = $derived(Math.max(0, Math.min(1, progress)) * 100);
</script>

<div class="bar {tone}" style="--h:{height}px" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(pct)}>
  <div class="fill" style="width:{pct}%">
    {#if shimmer && pct > 4}<span class="shine"></span>{/if}
  </div>
</div>

<style>
  .bar {
    position: relative;
    height: var(--h);
    border-radius: 99px;
    background: var(--surface-3);
    overflow: hidden;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
  }
  .fill {
    position: relative;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--xp), var(--xp-2));
    transition: width 0.9s var(--ease-out);
    overflow: hidden;
    min-width: 0;
  }
  .accent .fill {
    background: linear-gradient(90deg, var(--accent), var(--accent-2));
  }
  .success .fill {
    background: linear-gradient(90deg, var(--success), color-mix(in srgb, var(--success) 60%, #fff));
  }
  .shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(100deg, transparent 20%, rgba(255, 255, 255, 0.45) 50%, transparent 80%);
    transform: translateX(-100%);
    animation: shine 3.6s ease-in-out infinite 1s;
  }
  @keyframes shine {
    0% {
      transform: translateX(-100%);
    }
    40%,
    100% {
      transform: translateX(100%);
    }
  }
</style>
