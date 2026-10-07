<script lang="ts">
  // realm backgrounds for the hero stage. viewBox 400x300, sliced to fill
  let { id = null, animate = true }: { id?: string | null; animate?: boolean } = $props();

  const uid = `sc${Math.random().toString(36).slice(2, 8)}`;

  // seeded positions so the stars etc. don't move around between renders
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
  const r4 = rng(11);
  const lit = Array.from({ length: 22 }, () => ({ x: 74 + Math.floor(r4() * 30) * 8.4, y: 132 + Math.floor(r4() * 9) * 9, o: 0.35 + r4() * 0.5 }));
  const rainCols = [0, 1, 2].map(() => Array.from({ length: 11 }, () => 66 + r4() * 272));
  const rain = Array.from({ length: 12 }, (_, row) => rainCols[row % 3].map((x) => ({ x, y: row * 24 - 50, o: 0.25 + r4() * 0.4 }))).flat();
  const drops = Array.from({ length: 14 }, () => ({ x: 74 + r4() * 252, y: 34 + r4() * 172, r: 1.4 + r4() * 2.2 }));
  const fireflies = Array.from({ length: 9 }, () => ({ x: 20 + r4() * 360, y: 150 + r4() * 90, d: r4() * 3 }));
  const crystalColors = ['#5ad6c8', '#9f7aea', '#ff8fd1', '#7aa8ff'];
  const crystals = [
    [40, 250, -14, 1.3], [62, 254, 8, 0.9], [22, 256, -30, 0.7], [90, 252, 22, 0.6],
    [338, 248, 12, 1.25], [360, 254, -10, 0.85], [314, 254, 28, 0.6], [380, 256, 26, 0.7],
    [150, 246, -6, 0.5], [250, 244, 10, 0.45], [196, 92, 180, 0.6], [130, 76, 170, 0.5], [286, 70, 188, 0.55],
  ].map(([x, y, a, sc], i) => ({ x, y, a, s: sc, c: crystalColors[i % crystalColors.length] }));
  const sparks = Array.from({ length: 16 }, () => ({ x: 20 + r4() * 360, y: 20 + r4() * 200, r: 0.8 + r4() * 1.4, d: r4() * 3 }));
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
  {:else if id === 'bg_rain'}
    <defs>
      <linearGradient id="{uid}-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#4a3d55" />
        <stop offset="1" stop-color="#352b3f" />
      </linearGradient>
      <linearGradient id="{uid}-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#5f7896" />
        <stop offset="1" stop-color="#9db1c6" />
      </linearGradient>
      <clipPath id="{uid}-win"><rect x="66" y="26" width="268" height="190" rx="10" /></clipPath>
    </defs>
    <rect width="400" height="300" fill="url(#{uid}-wall)" />
    <g clip-path="url(#{uid}-win)">
      <rect x="66" y="26" width="268" height="190" fill="url(#{uid}-sky)" />
      {#each [[70, 150, 36, 66], [104, 128, 30, 88], [134, 160, 42, 56], [176, 140, 28, 76], [204, 118, 38, 98], [242, 150, 34, 66], [276, 132, 30, 84], [306, 156, 34, 60]] as [x, y, w, h]}
        <rect {x} {y} width={w} height={h} fill="#435673" />
      {/each}
      {#each lit as l}
        <rect x={l.x} y={l.y} width="5" height="6" rx="1" fill="#ffd28a" opacity={l.o} />
      {/each}
      <g class="rainfall">
        {#each rain as r}
          <path d="M{r.x} {r.y} l-3 12" stroke="#e8f1fa" stroke-width="1.2" stroke-linecap="round" opacity={r.o} />
        {/each}
      </g>
      {#each drops as dr}
        <circle cx={dr.x} cy={dr.y} r={dr.r} fill="#dfeaf5" opacity="0.5" />
        <circle cx={dr.x - dr.r * 0.3} cy={dr.y - dr.r * 0.3} r={dr.r * 0.35} fill="#fff" opacity="0.8" />
      {/each}
    </g>
    <path d="M200 26 V216 M66 121 H334" stroke="#2c2433" stroke-width="8" />
    <rect x="66" y="26" width="268" height="190" rx="10" fill="none" stroke="#2c2433" stroke-width="10" />
    <rect x="52" y="214" width="296" height="14" rx="4" fill="#6a5870" />
    <g transform="translate(96 214)">
      <path d="M-11 0 L-9 -16 H9 L11 0 Z" fill="#c0533f" />
      <path d="M0 -16 C-2 -28 -12 -32 -16 -30 C-12 -24 -6 -20 0 -16 Z M0 -16 C2 -30 10 -36 16 -34 C12 -26 6 -20 0 -16 Z M0 -16 C0 -26 2 -34 6 -38 C6 -30 4 -22 0 -16 Z" fill="#5f9e5a" />
    </g>
    <g transform="translate(304 214)">
      <rect x="-9" y="-16" width="18" height="16" rx="3" fill="#f2e9da" />
      <path d="M9 -12 C15 -12 15 -4 9 -4" fill="none" stroke="#f2e9da" stroke-width="2.6" />
      <path class="steam" d="M-2 -20 c-3 -5 3 -7 0 -12 M3 -20 c-3 -5 3 -7 0 -12" stroke="#fff" stroke-opacity="0.5" stroke-width="1.6" fill="none" stroke-linecap="round" />
    </g>
    <rect x="0" y="252" width="400" height="48" fill="#2c2433" />
  {:else if id === 'bg_beach'}
    <defs>
      <linearGradient id="{uid}-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#93d2ef" />
        <stop offset="1" stop-color="#fde8cf" />
      </linearGradient>
      <linearGradient id="{uid}-sea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3a9fc4" />
        <stop offset="1" stop-color="#7fd3df" />
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#{uid}-sky)" />
    <circle class="glow" cx="300" cy="96" r="52" fill="#fff1c4" opacity="0.55" />
    <circle cx="300" cy="96" r="30" fill="#ffd27a" />
    <g class="drift" fill="#fff">
      <ellipse cx="90" cy="60" rx="32" ry="11" />
      <ellipse cx="108" cy="52" rx="18" ry="12" />
      <ellipse cx="200" cy="88" rx="22" ry="7" opacity="0.8" />
    </g>
    <rect x="0" y="158" width="400" height="62" fill="url(#{uid}-sea)" />
    <g transform="translate(118 150)">
      <path d="M0 8 h22 l-4 6 h-14 z" fill="#5b3d2e" />
      <path d="M11 7 V-14 L22 5 Z" fill="#fff" />
      <path d="M10 7 V-10 L2 5 Z" fill="#ffe0d0" />
    </g>
    <g class="waves" stroke="#fff" stroke-opacity="0.55" stroke-width="2" fill="none" stroke-linecap="round">
      <path d="M20 176 q10 -5 20 0 M120 186 q10 -5 20 0 M240 172 q10 -5 20 0 M330 190 q10 -5 20 0 M70 200 q10 -5 20 0 M290 206 q10 -5 20 0" />
    </g>
    <path d="M0 214 C60 206 120 218 200 212 C280 206 340 216 400 210 V300 H0 Z" fill="#f3dcae" />
    <path class="foam" d="M0 214 C60 206 120 218 200 212 C280 206 340 216 400 210" stroke="#fff" stroke-width="3" fill="none" opacity="0.8" />
    <path d="M0 250 C100 240 200 252 300 246 C340 244 370 246 400 244 V300 H0 Z" fill="#ecd09c" />
    <path d="M58 262 l3 -7 3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5z" fill="#f08a6a" />
    <path d="M340 270 c0 -8 12 -8 12 0 z" fill="#f6c9b6" />
  {:else if id === 'bg_cafe'}
    <defs>
      <radialGradient id="{uid}-lamp" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#ffd28a" stop-opacity="0.6" />
        <stop offset="1" stop-color="#ffd28a" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="400" height="300" fill="#f0e0c8" />
    <rect x="0" y="0" width="400" height="10" fill="#e3cfb2" />
    <rect x="24" y="40" width="96" height="120" rx="6" fill="#bfd9e6" />
    <path d="M72 40 V160 M24 100 H120" stroke="#8a5a3b" stroke-width="5" />
    <rect x="24" y="40" width="96" height="120" rx="6" fill="none" stroke="#8a5a3b" stroke-width="6" />
    <rect x="276" y="34" width="100" height="80" rx="6" fill="#2f3a35" stroke="#8a5a3b" stroke-width="5" />
    <path d="M290 52 h44 M290 64 h60 M290 76 h36 M290 88 h52 M290 100 h30" stroke="#e8e4d8" stroke-width="2.4" stroke-linecap="round" opacity="0.75" />
    <circle cx="352" cy="54" r="6" fill="none" stroke="#f2c45a" stroke-width="2" />
    <rect x="150" y="96" width="104" height="6" rx="2" fill="#8a5a3b" />
    {#each [[160, '#f2e9da'], [178, '#e07a5f'], [196, '#f2e9da'], [214, '#5f9e5a'], [232, '#f2c45a']] as [x, c]}
      <rect x={x as number} y="80" width="13" height="16" rx="3" fill={c as string} />
    {/each}
    <path d="M110 0 V48" stroke="#5b3d2e" stroke-width="2" />
    <ellipse class="glow" cx="110" cy="70" rx="70" ry="54" fill="url(#{uid}-lamp)" />
    <path d="M96 48 h28 l-6 12 h-16 z" fill="#2f5f5f" />
    <circle cx="110" cy="62" r="4" fill="#ffe7a6" />
    <rect x="0" y="190" width="400" height="62" fill="#b98a62" />
    <path d="M0 190 H400" stroke="#8a5a3b" stroke-width="5" />
    {#each [40, 100, 160, 220, 280, 340] as x}
      <rect x={x - 22} y="202" width="44" height="40" rx="3" fill="none" stroke="#a87650" stroke-width="2.4" />
    {/each}
    <rect x="0" y="252" width="400" height="48" fill="#8a5a3b" />
    <g transform="translate(350 190)">
      <path d="M-12 0 L-10 -18 H10 L12 0 Z" fill="#e3cfb2" />
      <path d="M0 -18 C-4 -34 -16 -38 -20 -34 C-14 -28 -8 -22 0 -18 Z M0 -18 C4 -36 14 -42 20 -38 C14 -30 8 -22 0 -18 Z" fill="#5f9e5a" />
    </g>
  {:else if id === 'bg_space'}
    <defs>
      <linearGradient id="{uid}-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0b0f2a" />
        <stop offset="1" stop-color="#2a1d52" />
      </linearGradient>
      <radialGradient id="{uid}-neb" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#c38bff" stop-opacity="0.45" />
        <stop offset="1" stop-color="#c38bff" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="{uid}-pl" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffb37a" />
        <stop offset="1" stop-color="#e5533d" />
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#{uid}-sky)" />
    <ellipse cx="120" cy="120" rx="150" ry="80" fill="url(#{uid}-neb)" />
    {#each stars as s, i}
      <circle class={i % 3 === 0 ? 'twinkle' : ''} style="animation-delay:-{s.d}s" cx={s.x} cy={s.y * 1.4} r={s.r} fill="#fff6dc" opacity="0.9" />
    {/each}
    <circle cx="300" cy="92" r="34" fill="url(#{uid}-pl)" />
    <path d="M272 82 C290 76 312 80 330 92" stroke="#fff" stroke-opacity="0.18" stroke-width="5" fill="none" stroke-linecap="round" />
    <ellipse cx="300" cy="96" rx="60" ry="12" transform="rotate(-14 300 96)" fill="none" stroke="#f2d3a8" stroke-width="4" opacity="0.85" />
    <circle cx="86" cy="64" r="11" fill="#c9ccd8" />
    <circle cx="82" cy="61" r="2.6" fill="#a9adbd" />
    <circle cx="90" cy="68" r="1.8" fill="#a9adbd" />
    <path class="shoot" d="M60 30 l40 14" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0" />
    <path d="M0 258 C120 234 280 234 400 258 V300 H0 Z" fill="#3a2f5a" />
    <ellipse cx="96" cy="262" rx="14" ry="4" fill="#2c2346" />
    <ellipse cx="300" cy="268" rx="20" ry="5" fill="#2c2346" />
  {:else if id === 'bg_moonlake'}
    <defs>
      <linearGradient id="{uid}-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#18204a" />
        <stop offset="1" stop-color="#3d4a8c" />
      </linearGradient>
      <linearGradient id="{uid}-lake" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2d3b7a" />
        <stop offset="1" stop-color="#1b2552" />
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#{uid}-sky)" />
    {#each stars as s, i}
      <circle class={i % 4 === 0 ? 'twinkle' : ''} style="animation-delay:-{s.d}s" cx={s.x} cy={s.y * 0.85} r={s.r * 0.9} fill="#fff6dc" opacity="0.85" />
    {/each}
    <circle class="glow" cx="262" cy="78" r="48" fill="#fff6d8" opacity="0.16" />
    <circle cx="262" cy="78" r="28" fill="#fff6d8" />
    <circle cx="254" cy="72" r="5" fill="#efe3bd" />
    <circle cx="270" cy="86" r="3.4" fill="#efe3bd" />
    <path d="M0 196 C50 170 110 178 160 192 C220 170 300 168 400 190 V206 H0 Z" fill="#26305e" />
    <rect x="0" y="202" width="400" height="56" fill="url(#{uid}-lake)" />
    <g class="shimmer">
      {#each [[262, 210, 30], [262, 218, 24], [262, 226, 18], [262, 234, 13], [262, 242, 8]] as [x, y, w], i}
        <rect x={x - w} {y} width={w * 2} height="2.6" rx="1.3" fill="#fff6d8" opacity={0.7 - i * 0.11} />
      {/each}
    </g>
    <path d="M0 258 C100 248 220 262 400 252 V300 H0 Z" fill="#141b3d" />
    {#each [[30, 258], [42, 256], [52, 260], [356, 254], [368, 258], [380, 254]] as [x, y], i}
      <path d="M{x} {y} q{i % 2 ? 3 : -3} -26 0 -40" stroke="#0f1533" stroke-width="2.4" fill="none" />
      <ellipse cx={x + (i % 2 ? 1.5 : -1.5)} cy={y - 34} rx="2.6" ry="7" fill="#3b2f2a" />
    {/each}
    {#each fireflies as f}
      <circle class="twinkle" style="animation-delay:-{f.d}s" cx={f.x} cy={f.y} r="1.8" fill="#fff3a6" />
    {/each}
  {:else if id === 'bg_crystal'}
    <defs>
      <linearGradient id="{uid}-cave" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#140f24" />
        <stop offset="1" stop-color="#2e2250" />
      </linearGradient>
      <radialGradient id="{uid}-cg" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#7af0e0" stop-opacity="0.45" />
        <stop offset="1" stop-color="#7af0e0" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="{uid}-pg" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#ff8fd1" stop-opacity="0.4" />
        <stop offset="1" stop-color="#ff8fd1" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="400" height="300" fill="url(#{uid}-cave)" />
    <path d="M0 0 H400 V40 C340 70 300 40 250 64 C200 88 150 50 100 70 C60 86 30 60 0 72 Z" fill="#0d0a18" />
    <ellipse class="glow" cx="70" cy="200" rx="100" ry="80" fill="url(#{uid}-cg)" />
    <ellipse class="glow" cx="330" cy="190" rx="100" ry="80" fill="url(#{uid}-pg)" />
    {#each crystals as cr}
      <g transform="translate({cr.x} {cr.y}) rotate({cr.a}) scale({cr.s})">
        <path d="M0 0 L-9 -10 L-6 -44 L0 -54 L6 -44 L9 -10 Z" fill={cr.c} />
        <path d="M0 0 L0 -54 L6 -44 L9 -10 Z" fill="#fff" opacity="0.22" />
      </g>
    {/each}
    <path d="M0 250 C120 238 260 246 400 238 V300 H0 Z" fill="#1d1533" />
    {#each sparks as sp}
      <circle class="twinkle" style="animation-delay:-{sp.d}s" cx={sp.x} cy={sp.y} r={sp.r} fill="#e8fffb" />
    {/each}
  {:else if id === 'bg_celestial'}
    <defs>
      <linearGradient id="{uid}-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffd7e8" />
        <stop offset="0.55" stop-color="#ddd6ff" />
        <stop offset="1" stop-color="#c4e6ff" />
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#{uid}-sky)" />
    {#each ['#ffb3c7', '#ffd8a8', '#fff3b0', '#c9f2c7', '#b8dcff', '#d7c4ff'] as c, i}
      {@const r = 168 - i * 9}
      <path d="M{200 - r} 236 A{r} {r} 0 0 1 {200 + r} 236" stroke={c} stroke-width="9" fill="none" opacity="0.55" />
    {/each}
    {#each sparks as sp, i}
      <path class="twinkle" style="animation-delay:-{sp.d}s" d="M{sp.x} {sp.y - 5} l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z" fill={i % 2 ? '#f7c948' : '#fff'} />
    {/each}
    <g class="drift" fill="#fff">
      <ellipse cx="60" cy="236" rx="70" ry="22" opacity="0.95" />
      <ellipse cx="120" cy="250" rx="80" ry="24" />
      <ellipse cx="300" cy="244" rx="90" ry="24" opacity="0.95" />
      <ellipse cx="360" cy="232" rx="60" ry="20" opacity="0.9" />
    </g>
    <path d="M0 256 C80 240 160 262 240 252 C310 244 360 258 400 250 V300 H0 Z" fill="#fff" />
    <path d="M0 270 C90 262 200 276 300 268 C350 264 380 270 400 268 V300 H0 Z" fill="#f4eefe" />
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
  .drift,
  .steam,
  .shimmer,
  .waves,
  .foam {
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
  .animate .rainfall {
    animation: rainfall 1.3s linear infinite;
  }
  .animate .steam {
    animation: steam 3s ease-in-out infinite;
  }
  .animate .waves {
    animation: drift 7s ease-in-out infinite alternate;
  }
  .animate .foam {
    animation: glow 4s ease-in-out infinite;
  }
  .animate .shimmer {
    animation: shimmer 3.4s ease-in-out infinite;
  }
  .animate .shoot {
    animation: shoot 9s ease-in infinite;
  }
  @keyframes rainfall {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(72px);
    }
  }
  @keyframes steam {
    0% {
      transform: translateY(2px);
      opacity: 0;
    }
    40% {
      opacity: 0.8;
    }
    100% {
      transform: translateY(-6px);
      opacity: 0;
    }
  }
  @keyframes shimmer {
    0%,
    100% {
      transform: scaleX(1);
      opacity: 0.85;
    }
    50% {
      transform: scaleX(0.86);
      opacity: 1;
    }
  }
  @keyframes shoot {
    0%,
    86% {
      transform: translate(0, 0);
      opacity: 0;
    }
    90% {
      opacity: 0.9;
    }
    100% {
      transform: translate(160px, 56px);
      opacity: 0;
    }
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
