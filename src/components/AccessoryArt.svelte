<svelte:options namespace="svg" />

<script lang="ts">
  // avatar coords: eyes (84,100) (116,100), ears (57,97) (143,97), neck (100,141)
  // layers: back = behind the body, chest = on the clothes, face = over the head
  let { id, layer }: { id: string; layer: 'back' | 'chest' | 'face' } = $props();

  const star = (x: number, y: number, r: number) => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(2)} ${(y + Math.sin(a) * rr).toFixed(2)} `;
    }
    return d + 'Z';
  };
</script>

{#if layer === 'back'}
  {#if id === 'acc_backpack'}
    <rect x="71" y="136" width="58" height="48" rx="13" fill="#e07a5f" />
    <rect x="71" y="136" width="58" height="10" rx="5" fill="#c4644b" />
  {/if}
{:else if layer === 'chest'}
  {#if id === 'acc_backpack'}
    <path d="M85 145 C82 158 82 170 84 182 M115 145 C118 158 118 170 116 182" stroke="#c4644b" stroke-width="4.5" fill="none" stroke-linecap="round" />
    <rect x="80.5" y="160" width="6" height="4" rx="1.5" fill="#f2c45a" />
    <rect x="113.5" y="160" width="6" height="4" rx="1.5" fill="#f2c45a" />
  {:else if id === 'acc_bowtie'}
    <path d="M100 145 L88 139 Q85.5 145 88 151 Z" fill="#c0392b" />
    <path d="M100 145 L112 139 Q114.5 145 112 151 Z" fill="#c0392b" />
    <path d="M90.5 141.5 L96 144.4 M90.5 148.5 L96 145.6 M109.5 141.5 L104 144.4 M109.5 148.5 L104 145.6" stroke="#fff" stroke-opacity="0.35" stroke-width="1" />
    <rect x="96.6" y="141.8" width="6.8" height="6.4" rx="2" fill="#a52f23" />
  {:else if id === 'acc_ember_pin'}
    <circle cx="88" cy="158" r="6.6" fill="#ffd27a" opacity="0.35" />
    <path d="M88 151.6 c3.6 3.8 5.2 6.2 5.2 8.8 a5.2 5.2 0 0 1-10.4 0 c0-2.6 1.6-5 5.2-8.8z" fill="#f4743b" stroke="#c9952b" stroke-width="1.2" />
    <path d="M88 156.6 c1.6 1.8 2.4 3 2.4 4.1 a2.4 2.4 0 0 1-4.8 0 c0-1.1.8-2.3 2.4-4.1z" fill="#ffe08a" />
  {/if}
{:else}
  {#if id === 'acc_glasses'}
    <circle cx="84" cy="100" r="9.6" fill="#fff" fill-opacity="0.16" stroke="#3b3149" stroke-width="2.4" />
    <circle cx="116" cy="100" r="9.6" fill="#fff" fill-opacity="0.16" stroke="#3b3149" stroke-width="2.4" />
    <path d="M93.4 98.6 Q100 94.6 106.6 98.6" fill="none" stroke="#3b3149" stroke-width="2.2" stroke-linecap="round" />
    <path d="M74.6 97.6 L59 94.6 M125.4 97.6 L141 94.6" stroke="#3b3149" stroke-width="2.2" stroke-linecap="round" />
    <path d="M78.6 95.4 q3 -2.6 6.4 -2.2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.7" />
  {:else if id === 'acc_sunglasses'}
    <path d="M71.5 93 H96 V99.5 C96 106 91 109.5 84 109.5 C77 109.5 71.5 106 71.5 99.5 Z" fill="#2a2230" />
    <path d="M104 93 H128.5 V99.5 C128.5 106 123 109.5 116 109.5 C109 109.5 104 106 104 99.5 Z" fill="#2a2230" />
    <path d="M96 95.5 Q100 93 104 95.5" fill="none" stroke="#2a2230" stroke-width="2.4" />
    <path d="M71.5 94.6 L58.5 92.4 M128.5 94.6 L141.5 92.4" stroke="#2a2230" stroke-width="2.4" stroke-linecap="round" />
    <path d="M75 96.4 L84 96.4 M107.5 96.4 L116.5 96.4" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.45" />
  {:else if id === 'acc_star_glasses'}
    <path d={star(84, 100, 12)} fill="#ffb3d1" fill-opacity="0.35" stroke="#f2a12e" stroke-width="2.2" stroke-linejoin="round" />
    <path d={star(116, 100, 12)} fill="#ffb3d1" fill-opacity="0.35" stroke="#f2a12e" stroke-width="2.2" stroke-linejoin="round" />
    <path d="M94 98.4 Q100 95 106 98.4" fill="none" stroke="#f2a12e" stroke-width="2.2" stroke-linecap="round" />
    <path d="M73 96 L59 93.6 M127 96 L141 93.6" stroke="#f2a12e" stroke-width="2" stroke-linecap="round" />
    <circle class="sparkle" cx="129" cy="86" r="1.6" fill="#ffe08a" />
  {:else if id === 'acc_monocle'}
    <circle cx="116" cy="100" r="10.4" fill="#fff" fill-opacity="0.15" stroke="#c9952b" stroke-width="2.6" />
    <path d="M124 107.5 C130 116 128 126 122 134" fill="none" stroke="#c9952b" stroke-width="1.4" stroke-dasharray="2 1.6" />
    <path d="M110 95.4 q3 -2.6 6.4 -2.2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.7" />
  {:else if id === 'acc_earrings'}
    <circle cx="57" cy="106.8" r="2" fill="#f2c14e" />
    <path d="M57 108.4 l2.6 4.2 l-2.6 4.2 l-2.6 -4.2 z" fill="#7ad3e8" stroke="#f2c14e" stroke-width="0.8" />
    <circle cx="143" cy="106.8" r="2" fill="#f2c14e" />
    <path d="M143 108.4 l2.6 4.2 l-2.6 4.2 l-2.6 -4.2 z" fill="#7ad3e8" stroke="#f2c14e" stroke-width="0.8" />
  {:else if id === 'acc_flower'}
    <g transform="translate(135 70)">
      <ellipse cx="-7" cy="5" rx="5" ry="2.4" transform="rotate(30 -7 5)" fill="#6aa864" />
      {#each [0, 72, 144, 216, 288] as a}
        <circle cx={Math.cos((a * Math.PI) / 180) * 5} cy={Math.sin((a * Math.PI) / 180) * 5} r="4.4" fill="#ff8fb1" />
      {/each}
      <circle r="3.2" fill="#ffd166" />
    </g>
  {:else if id === 'acc_headphones'}
    <path d="M57 96 C52 44 148 44 143 96" fill="none" stroke="#3b3149" stroke-width="6.5" stroke-linecap="round" />
    <path d="M60 60 C76 46 124 46 140 60" fill="none" stroke="#fff" stroke-width="1.6" opacity="0.18" stroke-linecap="round" />
    <rect x="48" y="85" width="15" height="24" rx="7" fill="#e5484d" />
    <rect x="137" y="85" width="15" height="24" rx="7" fill="#e5484d" />
    <rect x="58" y="88" width="6" height="18" rx="3" fill="#3b3149" />
    <rect x="136" y="88" width="6" height="18" rx="3" fill="#3b3149" />
  {/if}
{/if}

<style>
  .sparkle {
    transform-box: fill-box;
    transform-origin: center;
  }
  :global(.avatar.animate) .sparkle {
    animation: sparkle 2.2s ease-in-out infinite;
  }
  @keyframes sparkle {
    0%,
    100% {
      transform: scale(0.6);
      opacity: 0.4;
    }
    50% {
      transform: scale(1.3);
      opacity: 1;
    }
  }
</style>
