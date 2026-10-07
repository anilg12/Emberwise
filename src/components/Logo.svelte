<script lang="ts">
  // logo: ember with a curl on a plum tile
  let { size = 28 }: { size?: number } = $props();
  const id = `lg${Math.random().toString(36).slice(2, 8)}`;
</script>

<svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
  <defs>
    <linearGradient id="{id}-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a2a4f" />
      <stop offset="1" stop-color="#231a32" />
    </linearGradient>
    <linearGradient id="{id}-f" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffb84d" />
      <stop offset="0.6" stop-color="#f4743b" />
      <stop offset="1" stop-color="#e2493f" />
    </linearGradient>
    <radialGradient id="{id}-glow" cx="0.5" cy="0.62" r="0.5">
      <stop offset="0" stop-color="#ff8a4a" stop-opacity="0.55" />
      <stop offset="1" stop-color="#ff8a4a" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="64" height="64" rx="15" fill="url(#{id}-bg)" />
  <circle cx="32" cy="38" r="24" fill="url(#{id}-glow)" />
  <path
    d="M32 9.5c2.9 6.6 8.6 11 13.4 16.7 4.7 5.6 7.6 11.6 7.6 19.9C53 47.7 43.8 56 32 56s-21-8.3-21-19.9c0-7.4 3.4-13 8-17.7.8 4.6 2.9 7.8 6.5 9.3C24.4 18.6 26.6 17.8 32 9.5z"
    fill="url(#{id}-f)"
  />
  <path
    d="M32 31c2.2 4.5 6 7.3 8.7 10.7 2 2.6 3.1 5.4 3.1 8.7C43.8 55 38.5 56 32 56s-11.8-1-11.8-5.6c0-3.9 1.8-7 4.2-9.4.6 2.4 1.8 3.9 3.6 4.6C27.6 39.3 29.1 34.9 32 31z"
    fill="#ffd27a"
  />
  <circle cx="27.6" cy="46" r="2" fill="#4a2320" />
  <circle cx="36.4" cy="46" r="2" fill="#4a2320" />
</svg>
