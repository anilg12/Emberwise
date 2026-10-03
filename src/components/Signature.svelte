<script lang="ts">
  // The maker's mark. Written by hand, underlined with a little flourish.
  let { size = 46, caption = '' }: { size?: number; caption?: string } = $props();
</script>

<div class="sig" style="--s:{size}px">
  {#if caption}<span class="cap">{caption}</span>{/if}
  <span class="name">Anıl Gül</span>
  <svg class="swash" viewBox="0 0 220 26" aria-hidden="true">
    <path d="M6 15 C40 7 80 5 118 9 C150 12 176 18 196 14 C206 12 211 8 214 5" />
    <path class="dot" d="M200 21.5 a2.2 2.2 0 1 0 0.1 0" />
  </svg>
  <span class="caps">ANIL GÜL</span>
</div>

<style>
  .sig {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
  }
  .cap {
    font-size: 11.5px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-3);
    margin-bottom: 2px;
  }
  .name {
    font-family: var(--font-hand);
    font-weight: 700;
    font-size: var(--s);
    line-height: 1;
    color: var(--ink);
    transform: rotate(-3deg);
    padding: 0 6px;
  }
  .swash {
    width: calc(var(--s) * 3.4);
    height: calc(var(--s) * 0.42);
    margin-top: -4px;
    overflow: visible;
  }
  .swash path {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2.6;
    stroke-linecap: round;
    stroke-dasharray: 240;
    stroke-dashoffset: 240;
    animation: draw 1.4s var(--ease-out) 0.35s forwards;
  }
  .swash .dot {
    fill: var(--accent);
    stroke: none;
    opacity: 0;
    animation: appear 0.3s ease-out 1.5s forwards;
  }
  .caps {
    margin-top: 6px;
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.32em;
    color: var(--ink-3);
    padding-left: 0.32em;
  }
  @keyframes draw {
    to {
      stroke-dashoffset: 0;
    }
  }
  @keyframes appear {
    to {
      opacity: 1;
    }
  }
</style>
