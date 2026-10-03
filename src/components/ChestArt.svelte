<script lang="ts">
  let { state = 'locked', size = 64 }: { state?: 'locked' | 'ready' | 'opened'; size?: number } = $props();
</script>

<svg class="chest {state}" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
  {#if state !== 'locked'}
    <circle class="glow" cx="32" cy="34" r="28" fill="#ffd27a" opacity={state === 'ready' ? 0.35 : 0.22} />
  {/if}
  <ellipse cx="32" cy="57" rx="22" ry="3.5" fill="#000" opacity="0.12" />
  <rect x="10" y="30" width="44" height="25" rx="5" fill="#a8693c" />
  <rect x="10" y="30" width="44" height="25" rx="5" fill="none" stroke="#7a4826" stroke-width="2" />
  <rect x="10" y="39" width="44" height="4" fill="#e0a93a" />
  <rect x="18" y="30" width="4" height="25" fill="#e0a93a" />
  <rect x="42" y="30" width="4" height="25" fill="#e0a93a" />
  {#if state === 'opened'}
    <path d="M12 30 Q32 25 52 30 L48 22 Q32 16 16 22 Z" fill="#ffe7a6" opacity="0.9" />
    <g class="lid-open">
      <path d="M10 22 C10 10 54 10 54 22 L54 24 L10 24 Z" fill="#b97843" transform="translate(0 -6) rotate(-12 10 24)" />
    </g>
    <circle cx="26" cy="27" r="3" fill="#ffd166" />
    <circle cx="33" cy="25.5" r="3.4" fill="#ffe08a" />
    <circle cx="40" cy="27.5" r="2.8" fill="#ffd166" />
  {:else}
    <g class="lid">
      <path d="M10 31 C10 16 54 16 54 31 Z" fill="#b97843" />
      <path d="M10 31 C10 16 54 16 54 31" fill="none" stroke="#7a4826" stroke-width="2" />
      <rect x="18" y="19" width="4" height="12" fill="#e0a93a" />
      <rect x="42" y="19" width="4" height="12" fill="#e0a93a" />
    </g>
  {/if}
  <rect x="27.5" y="33" width="9" height="11" rx="2.5" fill={state === 'locked' ? '#8f8a96' : '#f2c14e'} stroke="#6b4423" stroke-width="1.5" />
  <circle cx="32" cy="38" r="1.6" fill="#5b3a28" />
  {#if state === 'ready'}
    <path class="spark s1" d="M8 14 l1.2 2.6 2.6 1.2-2.6 1.2-1.2 2.6-1.2-2.6-2.6-1.2 2.6-1.2z" fill="#ffd166" />
    <path class="spark s2" d="M56 10 l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1z" fill="#ffd166" />
  {/if}
</svg>

<style>
  .chest {
    overflow: visible;
  }
  .ready {
    animation: wiggle 2.4s ease-in-out infinite;
    transform-origin: 50% 90%;
  }
  .glow {
    transform-box: fill-box;
    transform-origin: center;
    animation: glow 2s ease-in-out infinite;
  }
  .spark {
    transform-box: fill-box;
    transform-origin: center;
    animation: spark 1.6s ease-in-out infinite;
  }
  .s2 {
    animation-delay: -0.8s;
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
  @keyframes glow {
    50% {
      transform: scale(1.12);
      opacity: 0.5;
    }
  }
  @keyframes spark {
    0%,
    100% {
      transform: scale(0.6);
      opacity: 0.4;
    }
    50% {
      transform: scale(1.2);
      opacity: 1;
    }
  }
</style>
