<script lang="ts">
  // A small wrapped present. `open` lifts the lid and lets the light out.
  let { size = 120, open = false, tone = 'ember' }: { size?: number; open?: boolean; tone?: 'ember' | 'gold' | 'violet' } = $props();
  const PAL = {
    ember: { box: '#f4743b', dark: '#d65a2c', ribbon: '#ffd27a' },
    gold: { box: '#f2c14e', dark: '#d9a43a', ribbon: '#e5484d' },
    violet: { box: '#8a6bd1', dark: '#6f52b8', ribbon: '#ffd27a' },
  } as const;
  const p = $derived(PAL[tone]);
  const uid = `gb${Math.random().toString(36).slice(2, 8)}`;
</script>

<svg class="gift" class:open width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
  <defs>
    <radialGradient id="{uid}-l" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#fff3c4" stop-opacity="0.95" />
      <stop offset="1" stop-color="#ffd27a" stop-opacity="0" />
    </radialGradient>
  </defs>
  <ellipse cx="60" cy="110" rx="38" ry="6" fill="#000" opacity="0.12" />
  <circle class="light" cx="60" cy="52" r="52" fill="url(#{uid}-l)" />
  <g class="rays">
    {#each [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330] as a}
      <path d="M60 52 L57 6 L63 6 Z" fill="#ffe7a6" opacity="0.55" transform="rotate({a} 60 52)" />
    {/each}
  </g>
  <g class="body">
    <rect x="22" y="56" width="76" height="50" rx="7" fill={p.box} />
    <rect x="22" y="56" width="76" height="10" fill={p.dark} opacity="0.6" />
    <rect x="53" y="56" width="14" height="50" fill={p.ribbon} />
  </g>
  <g class="lid">
    <path d="M60 42 C52 28 34 28 38 38 C41 45 52 44 60 42 Z" fill={p.ribbon} />
    <path d="M60 42 C68 28 86 28 82 38 C79 45 68 44 60 42 Z" fill={p.ribbon} />
    <rect x="16" y="40" width="88" height="18" rx="6" fill={p.box} />
    <rect x="16" y="52" width="88" height="6" rx="3" fill={p.dark} opacity="0.5" />
    <rect x="52" y="40" width="16" height="18" fill={p.ribbon} />
    <circle cx="60" cy="42" r="5" fill={p.dark} />
  </g>
</svg>

<style>
  .gift {
    display: block;
    overflow: visible;
  }
  .light,
  .rays,
  .lid,
  .body {
    transform-box: view-box;
    transform-origin: 60px 52px;
  }
  .light,
  .rays {
    opacity: 0;
    transform: scale(0.4);
    transition:
      opacity 0.5s ease,
      transform 0.7s var(--ease-spring);
  }
  .open .light,
  .open .rays {
    opacity: 1;
    transform: scale(1);
  }
  .open .rays {
    animation: spin 14s linear infinite;
  }
  .gift:not(.open) .body,
  .gift:not(.open) .lid {
    animation: wiggle 2.4s ease-in-out infinite;
    transform-origin: 60px 106px;
  }
  .lid {
    transition: transform 0.6s var(--ease-spring);
  }
  .open .lid {
    transform: translate(10px, -34px) rotate(16deg);
  }
  @keyframes wiggle {
    0%,
    70%,
    100% {
      transform: rotate(0);
    }
    76% {
      transform: rotate(-5deg);
    }
    82% {
      transform: rotate(5deg);
    }
    88% {
      transform: rotate(-3deg);
    }
    94% {
      transform: rotate(2deg);
    }
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  :global(html.reduce-motion) .gift * {
    animation: none !important;
    transition: none !important;
  }
</style>
