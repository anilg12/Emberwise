<svelte:options namespace="svg" />

<script lang="ts">
  // Headwear, drawn in avatar space (head centre ≈ 100,92, top of hair ≈ y 44).
  let { id }: { id: string } = $props();
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
{/if}
