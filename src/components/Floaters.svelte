<script lang="ts">
  import { fx } from '../lib/fx.svelte';
</script>

<div class="floaters" aria-hidden="true">
  {#each fx.floaters as f (f.id)}
    <span class="floater {f.tone}" style="left:{f.x}px;top:{f.y}px">{f.text}</span>
  {/each}
</div>

<style>
  .floaters {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 300;
  }
  .floater {
    position: absolute;
    transform: translate(-50%, -50%);
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 19px;
    white-space: nowrap;
    animation: float-up 1.25s var(--ease-out) forwards;
    text-shadow:
      0 1px 0 var(--surface),
      0 0 12px var(--surface);
  }
  .xp {
    color: var(--xp);
  }
  .gold {
    color: var(--gold);
    font-size: 16px;
  }
  .minus {
    color: var(--ink-3);
    font-size: 15px;
  }
  @keyframes float-up {
    0% {
      opacity: 0;
      transform: translate(-50%, -30%) scale(0.7);
    }
    15% {
      opacity: 1;
      transform: translate(-50%, -80%) scale(1.08);
    }
    70% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -260%) scale(1);
    }
  }
</style>
