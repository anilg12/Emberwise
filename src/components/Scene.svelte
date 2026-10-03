<script lang="ts">
  // Realms: backdrops for the hero stage. viewBox 400×300, sliced to fill any box.
  let { id = null, animate = true }: { id?: string | null; animate?: boolean } = $props();

  const uid = `sc${Math.random().toString(36).slice(2, 8)}`;

  // Deterministic sprinkles so stars and books never "jump" between renders.
  function rng(seed: number) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }
  const r1 = rng(7);
  const stars = Array.from({ length: 46 }, () => ({ x: r1() * 400, y: r1() * 170, r: 0.6 + r1() * 1.5, d: r1() * 4 }));
  const r2 = rng(21);
  const BOOK_COLORS = ['#c0533f', '#3f7f5b', '#4a78c2', '#e0a93a', '#8a6bd1', '#d0567c', '#2a9d9f', '#e9dcc4'];
  const shelves = [58, 128, 198].map((y) => {
    const books: { x: number; w: number; h: number; c: string }[] = [];
    let x = 18;
    while (x < 382) {
      const w = 8 + Math.floor(r2() * 9);
      const h = 34 + Math.floor(r2() * 22);
      books.push({ x, w, h, c: BOOK_COLORS[Math.floor(r2() * BOOK_COLORS.length)] });
      x += w + 1 + (r2() < 0.12 ? 10 : 0);
    }
    return { y, books };
  });
  const r3 = rng(5);
  const petals = Array.from({ length: 9 }, () => ({ x: r3() * 400, y: r3() * 200, d: r3() * 8, s: 6 + r3() * 6 }));
  const blossoms = [
    [40, 40], [62, 26], [84, 48], [106, 30], [130, 50], [150, 34], [24, 70], [56, 70], [176, 52], [300, 30], [330, 48], [356, 26], [378, 54], [318, 66],
  ];
</script>

<svg class="scene" class:animate viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  {#if id === 'bg_meadow'}
    <defs>
      <linearGradient id="{uid}-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#a9d8f0" />
        <stop offset="1" stop-color="#eef8ef" />
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#{uid}-sky)" />
    <circle cx="322" cy="62" r="44" fill="#fff3c4" opacity="0.5" />
    <circle cx="322" cy="62" r="24" fill="#ffe08a" />
    <g class="drift" fill="#fff">
      <ellipse cx="80" cy="64" rx="34" ry="12" />
      <ellipse cx="98" cy="56" rx="20" ry="13" />
      <ellipse cx="210" cy="96" rx="26" ry="9" opacity="0.85" />
      <ellipse cx="224" cy="90" rx="15" ry="9" opacity="0.85" />
    </g>
    <path d="M0 196 C70 160 140 172 210 190 C270 206 330 168 400 180 V300 H0 Z" fill="#a6d690" />
    <path d="M0 236 C80 210 170 222 240 236 C300 248 350 228 400 230 V300 H0 Z" fill="#7cbf6a" />
    {#each [[40, 252, '#fff'], [92, 266, '#ffd166'], [150, 248, '#ff9fb8'], [260, 262, '#fff'], [320, 250, '#ffd166'], [372, 268, '#ff9fb8']] as [x, y, c]}
      <circle cx={x as number} cy={y as number} r="3.2" fill={c as string} />
    {/each}
  {:else if id === 'bg_night'}
    <defs>
      <linearGradient id="{uid}-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#151b3d" />
        <stop offset="1" stop-color="#3b3f7c" />
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#{uid}-sky)" />
    {#each stars as s, i}
      <circle class={i % 4 === 0 ? 'twinkle' : ''} style="animation-delay:-{s.d}s" cx={s.x} cy={s.y} r={s.r} fill="#fff6dc" opacity="0.85" />
    {/each}
    <circle cx="312" cy="70" r="30" fill="#fff2c8" opacity="0.18" />
    <circle cx="312" cy="70" r="20" fill="#fff2c8" />
    <circle cx="321" cy="63" r="17" fill="#232a55" />
    <path d="M0 220 C60 196 120 204 180 218 C250 234 320 200 400 212 V300 H0 Z" fill="#262b57" />
    <path d="M0 256 C90 236 180 246 260 258 C320 266 360 252 400 254 V300 H0 Z" fill="#1b1f43" />
  {:else if id === 'bg_library'}
    <defs>
      <linearGradient id="{uid}-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#6e4b3a" />
        <stop offset="1" stop-color="#4e3428" />
      </linearGradient>
      <radialGradient id="{uid}-lamp" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#ffd28a" stop-opacity="0.55" />
        <stop offset="1" stop-color="#ffd28a" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="400" height="300" fill="url(#{uid}-wall)" />
    {#each shelves as shelf}
      {#each shelf.books as b}
        <rect x={b.x} y={shelf.y - b.h} width={b.w} height={b.h} rx="1.5" fill={b.c} opacity="0.92" />
        <rect x={b.x + 1.5} y={shelf.y - b.h + 6} width={b.w - 3} height="2" fill="#000" opacity="0.15" />
      {/each}
      <rect x="10" y={shelf.y} width="380" height="8" rx="2" fill="#3b271d" />
    {/each}
    <ellipse class="glow" cx="70" cy="80" rx="120" ry="100" fill="url(#{uid}-lamp)" />
    <rect x="0" y="248" width="400" height="52" fill="#3b2a22" />
    <rect x="0" y="248" width="400" height="4" fill="#2c1f19" />
  {:else if id === 'bg_campfire'}
    <defs>
      <linearGradient id="{uid}-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2c2148" />
        <stop offset="0.6" stop-color="#8c4a62" />
        <stop offset="1" stop-color="#e99a5c" />
      </linearGradient>
      <radialGradient id="{uid}-fire" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#ffb04a" stop-opacity="0.6" />
        <stop offset="1" stop-color="#ffb04a" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="400" height="300" fill="url(#{uid}-sky)" />
    {#each stars.slice(0, 18) as s}
      <circle cx={s.x} cy={s.y * 0.6} r={s.r * 0.8} fill="#fff6dc" opacity="0.7" />
    {/each}
    {#each [[20, 150, 60], [64, 128, 80], [330, 136, 76], [372, 150, 62], [300, 168, 48]] as [x, top, w]}
      <path d="M{x} {top} L{x + w / 2} 262 L{x - w / 2} 262 Z" fill="#1f1833" />
    {/each}
    <rect x="0" y="244" width="400" height="56" fill="#2a2238" />
    <ellipse class="glow" cx="78" cy="246" rx="90" ry="60" fill="url(#{uid}-fire)" />
    <g transform="translate(78 250)">
      <rect x="-22" y="-4" width="44" height="8" rx="4" fill="#6b4630" transform="rotate(12)" />
      <rect x="-22" y="-4" width="44" height="8" rx="4" fill="#5b3a28" transform="rotate(-12)" />
      <path class="flame" d="M0 -40 C8 -26 16 -18 14 -8 C12 0 6 4 0 4 C-6 4 -12 0 -14 -8 C-16 -18 -6 -24 0 -40 Z" fill="#f4743b" />
      <path class="flame f2" d="M0 -22 C5 -14 8 -10 7 -4 C6 0 3 2 0 2 C-3 2 -6 0 -7 -4 C-8 -10 -3 -14 0 -22 Z" fill="#ffd27a" />
    </g>
  {:else if id === 'bg_sakura'}
    <defs>
      <linearGradient id="{uid}-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffe4ec" />
        <stop offset="1" stop-color="#fff7f1" />
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#{uid}-sky)" />
    <circle cx="200" cy="120" r="70" fill="#fff" opacity="0.5" />
    <path d="M0 30 C40 40 80 30 120 46 C150 58 170 50 190 54" fill="none" stroke="#8a5a4a" stroke-width="7" stroke-linecap="round" />
    <path d="M60 36 C70 56 64 70 54 80" fill="none" stroke="#8a5a4a" stroke-width="4" stroke-linecap="round" />
    <path d="M400 24 C360 34 330 26 300 40 C280 50 266 46 250 52" fill="none" stroke="#8a5a4a" stroke-width="7" stroke-linecap="round" />
    {#each blossoms as [x, y], i}
      <circle cx={x} cy={y} r={9 + (i % 3) * 2} fill={i % 2 ? '#ffb3c7' : '#ffc9d6'} />
    {/each}
    <path d="M0 250 C80 236 160 244 240 252 C300 258 350 248 400 248 V300 H0 Z" fill="#cfe7c3" />
    {#each petals as p}
      <ellipse class="petal" style="animation-delay:-{p.d}s;animation-duration:{p.s}s" cx={p.x} cy={p.y} rx="3.4" ry="2.2" fill="#ff9fb8" />
    {/each}
  {:else if id === 'bg_aurora'}
    <defs>
      <linearGradient id="{uid}-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0c1a2b" />
        <stop offset="1" stop-color="#1d4152" />
      </linearGradient>
      <linearGradient id="{uid}-a" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#5ef0b0" stop-opacity="0" />
        <stop offset="0.3" stop-color="#5ef0b0" stop-opacity="0.7" />
        <stop offset="0.7" stop-color="#7aa8ff" stop-opacity="0.6" />
        <stop offset="1" stop-color="#c38bff" stop-opacity="0" />
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#{uid}-sky)" />
    {#each stars as s}
      <circle cx={s.x} cy={s.y} r={s.r * 0.8} fill="#e8f6ff" opacity="0.7" />
    {/each}
    <g class="sway">
      <path d="M-20 110 C60 50 140 130 220 70 C290 20 350 80 420 40 L420 70 C350 110 290 50 220 100 C140 160 60 80 -20 140 Z" fill="url(#{uid}-a)" opacity="0.75" />
      <path d="M-20 150 C80 100 160 160 240 120 C300 90 360 130 420 100 L420 116 C360 146 300 106 240 136 C160 176 80 116 -20 166 Z" fill="url(#{uid}-a)" opacity="0.45" />
    </g>
    <path d="M0 232 C70 210 150 220 220 236 C290 250 350 222 400 228 V300 H0 Z" fill="#dfeef5" />
    <path d="M0 262 C90 248 190 256 270 266 C330 272 370 262 400 262 V300 H0 Z" fill="#c4dbe6" />
  {:else}
    <defs>
      <radialGradient id="{uid}-g" cx="0.5" cy="0.62" r="0.62">
        <stop offset="0" style="stop-color: var(--accent); stop-opacity: 0.22" />
        <stop offset="1" style="stop-color: var(--accent); stop-opacity: 0" />
      </radialGradient>
    </defs>
    <rect width="400" height="300" style="fill: var(--stage)" />
    <circle cx="200" cy="190" r="170" fill="url(#{uid}-g)" />
    <ellipse cx="200" cy="300" rx="260" ry="62" style="fill: var(--stage-ground)" />
  {/if}
</svg>

<style>
  .scene {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
  .twinkle,
  .petal,
  .flame,
  .glow,
  .sway,
  .drift {
    transform-box: fill-box;
    transform-origin: center;
  }
  .animate .twinkle {
    animation: twinkle 3.2s ease-in-out infinite;
  }
  .animate .petal {
    animation: fall 8s linear infinite;
  }
  .animate .flame {
    transform-origin: 50% 100%;
    animation: flame 0.9s ease-in-out infinite alternate;
  }
  .animate .f2 {
    animation-duration: 0.7s;
  }
  .animate .glow {
    animation: glow 2.6s ease-in-out infinite;
  }
  .animate .sway {
    animation: sway 9s ease-in-out infinite alternate;
  }
  .animate .drift {
    animation: drift 24s ease-in-out infinite alternate;
  }
  @keyframes twinkle {
    0%,
    100% {
      opacity: 0.25;
    }
    50% {
      opacity: 1;
    }
  }
  @keyframes fall {
    0% {
      transform: translate(0, -40px) rotate(0deg);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    100% {
      transform: translate(-60px, 260px) rotate(320deg);
      opacity: 0;
    }
  }
  @keyframes flame {
    from {
      transform: scale(1, 1);
    }
    to {
      transform: scale(0.92, 1.1);
    }
  }
  @keyframes glow {
    0%,
    100% {
      opacity: 0.8;
    }
    50% {
      opacity: 1;
    }
  }
  @keyframes sway {
    from {
      transform: translateX(-14px) scaleY(0.96);
    }
    to {
      transform: translateX(14px) scaleY(1.04);
    }
  }
  @keyframes drift {
    from {
      transform: translateX(-10px);
    }
    to {
      transform: translateX(16px);
    }
  }
  :global(html.reduce-motion) .scene * {
    animation: none !important;
  }
</style>
