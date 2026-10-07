<svelte:options namespace="svg" />

<script lang="ts">
  // outfits in avatar coords. torso ~ x 68-132, y 140-198, hands at (71,185) (129,185)
  // layers: back = behind body, torso = on clothes, held = behind hands, front = over the arms
  import type { Tone } from '../lib/characters';

  let { id, c, layer, uid }: { id: string; c: Tone; layer: 'back' | 'torso' | 'held' | 'front'; uid: string } = $props();

  const BODY = 'M68 197 C68 173 70 153 82 145 C88 141 94 140 100 140 C106 140 112 141 118 145 C130 153 132 173 132 197 Q100 202 68 197 Z';

  function luma(hex: string) {
    const n = parseInt(hex.slice(1), 16);
    return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  }
  // buttons/seams: dark on light cloth, light on dark
  const ink = $derived(luma(c.main) > 0.6 ? '#3b3149' : '#f4ead8');
  const star = (x: number, y: number, r: number) =>
    `M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z`;
</script>

{#if layer === 'back'}
  {#if id === 'coder'}
    <path d="M76 150 C70 132 84 124 100 124 C116 124 130 132 124 150 Z" fill={c.dark} />
  {:else if id === 'ninja'}
    <path d="M80 198 L126 141" stroke="#2a2230" stroke-width="5" stroke-linecap="round" />
    <path d="M126.5 140.5 L137.5 126" stroke={c.trim} stroke-width="4.6" stroke-linecap="round" />
    <path d="M128.8 137.4 L131.2 134.2 M131.4 134 L133.8 130.8" stroke="#2a2230" stroke-width="1.2" stroke-linecap="round" opacity="0.5" />
    <ellipse cx="126.2" cy="141.2" rx="5.4" ry="2" transform="rotate(-52 126.2 141.2)" fill="#c9a35c" />
  {:else if id === 'sovereign'}
    <g class="wing wl">
      <path d="M84 152 C64 132 40 126 24 134 C32 140 36 145 38 151 C28 152 22 158 20 167 C30 165 38 167 44 171 C38 177 36 185 38 192 C52 182 66 173 82 169 Z" fill={c.alt} />
      <path d="M38 151 C52 150 66 154 80 160 M44 171 C56 166 70 166 82 166 M30 141 C46 140 62 144 80 154" stroke={c.trim} stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.75" />
    </g>
    <g class="wing wr">
      <path d="M116 152 C136 132 160 126 176 134 C168 140 164 145 162 151 C172 152 178 158 180 167 C170 165 162 167 156 171 C162 177 164 185 162 192 C148 182 134 173 118 169 Z" fill={c.alt} />
      <path d="M162 151 C148 150 134 154 120 160 M156 171 C144 166 130 166 118 166 M170 141 C154 140 138 144 120 154" stroke={c.trim} stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.75" />
    </g>
  {/if}
{:else if layer === 'torso'}
  {#if id === 'wizard'}
    <path d="M100 150 V198" stroke={c.trim} stroke-width="3" stroke-linecap="round" />
    <path d="M89 142 L100 154 L111 142" fill="none" stroke={c.trim} stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />
    <path d="M69 192 Q100 199 131 192" fill="none" stroke={c.trim} stroke-width="3" stroke-linecap="round" />
    <path d="M112 166 l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill={c.trim} />
  {:else if id === 'knight'}
    <path d="M84 150 Q100 146 116 150 L114 178 Q100 184 86 178 Z" fill="#c5cedb" />
    <circle cx="100" cy="162" r="7" fill={c.trim} />
    <path d="M100 157.5 c2.4 2.6 3.6 4.4 3.6 6 a3.6 3.6 0 0 1-7.2 0 c0-1.6 1.4-3.4 3.6-6z" fill="#ffd28a" />
    <rect x="70" y="180" width="60" height="7" rx="3.5" fill={c.dark} />
    <ellipse cx="80" cy="147" rx="11" ry="7" fill={c.dark} />
    <ellipse cx="120" cy="147" rx="11" ry="7" fill={c.dark} />
  {:else if id === 'ranger'}
    <path d="M81 147 C88 135 112 135 119 147 C112 153 88 153 81 147 Z" fill={c.dark} />
    <rect x="70" y="176" width="60" height="7" rx="3.5" fill={c.trim} />
    <rect x="95" y="175" width="10" height="9" rx="2" fill="#e8c36a" />
    <path d="M86 154 L92 172 M114 154 L108 172" stroke={c.dark} stroke-width="2.2" stroke-linecap="round" />
  {:else if id === 'bard'}
    <path d="M86 142 Q100 152 114 142 L112 148 Q100 156 88 148 Z" fill="#f4ede0" />
    <circle cx="100" cy="160" r="2.6" fill={c.trim} />
    <circle cx="100" cy="170" r="2.6" fill={c.trim} />
    <circle cx="100" cy="180" r="2.6" fill={c.trim} />
    <path d="M69 190 Q100 197 131 190" fill="none" stroke={c.trim} stroke-width="2.5" stroke-linecap="round" />
  {:else if id === 'scientist'}
    <path d="M88 142 Q100 146 112 142 L100 171 Z" fill={c.alt} />
    <path d="M97.4 145.6 h5.2 l-1 3.4 h-3.2 z" fill={c.trim} />
    <path d="M98.4 149 h3.2 l2.3 12.6 l-3.9 4.2 l-3.9 -4.2 z" fill={c.trim} />
    <path d="M86 143 L100 172 M114 143 L100 172" stroke={c.dark} stroke-width="2.2" stroke-linecap="round" fill="none" />
    <path d="M100 172 V198" stroke={c.dark} stroke-width="2" stroke-linecap="round" />
    <rect x="110" y="160" width="12" height="10" rx="2" fill="none" stroke={c.dark} stroke-width="1.8" />
    <rect x="112.4" y="154.6" width="2.6" height="8" rx="1.2" fill={c.trim} />
    <rect x="116.6" y="156.4" width="2.6" height="6.4" rx="1.2" fill="#4a78c2" />
    <rect x="78" y="180" width="13" height="10" rx="2" fill="none" stroke={c.dark} stroke-width="1.8" />
    <circle cx="104" cy="180" r="1.8" fill={c.dark} />
    <circle cx="104" cy="190" r="1.8" fill={c.dark} />
  {:else if id === 'chef'}
    <path d="M86 143 Q100 149 114 143 L114 148 Q100 154 86 148 Z" fill={c.dark} />
    <path d="M91 147 Q100 152 109 147 L104 157 Q100 160 96 157 Z" fill={c.trim} />
    <path d="M108 154 C109.5 168 109.5 183 108 198" stroke={c.dark} stroke-width="1.8" fill="none" stroke-linecap="round" />
    {#each [164, 175, 186] as y}
      <circle cx="93" cy={y} r="2.2" fill={ink} />
      <circle cx="113.5" cy={y} r="2.2" fill={ink} />
    {/each}
  {:else if id === 'gardener'}
    <path d="M82 145 C88 141 94 140 100 140 C106 140 112 141 118 145 L121 158 L79 158 Z" fill={c.alt} />
    <path d="M92 141 L100 148 L108 141" fill="none" stroke="#000" stroke-opacity="0.15" stroke-width="2" stroke-linejoin="round" />
    <rect x="86.5" y="151" width="27" height="25" rx="4" fill={c.main} />
    <rect x="93" y="157.5" width="14" height="9" rx="2" fill="none" stroke={c.dark} stroke-width="1.6" />
    <path d="M89 152 L84.5 144.5 M111 152 L115.5 144.5" stroke={c.main} stroke-width="4.5" stroke-linecap="round" />
    <circle cx="90" cy="154.5" r="2" fill={c.trim} />
    <circle cx="110" cy="154.5" r="2" fill={c.trim} />
    <g transform="translate(100 161.6)">
      {#each [0, 72, 144, 216, 288] as a}
        <circle cx={Math.cos((a * Math.PI) / 180) * 1.9} cy={Math.sin((a * Math.PI) / 180) * 1.9} r="1.5" fill="#ff9fb8" />
      {/each}
      <circle r="1.1" fill="#ffd166" />
    </g>
    <path d="M78 186 h8 M114 186 h8" stroke={c.dark} stroke-width="1.6" stroke-linecap="round" />
  {:else if id === 'artist'}
    <defs>
      <clipPath id="{uid}-body"><path d={BODY} /></clipPath>
    </defs>
    <g clip-path="url(#{uid}-body)">
      {#each [151, 159, 167, 175, 183, 191] as y}
        <rect x="60" {y} width="80" height="3.6" fill={c.alt} />
      {/each}
    </g>
    <path d="M89 144 Q100 151 111 144 L106 152 L100 160 L94 152 Z" fill={c.trim} />
    <circle cx="84" cy="186" r="2.3" fill="#4fb0a0" />
    <circle cx="118" cy="171" r="1.9" fill="#f2c45a" />
    <circle cx="112" cy="188" r="1.5" fill="#e5739a" />
  {:else if id === 'explorer'}
    <path d="M90 141 L100 150 L110 141 L106.5 139.5 L100 145.5 L93.5 139.5 Z" fill={c.dark} />
    <path d="M100 150 V198" stroke={c.dark} stroke-width="1.6" />
    <rect x="84" y="156" width="12" height="11" rx="2" fill={c.dark} opacity="0.45" />
    <path d="M84 156 h12 v4.2 h-12 z" fill={c.dark} />
    <rect x="104" y="156" width="12" height="11" rx="2" fill={c.dark} opacity="0.45" />
    <path d="M104 156 h12 v4.2 h-12 z" fill={c.dark} />
    <path d="M84 146 L124 187" stroke={c.alt} stroke-width="4.5" stroke-linecap="round" />
    <rect x="69" y="180" width="62" height="6" rx="3" fill={c.trim} />
    <rect x="95.5" y="178.5" width="9" height="9" rx="2" fill="none" stroke="#e8c36a" stroke-width="2" />
    <rect x="113" y="183" width="17" height="13" rx="3" fill={c.alt} />
    <path d="M113 186 h17" stroke="#000" stroke-opacity="0.18" stroke-width="2" />
  {:else if id === 'coder'}
    <path d="M84 144 C90 150 110 150 116 144" fill="none" stroke={c.dark} stroke-width="3.2" stroke-linecap="round" />
    <path d="M95 148 L94 162 M105 148 L106 162" stroke={c.trim} stroke-width="1.8" stroke-linecap="round" />
    <circle cx="94" cy="163.6" r="1.9" fill={c.trim} />
    <circle cx="106" cy="163.6" r="1.9" fill={c.trim} />
    <path d="M98 158 l-2.4 2.4 l2.4 2.4 M102 158 l2.4 2.4 l-2.4 2.4" stroke={c.trim} stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M84 187 L88 172 H112 L116 187" fill="none" stroke={c.dark} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
    <path d="M70 192 Q100 198 130 192" fill="none" stroke={c.dark} stroke-width="3" stroke-linecap="round" />
  {:else if id === 'pirate'}
    <defs>
      <clipPath id="{uid}-body"><path d={BODY} /></clipPath>
    </defs>
    <g clip-path="url(#{uid}-body)">
      {#each [150, 158, 166, 174, 182, 190] as y}
        <rect x="60" {y} width="80" height="3.6" fill={c.alt} />
      {/each}
    </g>
    <path d="M82 145 C70 153 68 173 68 197 Q80 199.4 92.5 199.6 L93.5 162 C92.5 154 88.5 148 82 145 Z" fill={c.dark} />
    <path d="M118 145 C130 153 132 173 132 197 Q120 199.4 107.5 199.6 L106.5 162 C107.5 154 111.5 148 118 145 Z" fill={c.dark} />
    <circle cx="90" cy="168" r="1.7" fill={c.trim} />
    <circle cx="90" cy="176" r="1.7" fill={c.trim} />
    <circle cx="110" cy="168" r="1.7" fill={c.trim} />
    <circle cx="110" cy="176" r="1.7" fill={c.trim} />
    <rect x="70" y="182" width="60" height="7" rx="3" fill="#4a3326" />
    <rect x="95" y="180.5" width="10" height="10" rx="2" fill="none" stroke={c.trim} stroke-width="2.2" />
  {:else if id === 'detective'}
    <path d="M90 142 L100 161 L110 142 Z" fill={c.alt} />
    <path d="M98 145.6 h4 l-.8 3 h-2.4 z" fill={c.trim} />
    <path d="M98.8 148.6 h2.4 l1.6 9 l-2.8 3 l-2.8 -3 z" fill={c.trim} />
    <path d="M85 142 L100 163 L92 167 L81 150 Z" fill={c.dark} />
    <path d="M115 142 L100 163 L108 167 L119 150 Z" fill={c.dark} />
    <rect x="69" y="176" width="62" height="6" rx="3" fill={c.dark} />
    <rect x="96" y="175" width="8" height="8" rx="1.5" fill="none" stroke={c.trim} stroke-width="1.8" />
    {#each [[91, 170], [109, 170], [91, 188], [109, 188]] as [x, y]}
      <circle cx={x} cy={y} r="2" fill={c.trim} />
    {/each}
    <path d="M100 182 L103 198" stroke={c.dark} stroke-width="1.6" stroke-linecap="round" />
  {:else if id === 'ninja'}
    <path d="M86 142 L106 171" stroke={c.alt} stroke-width="4" stroke-linecap="round" />
    <path d="M114 142 L101 158" stroke={c.alt} stroke-width="4" stroke-linecap="round" />
    <rect x="69" y="176" width="62" height="8" rx="3" fill={c.trim} />
    <path d="M106 184 l4 10 M110 183 l7 8" stroke={c.trim} stroke-width="3.2" stroke-linecap="round" />
  {:else if id === 'astronaut'}
    <ellipse cx="100" cy="143.5" rx="17.5" ry="5.2" fill={c.dark} />
    <ellipse cx="100" cy="142.4" rx="13" ry="3.2" fill="#9aa6b8" />
    <rect x="90" y="155" width="20" height="14" rx="3" fill={c.alt} />
    <circle cx="95" cy="160" r="1.8" fill="#ff6b6b" />
    <circle cx="100" cy="160" r="1.8" fill="#ffd166" />
    <circle cx="105" cy="160" r="1.8" fill="#6ee7b7" />
    <rect x="93" y="164" width="14" height="2.4" rx="1.2" fill="#fff" opacity="0.85" />
    <circle cx="118" cy="153" r="4.6" fill={c.trim} />
    <path d={star(118, 153, 2.8)} fill="#fff" />
    <path d="M84 150 C80 162 86 172 90 178" stroke={c.trim} stroke-width="2.2" fill="none" stroke-linecap="round" />
    <rect x="69" y="180" width="62" height="6" rx="3" fill={c.dark} />
  {:else if id === 'guardian'}
    <path d="M84 150 Q100 145 116 150 L114 180 Q100 187 86 180 Z" fill={c.dark} stroke={c.trim} stroke-width="1.5" stroke-linejoin="round" />
    <path d="M100 154.5 c4.5 4.6 6.6 7.8 6.6 11 a6.6 6.6 0 0 1-13.2 0 c0-3.2 2.2-6.4 6.6-11z" fill={c.trim} />
    <path d="M100 161.5 c2 2.2 3 3.6 3 5 a3 3 0 0 1-6 0 c0-1.4 1-2.8 3-5z" fill="#fff4cf" />
    <ellipse cx="80" cy="148" rx="12" ry="7.5" fill={c.dark} stroke={c.trim} stroke-width="1.4" />
    <ellipse cx="120" cy="148" rx="12" ry="7.5" fill={c.dark} stroke={c.trim} stroke-width="1.4" />
    <rect x="70" y="184" width="60" height="6" rx="3" fill={c.alt} />
    <circle cx="100" cy="187" r="3.4" fill={c.trim} />
  {:else if id === 'oracle'}
    <path d="M88 142 L100 151 L112 142" fill="none" stroke={c.alt} stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />
    <path d="M103.5 152.5 A8.5 8.5 0 1 0 103.5 169.5 A6.6 6.6 0 1 1 103.5 152.5 Z" fill={c.trim} />
    {#each [[84, 168, 2.4], [116, 179, 2.2], [89, 189, 1.8], [117, 158, 1.8], [79, 182, 1.6], [109, 192, 1.6]] as [x, y, r]}
      <path d={star(x, y, r)} fill={c.trim} opacity="0.85" />
    {/each}
    <path d="M69 192 Q100 199 131 192" fill="none" stroke={c.trim} stroke-width="2.4" stroke-linecap="round" />
  {:else if id === 'frost'}
    <g transform="translate(100 168)" stroke={c.trim} stroke-width="1.9" stroke-linecap="round" fill="none">
      <path d="M0 -8.5 V8.5 M-7.4 -4.2 L7.4 4.2 M-7.4 4.2 L7.4 -4.2" />
      <path d="M-2.6 -6.4 L0 -4.2 L2.6 -6.4 M-2.6 6.4 L0 4.2 L2.6 6.4" />
    </g>
    <path d="M68.5 194 Q100 201.5 131.5 194" stroke={c.alt} stroke-width="6" fill="none" stroke-linecap="round" />
  {:else if id === 'timekeeper'}
    <path d="M88 142 L100 160 L112 142" fill="none" stroke={c.dark} stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round" />
    <path d="M95.6 144.6 h8.8 l-2.2 6.4 h-4.4 z" fill="#f3ead8" />
    <g transform="translate(87 170)">
      {#each [0, 45, 90, 135] as a}
        <rect x="-1.6" y="-8" width="3.2" height="16" rx="1" fill={c.trim} transform="rotate({a})" />
      {/each}
      <circle r="6" fill={c.trim} />
      <circle r="2.2" fill={c.main} />
    </g>
    {#each [166, 176, 186] as y}
      <circle cx="100" cy={y} r="1.8" fill={c.trim} />
    {/each}
    <path d="M100 176 Q110 186 119 177" fill="none" stroke={c.trim} stroke-width="1.5" stroke-dasharray="1.6 1.6" />
    <circle cx="120" cy="176.5" r="3.4" fill={c.trim} />
    <path d="M69 192 Q100 199 131 192" stroke={c.trim} stroke-width="2.2" fill="none" stroke-linecap="round" />
  {:else if id === 'sovereign'}
    <path d="M88 142 L100 156 L112 142" fill="none" stroke={c.trim} stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />
    <g transform="translate(100 172)">
      {#each [0, 45, 90, 135, 180, 225, 270, 315] as a}
        <path d="M0 -9 V-12.5" stroke={c.trim} stroke-width="2" stroke-linecap="round" transform="rotate({a})" />
      {/each}
      <circle r="7" fill={c.trim} />
      <path d="M0 -4.5 c2.6 2.7 3.8 4.6 3.8 6.4 a3.8 3.8 0 0 1-7.6 0 c0-1.8 1.2-3.7 3.8-6.4z" fill={c.alt} />
    </g>
    {#each [74, 84, 94, 104, 114, 124] as x}
      <path d="M{x - 5} 193 q5 8 10 0" fill={c.alt} />
    {/each}
  {/if}
{:else if layer === 'front'}
  {#if id === 'frost'}
    {#each [[77, 151], [83, 146], [90.5, 143], [100, 142], [109.5, 143], [117, 146], [123, 151]] as [x, y]}
      <circle cx={x} cy={y} r="5.8" fill={c.alt} />
    {/each}
    <path d="M80 152 Q100 158 120 152" fill="none" stroke="#000" stroke-opacity="0.06" stroke-width="2" />
  {/if}
{:else}
  {#if id === 'wizard'}
    <path d="M66 122 L74 205" stroke="#8a5a3b" stroke-width="4.5" stroke-linecap="round" />
    <circle class="orb-glow" cx="65.5" cy="116" r="12" fill="#ffb04a" opacity="0.25" />
    <circle cx="65.5" cy="116" r="7.5" fill="url(#{uid}-orb)" />
  {:else if id === 'knight'}
    <rect x="127" y="128" width="4.6" height="48" rx="2.3" fill="#e9eef5" stroke="#9aa6b8" stroke-width="1.2" />
    <rect x="121" y="174" width="17" height="4.5" rx="2.2" fill={c.trim} />
    <path d="M54 160 h24 v12 c0 9-6 15-12 18 c-6-3-12-9-12-18 z" fill={c.dark} stroke="#c5cedb" stroke-width="2" stroke-linejoin="round" />
    <path d="M66 166 c2.6 2.8 4 4.8 4 6.6 a4 4 0 0 1-8 0 c0-1.8 1.5-3.8 4-6.6z" fill={c.trim} />
  {:else if id === 'ranger'}
    <path d="M137 130 Q156 168 135 206" fill="none" stroke="#8a5a3b" stroke-width="4" stroke-linecap="round" />
    <path d="M137 130 L135 206" stroke="#efe6d2" stroke-width="1.2" />
  {:else if id === 'bard'}
    <path d="M58 168 L48 132" stroke="#7a4e32" stroke-width="5" stroke-linecap="round" />
    <rect x="43" y="124" width="9" height="11" rx="2.5" fill="#5b3d2e" transform="rotate(-18 47.5 129.5)" />
    <ellipse cx="62" cy="180" rx="13" ry="15.5" fill="#c8894b" />
    <ellipse cx="62" cy="180" rx="13" ry="15.5" fill="none" stroke="#8a5a3b" stroke-width="2" />
    <circle cx="61" cy="176" r="4" fill="#5b3d2e" />
  {:else if id === 'scientist'}
    <path d="M125.5 152 h7 v9 l7.5 15 a3.5 3.5 0 0 1 -3.1 5 h-15.8 a3.5 3.5 0 0 1 -3.1 -5 l7.5 -15 z" fill="#eaf6fd" stroke="#9fc3d8" stroke-width="1.5" stroke-linejoin="round" />
    <path d="M120.3 174.4 l3.2 -6.4 h11 l3.2 6.4 a2.4 2.4 0 0 1 -2.1 3.6 h-13.2 a2.4 2.4 0 0 1 -2.1 -3.6 z" fill={c.trim} opacity="0.88" />
    <circle class="bubble b1" cx="126.5" cy="171" r="1.6" fill="#fff" opacity="0.85" />
    <circle class="bubble b2" cx="131.5" cy="173" r="1.1" fill="#fff" opacity="0.85" />
    <rect x="124.5" y="149" width="9" height="4" rx="1.6" fill="#c9a07a" />
  {:else if id === 'chef'}
    <path d="M129 190 L137 147" stroke="#b07a4f" stroke-width="3.6" stroke-linecap="round" />
    <ellipse cx="138.4" cy="140" rx="5.2" ry="7.6" transform="rotate(10 138.4 140)" fill="#c58c5c" />
    <ellipse cx="138.4" cy="139.4" rx="3" ry="5" transform="rotate(10 138.4 139.4)" fill="#a8703f" opacity="0.45" />
  {:else if id === 'gardener'}
    <path d="M52 176 L37 162" stroke="#5aa3bd" stroke-width="4.2" stroke-linecap="round" />
    <ellipse cx="35.6" cy="160.6" rx="4" ry="2.6" transform="rotate(-42 35.6 160.6)" fill="#4b8fa8" />
    <rect x="49" y="167" width="23" height="21" rx="4.5" fill="#6fb6cc" />
    <rect x="49" y="178" width="23" height="3.2" fill="#4b8fa8" />
    <path d="M71 170 C79 170 79 184 71 184" fill="none" stroke="#4b8fa8" stroke-width="3" stroke-linecap="round" />
    <circle class="drop d1" cx="31" cy="166" r="1.4" fill="#8fd0ea" />
    <circle class="drop d2" cx="34" cy="169" r="1.2" fill="#8fd0ea" />
  {:else if id === 'artist'}
    <path d="M44 176 C40 166 50 158 62 160 C72 162 78 170 74 178 C71 184 64 182 62 186 C60 192 50 192 46 186 C44 183 45 180 44 176 Z" fill="#dcb78c" />
    <circle cx="66" cy="177" r="3" fill="#000" opacity="0.14" />
    <circle cx="52" cy="168" r="3" fill="#e5484d" />
    <circle cx="60" cy="165" r="3" fill="#f2c45a" />
    <circle cx="68" cy="168.5" r="2.8" fill="#4a78c2" />
    <circle cx="50" cy="177.5" r="2.8" fill="#3e9b6e" />
    <circle cx="55" cy="185" r="2.5" fill="#e5739a" />
    <path d="M129 189 L138 154" stroke="#8a5a3b" stroke-width="2.6" stroke-linecap="round" />
    <path d="M136.6 155 L138.4 149 L141.2 149.8 L139.6 155.6 Z" fill="#c9ccd8" />
    <path d="M138.4 149.4 C138.4 145 140.2 141.6 142.4 140.4 C143 143 142.6 146.4 141.2 150.2 Z" fill={c.trim} />
  {:else if id === 'explorer'}
    <g transform="rotate(-8 58 172)">
      <path d="M44 160 L52 163 L60 160 L68 163 V185 L60 182 L52 185 L44 182 Z" fill="#f3e6c8" stroke="#c9b08a" stroke-width="1.2" stroke-linejoin="round" />
      <path d="M52 163 V185 M60 160 V182" stroke="#c9b08a" stroke-width="1" />
      <path d="M47 178 C52 172 56 176 59 170 C61 166 63 167 64 166" fill="none" stroke="#c0533f" stroke-width="1.4" stroke-dasharray="2 2" stroke-linecap="round" />
      <path d="M62.5 164 l3.2 3.2 M65.7 164 l-3.2 3.2" stroke="#c0533f" stroke-width="1.6" stroke-linecap="round" />
    </g>
  {:else if id === 'coder'}
    <g transform="rotate(-12 61 176)">
      <rect x="48" y="158" width="26" height="35" rx="3.5" fill={c.alt} />
      <rect x="50.5" y="160.5" width="21" height="30" rx="2" fill="#fff" opacity="0.08" />
      <path d="M61 170 c2.6 2.8 3.8 4.6 3.8 6.4 a3.8 3.8 0 0 1-7.6 0 c0-1.8 1.2-3.6 3.8-6.4z" fill="#ff9a4d" />
    </g>
  {:else if id === 'pirate'}
    <g transform="rotate(-58 129 186)">
      <rect x="126" y="180.5" width="20" height="11" rx="2.4" fill="#7a5233" />
      <rect x="145" y="181.6" width="13" height="8.8" rx="1.8" fill={c.trim} />
      <rect x="157" y="182.6" width="11" height="6.8" rx="1.6" fill="#7a5233" />
      <rect x="166" y="182.2" width="3.4" height="7.6" rx="1.2" fill={c.trim} />
      <rect x="141.5" y="179.6" width="3.6" height="12.8" rx="1.2" fill={c.trim} />
      <rect x="128" y="182" width="16" height="2.2" rx="1" fill="#fff" opacity="0.18" />
    </g>
  {:else if id === 'detective'}
    <path d="M129 186 L135 165" stroke="#5b3d2e" stroke-width="4" stroke-linecap="round" />
    <circle cx="137.4" cy="155" r="9.5" fill="#dff1ff" fill-opacity="0.55" stroke="#c9a35c" stroke-width="3" />
    <path d="M132.4 151 q3 -3 7 -2.5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.9" />
  {:else if id === 'ninja'}
    <g transform="rotate(-20 62 176)">
      <rect x="50" y="170" width="24" height="10" rx="5" fill="#f3e6c8" />
      <rect x="47" y="168.5" width="4" height="13" rx="2" fill="#8a5a3b" />
      <rect x="73" y="168.5" width="4" height="13" rx="2" fill="#8a5a3b" />
      <path d="M58 171 v8 M64 171 v8" stroke={c.trim} stroke-width="1.6" />
    </g>
  {:else if id === 'astronaut'}
    <circle cx="56" cy="170" r="16" fill={c.main} stroke={c.dark} stroke-width="2" />
    <path d="M44 167 a12 10 0 0 1 24 0 v4 a12 9 0 0 1 -24 0 z" fill="#27365f" />
    <path d="M47.5 165 q4 -5 10 -5" stroke="#9fc6ff" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.9" />
    <rect x="50" y="183.5" width="12" height="4" rx="2" fill={c.dark} />
    <circle cx="66.5" cy="160" r="2.2" fill={c.trim} />
  {:else if id === 'guardian'}
    <circle class="orb-glow" cx="66" cy="199" r="13" fill="#ffb04a" opacity="0.22" />
    <path d="M60 191 C60 182 72 182 72 191" fill="none" stroke="#5b3d2e" stroke-width="2" />
    <rect x="58" y="189" width="16" height="4" rx="1.6" fill="#5b3d2e" />
    <rect x="59.5" y="193" width="13" height="13" rx="3" fill="#ffe7a6" fill-opacity="0.55" stroke="#5b3d2e" stroke-width="2" />
    <path class="flicker" d="M66 195.6 c2.6 3 3.6 5 3.6 6.8 a3.6 3.6 0 0 1-7.2 0 c0-1.8 1-3.8 3.6-6.8z" fill="#ff9a4d" />
    <rect x="58" y="205.5" width="16" height="3.5" rx="1.5" fill="#5b3d2e" />
  {:else if id === 'oracle'}
    <path d="M66 126 L74 205" stroke="#c9ccd8" stroke-width="4" stroke-linecap="round" />
    <circle class="orb-glow" cx="66" cy="114" r="13" fill={c.alt} opacity="0.3" />
    <path d="M70.5 103.5 A12 12 0 1 0 77.5 121 A9.4 9.4 0 1 1 70.5 103.5 Z" fill={c.trim} />
    <path d={star(61, 112, 2.2)} fill={c.trim} />
  {:else if id === 'frost'}
    <path d="M129 190 L136 151" stroke="#e8f6ff" stroke-width="3" stroke-linecap="round" />
    <circle class="orb-glow" cx="137" cy="141" r="11" fill="#bfe7ff" opacity="0.35" />
    <path d="M137 131 l6 9 l-6 10.5 l-6 -10.5 z" fill="#bfe7ff" stroke="#fff" stroke-width="1.2" stroke-linejoin="round" />
    <path d="M137 131 v19.5 M131 140 h12" stroke="#fff" stroke-width="0.8" opacity="0.7" />
  {:else if id === 'timekeeper'}
    <g transform="translate(58 171)">
      <path d="M-7 -10.5 C-7 -3 -2 -1 -2 0 C-2 1 -7 3 -7 10.5 H7 C7 3 2 1 2 0 C2 -1 7 -3 7 -10.5 Z" fill="#e8f6ff" fill-opacity="0.65" stroke={c.alt} stroke-width="1.2" />
      <path d="M-4.6 -7 H4.6 C4 -3.6 1.6 -1.8 0 -0.6 C-1.6 -1.8 -4 -3.6 -4.6 -7 Z" fill={c.trim} />
      <path d="M-5.6 10.5 C-4 6.4 -1 5.2 0 5.2 C1 5.2 4 6.4 5.6 10.5 Z" fill={c.trim} />
      <path class="sand" d="M0 -0.4 V7" stroke={c.trim} stroke-width="0.9" />
      <path d="M-8.6 -10.5 V10.5 M8.6 -10.5 V10.5" stroke={c.alt} stroke-width="1.8" />
      <rect x="-10.5" y="-14" width="21" height="3.6" rx="1.6" fill={c.alt} />
      <rect x="-10.5" y="10.4" width="21" height="3.6" rx="1.6" fill={c.alt} />
    </g>
  {:else if id === 'sovereign'}
    <path d="M129 196 L137 137" stroke={c.trim} stroke-width="3.6" stroke-linecap="round" />
    <circle class="orb-glow" cx="137.6" cy="128" r="13" fill="#ffb04a" opacity="0.25" />
    <path d="M137.6 118 c4.6 4.8 6.8 8 6.8 11.4 a6.8 6.8 0 0 1-13.6 0 c0-3.4 2.2-6.6 6.8-11.4z" fill="url(#{uid}-orb)" />
    <ellipse cx="137.4" cy="137" rx="5.2" ry="2.2" fill={c.trim} />
  {/if}
{/if}

<style>
  .wing {
    transform-box: view-box;
  }
  .wl {
    transform-origin: 84px 160px;
  }
  .wr {
    transform-origin: 116px 160px;
  }
  :global(.avatar.animate) .wl {
    animation: wing-l 3.2s ease-in-out infinite;
  }
  :global(.avatar.animate) .wr {
    animation: wing-r 3.2s ease-in-out infinite;
  }
  @keyframes wing-l {
    50% {
      transform: rotate(-5deg);
    }
  }
  @keyframes wing-r {
    50% {
      transform: rotate(5deg);
    }
  }
  .bubble,
  .drop,
  .flicker,
  .orb-glow {
    transform-box: fill-box;
    transform-origin: center;
  }
  :global(.avatar.animate) .bubble {
    animation: bubble 2.4s ease-in infinite;
  }
  :global(.avatar.animate) .b2 {
    animation-delay: -1.2s;
  }
  :global(.avatar.animate) .drop {
    animation: drip 1.8s ease-in infinite;
  }
  :global(.avatar.animate) .d2 {
    animation-delay: -0.9s;
  }
  :global(.avatar.animate) .flicker {
    animation: flicker 1.6s ease-in-out infinite;
    transform-origin: 50% 90%;
  }
  :global(.avatar.animate) .orb-glow {
    animation: orb 2.4s ease-in-out infinite;
  }
  @keyframes orb {
    0%,
    100% {
      opacity: 0.18;
      transform: scale(0.94);
    }
    50% {
      opacity: 0.32;
      transform: scale(1.06);
    }
  }
  @keyframes bubble {
    0% {
      transform: translateY(0);
      opacity: 0;
    }
    20% {
      opacity: 0.9;
    }
    100% {
      transform: translateY(-9px);
      opacity: 0;
    }
  }
  @keyframes drip {
    0% {
      transform: translate(0, 0);
      opacity: 0;
    }
    25% {
      opacity: 1;
    }
    100% {
      transform: translate(-2px, 10px);
      opacity: 0;
    }
  }
  @keyframes flicker {
    0%,
    100% {
      transform: scale(1, 1);
    }
    30% {
      transform: scale(0.92, 1.08);
    }
    60% {
      transform: scale(1.05, 0.94);
    }
  }
</style>
