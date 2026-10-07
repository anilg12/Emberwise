<svelte:options namespace="svg" />

<script lang="ts">
  // hats in avatar coords (head center ~100,92, top of hair ~y 44)
  let { id }: { id: string } = $props();

  // laurel: leaves on two arcs meeting above the forehead
  const laurel = (() => {
    const out: { x: number; y: number; a: number; c: string }[] = [];
    for (const side of [-1, 1]) {
      const p0 = [100 + side * 43, 86];
      const p1 = [100 + side * 44, 47];
      const p2 = [100 + side * 6, 50];
      for (let i = 0; i < 9; i++) {
        const t = 0.05 + i * 0.112;
        const u = 1 - t;
        const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0];
        const y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
        const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
        const dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
        const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
        const off = i % 2 ? 1 : -1;
        out.push({ x: x + off * 2.6 * Math.sin((ang * Math.PI) / 180), y: y - off * 2.6 * Math.cos((ang * Math.PI) / 180), a: ang + off * 32, c: i % 2 ? '#e8c36a' : '#cfa13a' });
      }
    }
    return out;
  })();
</script>

{#if id === 'hat_party'}
  <g>
    <path d="M80 54 L111 4 L126 52 Q103 60 80 54 Z" fill="#f4743b" />
    <path d="M80 54 L111 4 L96 56 Q88 56 80 54 Z" fill="#000" opacity="0.08" />
    <circle cx="103" cy="40" r="3.4" fill="#ffd166" />
    <circle cx="112" cy="24" r="2.8" fill="#fff4dc" />
    <circle cx="94" cy="50" r="2.6" fill="#fff4dc" />
    <circle cx="116" cy="46" r="2.8" fill="#4a78c2" />
    <path d="M78 53 Q103 62 128 51" fill="none" stroke="#ffd166" stroke-width="4" stroke-linecap="round" />
    <circle cx="111" cy="5" r="6.5" fill="#ffd166" />
  </g>
{:else if id === 'hat_beanie'}
  <g>
    <path d="M54 82 C52 50 74 33 100 33 C126 33 148 50 146 82 Z" fill="#4a78c2" />
    <path d="M54 82 C52 50 74 33 100 33 C84 40 72 56 70 82 Z" fill="#000" opacity="0.08" />
    <rect x="51" y="71" width="98" height="15" rx="7.5" fill="#3a62a3" />
    {#each [62, 72, 82, 92, 102, 112, 122, 132, 140] as x}
      <path d="M{x} 74 v9" stroke="#5487d1" stroke-width="2" stroke-linecap="round" />
    {/each}
    <circle cx="100" cy="30" r="9.5" fill="#eef2f8" />
    <circle cx="97" cy="27" r="3" fill="#fff" opacity="0.8" />
  </g>
{:else if id === 'hat_flowers'}
  <g>
    <path d="M60 78 C70 58 86 50 100 49 C114 50 130 58 140 78" fill="none" stroke="#6aa864" stroke-width="3" stroke-linecap="round" />
    {#each [[62, 74, '#ff9fb8'], [76, 59, '#fff4f6'], [92, 50, '#c9a7ff'], [108, 50, '#ff9fb8'], [124, 59, '#fff4f6'], [138, 74, '#c9a7ff']] as [cx, cy, c]}
      <g transform="translate({cx} {cy})">
        {#each [0, 72, 144, 216, 288] as a}
          <circle cx={Math.cos((a * Math.PI) / 180) * 4.6} cy={Math.sin((a * Math.PI) / 180) * 4.6} r="3.9" fill={c as string} />
        {/each}
        <circle r="2.8" fill="#ffd166" />
      </g>
    {/each}
    <ellipse cx="69" cy="64" rx="4" ry="2" fill="#6aa864" transform="rotate(-40 69 64)" />
    <ellipse cx="131" cy="64" rx="4" ry="2" fill="#6aa864" transform="rotate(40 131 64)" />
    <ellipse cx="100" cy="47" rx="4" ry="2" fill="#6aa864" />
  </g>
{:else if id === 'hat_wizard'}
  <g>
    <ellipse cx="100" cy="60" rx="58" ry="11.5" fill="#433a86" />
    <path d="M63 60 C74 42 84 22 96 6 C104 -1 117 2 125 10 C117 12 112 18 112 26 C115 38 124 49 137 60 Z" fill="#5b4fa8" />
    <path d="M63 60 C74 42 84 22 96 6 C92 24 88 44 86 61 Z" fill="#000" opacity="0.1" />
    <path d="M69 52 C90 59 112 59 132 52 L135 59 C112 66 90 66 66 59 Z" fill="#f2c45a" />
    <path d="M103 34 l1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z" fill="#ffe7a6" />
    <circle cx="88" cy="44" r="1.6" fill="#ffe7a6" />
    <circle cx="114" cy="18" r="1.4" fill="#ffe7a6" />
  </g>
{:else if id === 'hat_viking'}
  <g>
    <path d="M60 62 C46 58 36 44 38 25 C44 37 52 45 65 49 Z" fill="#f3ead8" />
    <path d="M140 62 C154 58 164 44 162 25 C156 37 148 45 135 49 Z" fill="#f3ead8" />
    <path d="M60 62 C50 59 43 52 40 42 C46 50 54 54 63 55 Z" fill="#d9ccb3" />
    <path d="M140 62 C150 59 157 52 160 42 C154 50 146 54 137 55 Z" fill="#d9ccb3" />
    <path d="M58 76 C58 47 78 34 100 34 C122 34 142 47 142 76 Z" fill="#a7b2c4" />
    <path d="M58 76 C58 47 78 34 100 34 C86 42 76 56 75 76 Z" fill="#000" opacity="0.08" />
    <path d="M100 34 V70" stroke="#8b97ab" stroke-width="5" stroke-linecap="round" />
    <rect x="55" y="68" width="90" height="12" rx="6" fill="#7c889c" />
    {#each [64, 80, 100, 120, 136] as x}
      <circle cx={x} cy="74" r="1.9" fill="#d5dce6" />
    {/each}
  </g>
{:else if id === 'hat_crown'}
  <g>
    <path d="M68 60 L64 26 L83 43 L100 20 L117 43 L136 26 L132 60 Z" fill="#f2c14e" stroke="#c9952b" stroke-width="2.2" stroke-linejoin="round" />
    <rect x="66" y="53" width="68" height="9" rx="3.5" fill="#e0a93a" />
    <circle cx="64" cy="25" r="3.6" fill="#ffe08a" />
    <circle cx="100" cy="19" r="4" fill="#ffe08a" />
    <circle cx="136" cy="25" r="3.6" fill="#ffe08a" />
    <circle cx="100" cy="57.5" r="3.6" fill="#e5484d" />
    <circle cx="83" cy="57.5" r="2.8" fill="#4a78c2" />
    <circle cx="117" cy="57.5" r="2.8" fill="#3e9b6e" />
    <path d="M75 46 L79 36" stroke="#fff4c4" stroke-width="2" stroke-linecap="round" opacity="0.8" />
  </g>
{:else if id === 'hat_headband'}
  <g>
    <path d="M141 79 C152 77 159 83 161 91 L155 91 C153 86 148 83 141 85 Z" fill="#c73a3f" />
    <path d="M141 82 C150 86 153 94 151 103 L146 100 C147 94 146 89 140 87 Z" fill="#e5484d" />
    <path d="M57 79 C73 64 127 64 143 79 L142 88 C126 74 74 74 58 88 Z" fill="#e5484d" />
    <path d="M58 81 C74 68 126 68 142 81" fill="none" stroke="#fff" stroke-opacity="0.22" stroke-width="1.4" />
    <rect x="91" y="66.5" width="18" height="10" rx="2.4" fill="#c9ccd8" stroke="#9aa6b8" stroke-width="1" />
    <path d="M97 71.5 h6 M100 68.6 v5.8" stroke="#6f7a8c" stroke-width="1.4" stroke-linecap="round" />
  </g>
{:else if id === 'hat_cap'}
  <g>
    <path d="M56 78 C54 50 76 36 100 36 C124 36 146 50 144 78 Z" fill="#3a6fd8" />
    <path d="M56 78 C54 50 76 36 100 36 C86 42 76 58 74 78 Z" fill="#000" opacity="0.08" />
    <path d="M100 37 V76 M79 41 C72 52 70 65 70 77 M121 41 C128 52 130 65 130 77" stroke="#2f5bb3" stroke-width="1.6" fill="none" />
    <circle cx="100" cy="37" r="3.6" fill="#2f5bb3" />
    <path d="M100 52 c3.4 3.6 5 6 5 8.4 a5 5 0 0 1-10 0 c0-2.4 1.6-4.8 5-8.4z" fill="#ff9a4d" />
    <path d="M53 76 Q100 65 147 76 Q149 84 141 86.5 Q100 77 59 86.5 Q51 84 53 76 Z" fill="#2f5bb3" />
  </g>
{:else if id === 'hat_beret'}
  <g>
    <ellipse cx="97" cy="60" rx="47" ry="17.5" transform="rotate(-9 97 60)" fill="#c0392b" />
    <ellipse cx="90" cy="56" rx="30" ry="8" transform="rotate(-9 90 56)" fill="#fff" opacity="0.1" />
    <path d="M58 73 Q100 63 141 64" fill="none" stroke="#a52f23" stroke-width="3.2" stroke-linecap="round" />
    <path d="M101 44 q2 -6 6.5 -6.5" stroke="#a52f23" stroke-width="3" fill="none" stroke-linecap="round" />
  </g>
{:else if id === 'hat_chef'}
  <g>
    {#each [[73, 41, 15], [127, 41, 15], [87, 31, 15], [113, 31, 15], [100, 25, 16], [100, 44, 16]] as [cx, cy, r]}
      <circle {cx} {cy} r={r + 1.2} fill="#e4dfd4" />
    {/each}
    {#each [[73, 41, 15], [127, 41, 15], [87, 31, 15], [113, 31, 15], [100, 25, 16], [100, 44, 16]] as [cx, cy, r]}
      <circle {cx} {cy} {r} fill="#fdfcf9" />
    {/each}
    <path d="M86 46 q2 -10 0 -18 M114 46 q-2 -10 0 -18" stroke="#e2ddd2" stroke-width="1.6" fill="none" stroke-linecap="round" />
    <rect x="63" y="53" width="74" height="19" rx="5" fill="#fbfaf6" stroke="#e2ddd2" stroke-width="1.5" />
    <path d="M75 56 v13 M88 56 v13 M100 56 v13 M112 56 v13 M125 56 v13" stroke="#ebe6dc" stroke-width="1.6" stroke-linecap="round" />
  </g>
{:else if id === 'hat_straw'}
  <g>
    <ellipse cx="100" cy="70" rx="70" ry="14" fill="#e3b85c" />
    <path d="M68 70 C68 46 82 36 100 36 C118 36 132 46 132 70 Z" fill="#f0d27c" />
    <path d="M74 52 Q100 46 126 52 M70 60 Q100 54 130 60" stroke="#d9b55a" stroke-width="1.2" fill="none" />
    <path d="M68 63 Q100 69 132 63 L132 70 Q100 76 68 70 Z" fill="#e07a5f" />
    <path d="M31 72 Q100 93 169 72 Q100 82 31 72 Z" fill="#edc66d" />
    <path d="M44 76 Q100 88 156 76" stroke="#d9a94a" stroke-width="1" fill="none" opacity="0.7" />
    <g transform="translate(76 66.5)">
      {#each [0, 72, 144, 216, 288] as a}
        <circle cx={Math.cos((a * Math.PI) / 180) * 3} cy={Math.sin((a * Math.PI) / 180) * 3} r="2.6" fill="#fff4f6" />
      {/each}
      <circle r="1.8" fill="#ffd166" />
    </g>
  </g>
{:else if id === 'hat_safari'}
  <g>
    <path d="M60 72 C58 44 78 30 100 30 C122 30 142 44 140 72 Z" fill="#e3d3b0" />
    <path d="M60 72 C58 44 78 30 100 30 C86 38 78 54 77 72 Z" fill="#000" opacity="0.07" />
    <path d="M60 65 Q100 73 140 65 L140 72 Q100 80 60 72 Z" fill="#7a4e2d" />
    <path d="M42 74 Q100 63 158 74 Q160 82 149 84.5 Q100 76 51 84.5 Q40 82 42 74 Z" fill="#d4c19a" />
    <circle cx="100" cy="30.5" r="3.4" fill="#c9b48a" />
  </g>
{:else if id === 'hat_fedora'}
  <g>
    <path d="M64 66 C62 44 70 32 84 30 C92 35 108 35 116 30 C130 32 138 44 136 66 Z" fill="#4a4458" />
    <path d="M84 30 C91 39 109 39 116 30" fill="none" stroke="#3a3547" stroke-width="2" />
    <path d="M64 59 Q100 66 136 59 L136 67 Q100 74 64 67 Z" fill="#2b2833" />
    <path d="M124 61 C127 50 135 43 142 41 C140 50 134 58 126 64 Z" fill="#e9c46a" />
    <path d="M39 70 Q100 55 161 70 Q165 78 152 80.5 Q100 69 48 80.5 Q35 78 39 70 Z" fill="#3b3647" />
  </g>
{:else if id === 'hat_tricorn'}
  <g>
    <path d="M66 58 C66 36 80 26 100 26 C120 26 134 36 134 58 Z" fill="#3a3a40" />
    <path d="M43 67 C59 44 80 36 100 41 C120 36 141 44 157 67 C141 61 124 63 100 76 C76 63 59 61 43 67 Z" fill="#2a2a2e" />
    <path d="M43 67 C59 61 76 63 100 76 C124 63 141 61 157 67" fill="none" stroke="#d4a24c" stroke-width="2.4" stroke-linejoin="round" />
    <path d="M100 47 l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" fill="#d4a24c" />
  </g>
{:else if id === 'hat_sprout'}
  <g class="sway">
    <path d="M100 48 C100 39 99 33 101 26" stroke="#5a9a4a" stroke-width="3" fill="none" stroke-linecap="round" />
    <path d="M100.5 32 C92 23 82 25 79 31 C86 37 95 37 100.5 32 Z" fill="#7cc36b" />
    <path d="M100.5 29 C108 19 120 19 123 25 C116 32 106 33 100.5 29 Z" fill="#8ed37a" />
    <path d="M98 31.5 C93 29 88 29 84 30.6 M103 28.4 C108 25.6 113 25 118 25.6" stroke="#c9ebb9" stroke-width="1.1" fill="none" stroke-linecap="round" />
  </g>
{:else if id === 'hat_laurel'}
  <g>
    {#each laurel as l}
      <ellipse cx={l.x} cy={l.y} rx="6.4" ry="2.7" transform="rotate({l.a} {l.x} {l.y})" fill={l.c} />
    {/each}
    <circle cx="100" cy="51" r="3.2" fill="#e5484d" stroke="#c9952b" stroke-width="1.2" />
  </g>
{/if}

<style>
  .sway {
    transform-box: view-box;
    transform-origin: 100px 48px;
  }
  :global(.avatar.animate) .sway {
    animation: sway 3.4s ease-in-out infinite;
  }
  @keyframes sway {
    0%,
    100% {
      transform: rotate(-4deg);
    }
    50% {
      transform: rotate(4deg);
    }
  }
</style>
