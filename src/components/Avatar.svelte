<script lang="ts">
  import type { Look } from '../lib/types';
  import { rankFor, rankIndex } from '../lib/game';
  import { character, toneOf } from '../lib/characters';
  import PetArt from './PetArt.svelte';
  import HatArt from './HatArt.svelte';
  import ClassArt from './ClassArt.svelte';
  import AccessoryArt from './AccessoryArt.svelte';

  let {
    look,
    hat = null,
    pet = null,
    acc = null,
    level = 1,
    size = 200,
    crop = 'full',
    animate = true,
    decorations = true,
  }: {
    look: Look;
    hat?: string | null;
    pet?: string | null;
    acc?: string | null;
    level?: number;
    size?: number;
    crop?: 'full' | 'head' | 'bust' | 'hat' | 'figure';
    animate?: boolean;
    decorations?: boolean;
  } = $props();

  const SKIN = ['#ffe3cc', '#f6cfab', '#e3ad83', '#c78c60', '#9c6541', '#6f462b'];
  const SKIN_SHADE = ['#f2c8a9', '#e6b48e', '#cd9368', '#ad744a', '#805131', '#58371f'];
  const HAIR = ['#2c2226', '#5b3a29', '#9a5631', '#dcae62', '#c9503c', '#8f8aa6', '#efe3cb', '#3f5f8f'];
  const HAIR_SHADE = ['#1a1316', '#43291c', '#7a4224', '#bf8f48', '#a63d2c', '#716c89', '#d4c3a2', '#2e4870'];

  const uid = `av${Math.random().toString(36).slice(2, 8)}`;

  const skin = $derived(SKIN[look.skin] ?? SKIN[1]);
  const skinShade = $derived(SKIN_SHADE[look.skin] ?? SKIN_SHADE[1]);
  const hairC = $derived(HAIR[look.hairColor] ?? HAIR[1]);
  const hairS = $derived(HAIR_SHADE[look.hairColor] ?? HAIR_SHADE[1]);
  const def = $derived(character(look.heroClass));
  const cls = $derived(toneOf(look.heroClass, look.tone ?? 0));
  const rank = $derived(rankFor(level));
  const tier = $derived(decorations ? rankIndex(level) : 0);
  // Some outfits already have something at the neck; the rank scarf would only crowd them.
  const scarf = $derived(tier >= 1 && acc !== 'acc_bowtie' && !['chef', 'artist', 'frost', 'astronaut', 'coder'].includes(look.heroClass));
  const viewBox = $derived(
    crop === 'head'
      ? '38 26 124 124'
      : crop === 'bust'
        ? '22 6 156 170'
        : crop === 'hat'
          ? '28 -8 144 144'
          : crop === 'figure'
            ? '22 30 156 184'
            : '0 0 200 220',
  );
  const height = $derived(crop === 'full' ? size * 1.1 : crop === 'bust' ? (size * 170) / 156 : crop === 'figure' ? (size * 184) / 156 : size);
  // A hat hides the top of the hair; long hair stays visible at the back.
  const hatCoversTop = $derived(
    ['hat_beanie', 'hat_viking', 'hat_wizard', 'hat_cap', 'hat_chef', 'hat_safari', 'hat_fedora', 'hat_tricorn', 'hat_straw', 'hat_beret'].includes(hat ?? ''),
  );
</script>

<svg
  class="avatar"
  class:animate
  width={size}
  {height}
  {viewBox}
  aria-hidden="true"
>
  <defs>
    <radialGradient id="{uid}-aura" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color={rank.glow} stop-opacity="0.75" />
      <stop offset="0.6" stop-color={rank.glow} stop-opacity="0.22" />
      <stop offset="1" stop-color={rank.glow} stop-opacity="0" />
    </radialGradient>
    <radialGradient id="{uid}-orb" cx="0.4" cy="0.35" r="0.7">
      <stop offset="0" stop-color="#fff3c4" />
      <stop offset="0.5" stop-color="#ffb04a" />
      <stop offset="1" stop-color="#e2493f" />
    </radialGradient>
  </defs>

  {#if tier >= 3 && crop === 'full'}
    <circle class="aura" cx="100" cy="118" r="98" fill="url(#{uid}-aura)" />
  {/if}

  {#if crop === 'full'}
    <ellipse cx="100" cy="209" rx="46" ry="6.5" fill="#000" opacity="0.13" />
  {/if}

  <g class="bob">
    <!-- cape (Master and above) -->
    {#if tier >= 2}
      <path
        d="M78 146 C68 162 62 184 60 205 C82 210 118 210 140 205 C138 184 132 162 122 146 Z"
        fill={rank.color}
      />
      <path d="M78 146 C70 162 66 182 64 204 L72 205 C74 184 78 164 86 150 Z" fill="#000" opacity="0.12" />
    {/if}

    <!-- outfit pieces behind the body (wings, hood, sword, backpack) -->
    <ClassArt id={look.heroClass} c={cls} layer="back" {uid} />
    {#if acc}<AccessoryArt id={acc} layer="back" />{/if}

    <!-- back hair -->
    {#if look.hair === 1}
      <path d="M53 92 C48 128 51 160 63 173 C76 180 124 180 137 173 C149 160 152 128 147 92 Z" fill={hairS} />
    {:else if look.hair === 4}
      <path
        class="pony"
        d="M132 64 C160 70 170 104 160 138 C156 149 147 153 142 148 C153 127 151 99 130 80 Z"
        fill={hairC}
      />
    {/if}

    <!-- legs & boots -->
    <rect x="86" y="188" width="11" height="17" rx="4" fill={def.legs ?? '#3b3247'} />
    <rect x="103" y="188" width="11" height="17" rx="4" fill={def.legs ?? '#3b3247'} />
    <ellipse cx="91" cy="206" rx="9.5" ry="4.8" fill={def.boots ?? '#5b3d2e'} />
    <ellipse cx="109" cy="206" rx="9.5" ry="4.8" fill={def.boots ?? '#5b3d2e'} />

    <!-- body -->
    <path
      d="M68 197 C68 173 70 153 82 145 C88 141 94 140 100 140 C106 140 112 141 118 145 C130 153 132 173 132 197 Q100 202 68 197 Z"
      fill={cls.main}
    />
    <path d="M68 197 C68 173 70 153 82 145 C78 160 77 178 80 199 Q73 198.5 68 197 Z" fill="#000" opacity="0.1" />
    <ClassArt id={look.heroClass} c={cls} layer="torso" {uid} />

    <!-- scarf (Diligent and above) -->
    {#if scarf}
      <path d="M80 142 C90 149 110 149 120 142 L121 149 C110 156 90 156 79 149 Z" fill={rank.color} />
      <path d="M108 151 L116 172 L107 169 L103 153 Z" fill={rank.color} />
      <path d="M108 151 L116 172 L112 171 Z" fill="#000" opacity="0.12" />
    {/if}
    {#if acc}<AccessoryArt id={acc} layer="chest" />{/if}

    <!-- held item (behind the hands) -->
    <ClassArt id={look.heroClass} c={cls} layer="held" {uid} />

    <!-- arms & hands -->
    <path d="M81 150 Q72 165 71 181" fill="none" stroke={cls.sleeve ?? cls.dark} stroke-width="13" stroke-linecap="round" />
    <path d="M119 150 Q128 165 129 181" fill="none" stroke={cls.sleeve ?? cls.dark} stroke-width="13" stroke-linecap="round" />
    <circle cx="71" cy="185" r="6.6" fill={def.gloves ?? skin} />
    <circle cx="129" cy="185" r="6.6" fill={def.gloves ?? skin} />
    <ClassArt id={look.heroClass} c={cls} layer="front" {uid} />

    <!-- neck -->
    <rect x="93" y="127" width="14" height="16" rx="5" fill={skinShade} />

    <!-- head -->
    <circle cx="57" cy="97" r="8.5" fill={skin} />
    <circle cx="143" cy="97" r="8.5" fill={skin} />
    <circle cx="57.5" cy="97" r="4.2" fill={skinShade} />
    <circle cx="142.5" cy="97" r="4.2" fill={skinShade} />
    <circle cx="100" cy="92" r="44" fill={skin} />

    <!-- face -->
    <ellipse cx="73" cy="111" rx="6.8" ry="4.2" fill="#ff8f80" opacity="0.38" />
    <ellipse cx="127" cy="111" rx="6.8" ry="4.2" fill="#ff8f80" opacity="0.38" />
    <path d="M78 87.5 q6 -3.6 12 0" fill="none" stroke={hairS} stroke-width="2.6" stroke-linecap="round" />
    <path d="M110 87.5 q6 -3.6 12 0" fill="none" stroke={hairS} stroke-width="2.6" stroke-linecap="round" />
    <g class="eyes">
      <ellipse cx="84" cy="100" rx="5" ry="6.2" fill="#2a2230" />
      <ellipse cx="116" cy="100" rx="5" ry="6.2" fill="#2a2230" />
      <circle cx="85.8" cy="97.6" r="1.9" fill="#fff" />
      <circle cx="117.8" cy="97.6" r="1.9" fill="#fff" />
      <circle cx="82.6" cy="102.6" r="0.9" fill="#fff" opacity="0.8" />
      <circle cx="114.6" cy="102.6" r="0.9" fill="#fff" opacity="0.8" />
      {#if look.body === 'f'}
        <path d="M79.6 96.2 l-3.4 -2.4 M120.4 96.2 l3.4 -2.4" stroke="#2a2230" stroke-width="2" stroke-linecap="round" />
      {/if}
    </g>
    <path d="M98.6 106.5 q1.4 1.3 2.8 0" fill="none" stroke={skinShade} stroke-width="2" stroke-linecap="round" />
    <path d="M93.5 113 q6.5 6 13 0" fill="#b5524a" stroke="#2a2230" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />

    <!-- front hair (spikes tuck under a full hat) -->
    {#if look.hair === 0 || (look.hair === 5 && hatCoversTop)}
      <path
        d="M56 98 C49 64 71 44 100 44 C130 44 152 62 145 98 C142 86 137 78 129 72 C122 80 108 84 92 82 C98 78 101 73 102 68 C92 76 74 80 64 82 C60 87 57 92 56 98 Z"
        fill={hairC}
      />
      <path d="M102 68 C92 76 74 80 64 82 C76 74 90 70 102 68 Z" fill={hairS} />
    {:else if look.hair === 1}
      <path
        d="M55 106 C47 64 72 44 100 44 C128 44 153 64 145 106 C140 90 132 76 116 68 C110 72 104 70 100 63 C96 70 90 72 84 68 C68 76 60 90 55 106 Z"
        fill={hairC}
      />
      <path d="M55 106 C52 120 53 134 58 146 C56 128 58 114 62 100 Z" fill={hairC} />
      <path d="M145 106 C148 120 147 134 142 146 C144 128 142 114 138 100 Z" fill={hairC} />
    {:else if look.hair === 2}
      {#if !hatCoversTop}
        <circle cx="100" cy="41" r="15" fill={hairC} />
        <path d="M88 47 Q100 52 112 47" fill="none" stroke={hairS} stroke-width="2.4" stroke-linecap="round" />
      {/if}
      <path d="M56 96 C51 62 74 46 100 46 C126 46 149 62 144 96 C138 82 124 72 100 71 C76 72 62 82 56 96 Z" fill={hairC} />
      <path d="M100 47 C96 56 96 64 100 71" fill="none" stroke={hairS} stroke-width="2" stroke-linecap="round" opacity="0.7" />
    {:else if look.hair === 3}
      <path d="M58 92 C56 64 76 50 100 50 C124 50 144 64 142 92 C130 80 116 76 100 76 C84 76 70 80 58 92 Z" fill={hairC} />
      {#each [[59, 92], [61, 76], [71, 61], [85, 52], [100, 49], [115, 52], [129, 61], [139, 76], [141, 92], [79, 70], [94, 66], [109, 66], [122, 71]] as [cx, cy]}
        <circle {cx} {cy} r="12.5" fill={hairC} />
      {/each}
      {#each [[86, 60], [112, 61], [70, 80], [131, 82]] as [cx, cy]}
        <path d="M{cx - 5} {cy} q5 -5 10 0" fill="none" stroke={hairS} stroke-width="2" stroke-linecap="round" opacity="0.7" />
      {/each}
    {:else if look.hair === 4}
      <path d="M56 96 C51 62 74 45 100 45 C126 45 149 62 144 96 C140 84 132 76 118 72 C108 76 92 76 82 72 C68 78 60 86 56 96 Z" fill={hairC} />
      <path d="M118 72 C108 76 92 76 82 72 C94 70 108 68 118 72 Z" fill={hairS} />
      <circle cx="137" cy="66" r="5" fill={cls.trim} />
    {:else}
      <path
        d="M56 98 C52 72 61 58 70 53 L64 40 L80 47 L83 32 L95 44 L102 29 L109 44 L121 34 L121 49 L135 43 L131 56 C144 64 149 80 144 98 C138 85 128 77 115 74 L107 81 L100 72 L92 80 L86 74 C72 76 62 85 56 98 Z"
        fill={hairC}
      />
    {/if}

    {#if acc}<AccessoryArt id={acc} layer="face" />{/if}

    <!-- headwear -->
    {#if hat}
      <HatArt id={hat} />
    {/if}

    <!-- immortal halo / mythic motes -->
    {#if tier >= 5}
      <ellipse class="halo" cx="100" cy={hat ? 14 : 34} rx="26" ry="6" fill="none" stroke="#ffe08a" stroke-width="3.2" />
    {/if}
    {#if tier >= 4 && crop === 'full'}
      <g class="motes" fill={rank.glow}>
        <path class="m1" d="M40 70 l1.6 3.4 3.4 1.6-3.4 1.6-1.6 3.4-1.6-3.4-3.4-1.6 3.4-1.6z" />
        <path class="m2" d="M162 52 l1.3 2.8 2.8 1.3-2.8 1.3-1.3 2.8-1.3-2.8-2.8-1.3 2.8-1.3z" />
        <path class="m3" d="M168 120 l1.1 2.4 2.4 1.1-2.4 1.1-1.1 2.4-1.1-2.4-2.4-1.1 2.4-1.1z" />
      </g>
    {/if}
  </g>

  {#if pet && crop === 'full'}
    <g class="pet" transform="translate(146 160)">
      <PetArt id={pet} />
    </g>
  {/if}
</svg>

<style>
  .avatar {
    display: block;
    overflow: visible;
  }
  .bob,
  .pet,
  .eyes,
  .aura,
  .halo,
  .motes path {
    transform-box: fill-box;
    transform-origin: center;
  }
  .animate .bob {
    animation: bob 3.6s ease-in-out infinite;
    transform-box: view-box;
  }
  .animate .eyes {
    animation: blink 5.6s infinite;
  }
  .animate .pet {
    animation: petbob 2.6s ease-in-out infinite;
    animation-delay: -0.8s;
  }
  .animate .aura {
    animation: pulse 4s ease-in-out infinite;
  }
  .animate .halo {
    animation: halo 3.6s ease-in-out infinite;
  }
  .animate .motes .m1 {
    animation: mote 3.2s ease-in-out infinite;
  }
  .animate .motes .m2 {
    animation: mote 3.8s ease-in-out infinite -1.2s;
  }
  .animate .motes .m3 {
    animation: mote 3.5s ease-in-out infinite -2s;
  }
  @keyframes bob {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-2.5px);
    }
  }
  @keyframes petbob {
    0%,
    100% {
      transform: translate(146px, 160px);
    }
    50% {
      transform: translate(146px, 156px);
    }
  }
  @keyframes blink {
    0%,
    94%,
    100% {
      transform: scaleY(1);
    }
    96% {
      transform: scaleY(0.1);
    }
  }
  @keyframes pulse {
    0%,
    100% {
      opacity: 0.7;
      transform: scale(0.97);
    }
    50% {
      opacity: 1;
      transform: scale(1.03);
    }
  }
  @keyframes halo {
    0%,
    100% {
      transform: translateY(0);
      opacity: 0.85;
    }
    50% {
      transform: translateY(-3px);
      opacity: 1;
    }
  }
  @keyframes mote {
    0%,
    100% {
      transform: translateY(0) scale(1);
      opacity: 0.4;
    }
    50% {
      transform: translateY(-6px) scale(1.2);
      opacity: 1;
    }
  }
  :global(html.reduce-motion) .avatar * {
    animation: none !important;
  }
</style>
