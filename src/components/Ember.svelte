<script lang="ts">
  // ember, the little flame mascot
  let {
    size = 96,
    mood = 'happy',
    animate = true,
    glow = true,
  }: { size?: number; mood?: 'happy' | 'calm' | 'sleepy' | 'wow'; animate?: boolean; glow?: boolean } = $props();

  const id = `em${Math.random().toString(36).slice(2, 8)}`;
</script>

<svg
  class="ember"
  class:animate
  width={size}
  height={size * 1.04}
  viewBox="0 0 100 104"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="{id}-o" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffb04a" />
      <stop offset="0.55" stop-color="#f4743b" />
      <stop offset="1" stop-color="#e2493f" />
    </linearGradient>
    <linearGradient id="{id}-i" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe3a1" />
      <stop offset="1" stop-color="#ffb84d" />
    </linearGradient>
    <radialGradient id="{id}-g" cx="0.5" cy="0.62" r="0.5">
      <stop offset="0" stop-color="#ff9a4d" stop-opacity="0.45" />
      <stop offset="1" stop-color="#ff9a4d" stop-opacity="0" />
    </radialGradient>
  </defs>
  {#if glow}
    <ellipse class="halo" cx="50" cy="66" rx="50" ry="40" fill="url(#{id}-g)" />
  {/if}
  <g class="body">
    <path
      d="M50 6c4.6 10.4 13.5 17.3 21 26.2C78.4 41 83 50.4 83 63.5 83 84 68.6 99 50 99S17 84 17 63.5c0-11.6 5.4-20.4 12.6-27.8 1.2 7.3 4.6 12.3 10.2 14.6C38.3 35.7 41.6 19 50 6z"
      fill="url(#{id}-o)"
    />
    <path
      d="M50 40c3.4 7 9.4 11.4 13.6 16.8 3.2 4.1 4.9 8.4 4.9 13.6C68.5 82.7 60.4 92 50 92s-18.5-9.3-18.5-21.6c0-6.1 2.8-11 6.6-14.8.9 3.7 2.8 6.1 5.7 7.3C43.1 55.4 45.4 47 50 40z"
      fill="url(#{id}-i)"
    />
    <g class="face">
      {#if mood === 'sleepy'}
        <path d="M37.5 72.5q4 3 8 0M54.5 72.5q4 3 8 0" fill="none" stroke="#5a2a22" stroke-width="2.6" stroke-linecap="round" />
      {:else}
        <g class="eyes">
          <ellipse cx="41.5" cy="71" rx="3.6" ry={mood === 'wow' ? 5 : 4.4} fill="#4a2320" />
          <ellipse cx="58.5" cy="71" rx="3.6" ry={mood === 'wow' ? 5 : 4.4} fill="#4a2320" />
          <circle cx="42.8" cy="69.4" r="1.25" fill="#fff" />
          <circle cx="59.8" cy="69.4" r="1.25" fill="#fff" />
        </g>
      {/if}
      <ellipse cx="34.5" cy="79" rx="4.2" ry="2.6" fill="#ff7a6b" opacity="0.45" />
      <ellipse cx="65.5" cy="79" rx="4.2" ry="2.6" fill="#ff7a6b" opacity="0.45" />
      {#if mood === 'wow'}
        <ellipse cx="50" cy="81.5" rx="3" ry="3.4" fill="#4a2320" />
      {:else if mood === 'calm' || mood === 'sleepy'}
        <path d="M46.5 80.5q3.5 2.2 7 0" fill="none" stroke="#4a2320" stroke-width="2.3" stroke-linecap="round" />
      {:else}
        <path d="M45 79.2q5 5.4 10 0" fill="#7a2f28" stroke="#4a2320" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      {/if}
    </g>
  </g>
</svg>

<style>
  .ember {
    display: block;
    overflow: visible;
  }
  .body {
    transform-box: fill-box;
    transform-origin: 50% 100%;
  }
  .animate .body {
    animation: flicker 2.8s ease-in-out infinite;
  }
  .animate .halo {
    transform-box: fill-box;
    transform-origin: center;
    animation: breathe 2.8s ease-in-out infinite;
  }
  .eyes {
    transform-box: fill-box;
    transform-origin: center;
  }
  .animate .eyes {
    animation: blink 5.2s infinite;
  }
  @keyframes flicker {
    0%,
    100% {
      transform: scale(1, 1) skewX(0deg);
    }
    30% {
      transform: scale(1.015, 0.985) skewX(-1.2deg);
    }
    60% {
      transform: scale(0.99, 1.025) skewX(1deg);
    }
  }
  @keyframes breathe {
    0%,
    100% {
      opacity: 0.75;
      transform: scale(0.96);
    }
    50% {
      opacity: 1;
      transform: scale(1.04);
    }
  }
  @keyframes blink {
    0%,
    93%,
    100% {
      transform: scaleY(1);
    }
    95% {
      transform: scaleY(0.12);
    }
  }
  :global(html.reduce-motion) .ember * {
    animation: none !important;
  }
</style>
