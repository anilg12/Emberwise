<svelte:options namespace="svg" />

<script lang="ts">
  // Companions, drawn in a 50×52 local box (feet at y≈50).
  let { id }: { id: string } = $props();
</script>

{#if id === 'pet_frog'}
  <g>
    <ellipse cx="25" cy="48" rx="16" ry="3" fill="#000" opacity="0.12" />
    <ellipse cx="25" cy="36" rx="20" ry="13" fill="#7cc36b" />
    <circle cx="14" cy="23" r="8" fill="#7cc36b" />
    <circle cx="36" cy="23" r="8" fill="#7cc36b" />
    <circle cx="14" cy="23" r="4.6" fill="#fff" />
    <circle cx="36" cy="23" r="4.6" fill="#fff" />
    <circle cx="14.6" cy="23.6" r="2.6" fill="#2a2230" />
    <circle cx="36.6" cy="23.6" r="2.6" fill="#2a2230" />
    <ellipse cx="25" cy="40" rx="12" ry="7" fill="#d9f1c8" />
    <path d="M17 32 q8 5 16 0" fill="none" stroke="#2f5d2a" stroke-width="2" stroke-linecap="round" />
    <ellipse cx="11" cy="33" rx="3" ry="2" fill="#ff8f80" opacity="0.5" />
    <ellipse cx="39" cy="33" rx="3" ry="2" fill="#ff8f80" opacity="0.5" />
    <ellipse cx="10" cy="47" rx="6" ry="3" fill="#6aae5a" />
    <ellipse cx="40" cy="47" rx="6" ry="3" fill="#6aae5a" />
  </g>
{:else if id === 'pet_cat'}
  <g>
    <ellipse cx="22" cy="49" rx="16" ry="3" fill="#000" opacity="0.12" />
    <path d="M34 46 C48 44 50 28 41 22" fill="none" stroke="#f0b46c" stroke-width="6" stroke-linecap="round" />
    <ellipse cx="22" cy="38" rx="15" ry="12" fill="#f0b46c" />
    <ellipse cx="22" cy="42" rx="8" ry="7" fill="#fbe3c4" />
    <path d="M10 14 L11 0 L21 9 Z" fill="#f0b46c" />
    <path d="M34 14 L33 0 L23 9 Z" fill="#f0b46c" />
    <path d="M12.5 11 L13 4 L18 9 Z" fill="#ff9fb0" />
    <path d="M31.5 11 L31 4 L26 9 Z" fill="#ff9fb0" />
    <circle cx="22" cy="19" r="13" fill="#f0b46c" />
    <path d="M17 8 l1 4 M22 7 v4 M27 8 l-1 4" stroke="#d8914a" stroke-width="1.8" stroke-linecap="round" />
    <ellipse cx="17" cy="20" rx="2" ry="2.6" fill="#2a2230" />
    <ellipse cx="27" cy="20" rx="2" ry="2.6" fill="#2a2230" />
    <path d="M20.5 24 h3 l-1.5 1.8 z" fill="#e57a8a" />
    <path d="M22 25.8 q-1.6 2 -3.4 1 M22 25.8 q1.6 2 3.4 1" fill="none" stroke="#2a2230" stroke-width="1.2" stroke-linecap="round" />
    <path d="M8 23 h5 M31 23 h5" stroke="#d8914a" stroke-width="1.2" stroke-linecap="round" />
    <ellipse cx="14" cy="48" rx="5" ry="2.6" fill="#f6c88d" />
    <ellipse cx="29" cy="48" rx="5" ry="2.6" fill="#f6c88d" />
  </g>
{:else if id === 'pet_owl'}
  <g>
    <ellipse cx="22" cy="50" rx="15" ry="2.8" fill="#000" opacity="0.12" />
    <path d="M7 14 L9 2 L17 11 Z" fill="#7d553d" />
    <path d="M37 14 L35 2 L27 11 Z" fill="#7d553d" />
    <ellipse cx="22" cy="30" rx="17" ry="19" fill="#9a6b4f" />
    <ellipse cx="7" cy="33" rx="5" ry="11" fill="#7d553d" />
    <ellipse cx="37" cy="33" rx="5" ry="11" fill="#7d553d" />
    <ellipse cx="22" cy="36" rx="11" ry="12" fill="#ecd7b8" />
    <path d="M17 33 l2 2 2-2 M23 33 l2 2 2-2 M20 39 l2 2 2-2" fill="none" stroke="#c4a27c" stroke-width="1.4" stroke-linecap="round" />
    <circle cx="15" cy="21" r="7.2" fill="#fff8ec" />
    <circle cx="29" cy="21" r="7.2" fill="#fff8ec" />
    <circle cx="15.5" cy="21.5" r="3.8" fill="#2a2230" />
    <circle cx="29.5" cy="21.5" r="3.8" fill="#2a2230" />
    <circle cx="16.6" cy="20.2" r="1.3" fill="#fff" />
    <circle cx="30.6" cy="20.2" r="1.3" fill="#fff" />
    <path d="M20 26 h4 l-2 3.2 z" fill="#f3a03a" />
    <path d="M15 48 v2.5 M18 48 v2.5 M26 48 v2.5 M29 48 v2.5" stroke="#f3a03a" stroke-width="2" stroke-linecap="round" />
  </g>
{:else if id === 'pet_fox'}
  <g>
    <ellipse cx="22" cy="49.5" rx="17" ry="3" fill="#000" opacity="0.12" />
    <path d="M30 46 C50 46 54 26 44 18 C46 30 40 38 30 40 Z" fill="#e8793a" />
    <path d="M44 18 C48 22 49 28 47 32 C44 30 43 24 44 18 Z" fill="#fff4e6" />
    <ellipse cx="21" cy="38" rx="14" ry="12" fill="#e8793a" />
    <ellipse cx="21" cy="41" rx="7" ry="8" fill="#fff4e6" />
    <path d="M8 14 L9 0 L19 9 Z" fill="#e8793a" />
    <path d="M34 14 L33 0 L23 9 Z" fill="#e8793a" />
    <path d="M10.5 11 L11 4 L16 9 Z" fill="#3a2a2a" />
    <path d="M31.5 11 L31 4 L26 9 Z" fill="#3a2a2a" />
    <path d="M21 31 C10 31 6 22 8 14 C12 9 30 9 34 14 C36 22 32 31 21 31 Z" fill="#e8793a" />
    <path d="M21 31 C15 31 10 27 9 22 C14 24 18 26 21 30 C24 26 28 24 33 22 C32 27 27 31 21 31 Z" fill="#fff4e6" />
    <ellipse cx="16" cy="20" rx="1.9" ry="2.5" fill="#2a2230" />
    <ellipse cx="26" cy="20" rx="1.9" ry="2.5" fill="#2a2230" />
    <circle cx="21" cy="27" r="1.8" fill="#2a2230" />
    <ellipse cx="14" cy="48" rx="4.5" ry="2.4" fill="#3a2a2a" />
    <ellipse cx="28" cy="48" rx="4.5" ry="2.4" fill="#3a2a2a" />
  </g>
{:else if id === 'pet_ember'}
  <g>
    <ellipse cx="25" cy="50" rx="14" ry="2.6" fill="#000" opacity="0.1" />
    <ellipse cx="25" cy="34" rx="22" ry="18" fill="#ff9a4d" opacity="0.22" />
    <g transform="translate(4 2) scale(0.42)">
      <path
        d="M50 6c4.6 10.4 13.5 17.3 21 26.2C78.4 41 83 50.4 83 63.5 83 84 68.6 99 50 99S17 84 17 63.5c0-11.6 5.4-20.4 12.6-27.8 1.2 7.3 4.6 12.3 10.2 14.6C38.3 35.7 41.6 19 50 6z"
        fill="#f4743b"
      />
      <path
        d="M50 40c3.4 7 9.4 11.4 13.6 16.8 3.2 4.1 4.9 8.4 4.9 13.6C68.5 82.7 60.4 92 50 92s-18.5-9.3-18.5-21.6c0-6.1 2.8-11 6.6-14.8.9 3.7 2.8 6.1 5.7 7.3C43.1 55.4 45.4 47 50 40z"
        fill="#ffcf73"
      />
      <ellipse cx="41.5" cy="71" rx="3.8" ry="4.6" fill="#4a2320" />
      <ellipse cx="58.5" cy="71" rx="3.8" ry="4.6" fill="#4a2320" />
      <circle cx="42.8" cy="69.4" r="1.4" fill="#fff" />
      <circle cx="59.8" cy="69.4" r="1.4" fill="#fff" />
      <path d="M45 79.2q5 5.4 10 0" fill="#7a2f28" stroke="#4a2320" stroke-width="2" stroke-linecap="round" />
    </g>
  </g>
{:else if id === 'pet_dragon'}
  <g>
    <ellipse cx="24" cy="50" rx="17" ry="3" fill="#000" opacity="0.12" />
    <path d="M36 42 C48 42 52 34 48 28 L52 26 L47 24" fill="none" stroke="#8a6bd1" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M10 22 C0 16 -2 6 4 2 C6 10 12 14 18 16 Z" fill="#b39cf0" />
    <path d="M38 22 C48 16 50 6 44 2 C42 10 36 14 30 16 Z" fill="#b39cf0" />
    <ellipse cx="24" cy="37" rx="14" ry="12" fill="#8a6bd1" />
    <ellipse cx="24" cy="40" rx="8" ry="8" fill="#ddd1ff" />
    <path d="M20 35 h8 M19.5 39 h9 M20 43 h8" stroke="#c4b2f5" stroke-width="1.2" stroke-linecap="round" />
    <circle cx="24" cy="19" r="12" fill="#8a6bd1" />
    <path d="M15 10 L13 2 L19 7 Z M33 10 L35 2 L29 7 Z" fill="#f3e6c0" />
    <ellipse cx="24" cy="24" rx="7" ry="4.6" fill="#a58ae0" />
    <circle cx="21.5" cy="23.5" r="0.9" fill="#4a3a7a" />
    <circle cx="26.5" cy="23.5" r="0.9" fill="#4a3a7a" />
    <ellipse cx="18.5" cy="17" rx="2.2" ry="2.8" fill="#2a2230" />
    <ellipse cx="29.5" cy="17" rx="2.2" ry="2.8" fill="#2a2230" />
    <circle cx="19.3" cy="16" r="0.9" fill="#fff" />
    <circle cx="30.3" cy="16" r="0.9" fill="#fff" />
    <ellipse cx="15" cy="48" rx="5" ry="2.6" fill="#7558bd" />
    <ellipse cx="33" cy="48" rx="5" ry="2.6" fill="#7558bd" />
  </g>
{/if}
