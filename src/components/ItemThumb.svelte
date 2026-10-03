<script lang="ts">
  import { shopItem } from '../lib/catalog';
  import { store } from '../lib/state.svelte';
  import Avatar from './Avatar.svelte';
  import PetArt from './PetArt.svelte';
  import Scene from './Scene.svelte';
  import type { HeroClass } from '../lib/types';

  let { id, size = 96 }: { id: string; size?: number } = $props();
  const item = $derived(shopItem(id));
</script>

<div class="thumb {item?.slot}" style="--s:{size}px">
  {#if item?.slot === 'char'}
    <span class="char"><Avatar look={{ ...store.data.profile.look, heroClass: id.slice(5) as HeroClass, tone: 0 }} level={1} size={size * 0.82} crop="figure" animate={false} decorations={false} /></span>
  {:else if item?.slot === 'acc'}
    <Avatar look={store.data.profile.look} acc={id} level={1} size={size * 0.95} crop={['acc_backpack', 'acc_bowtie', 'acc_ember_pin'].includes(id) ? 'bust' : 'head'} animate={false} decorations={false} />
  {:else if item?.slot === 'hat'}
    <Avatar look={store.data.profile.look} hat={id} level={1} size={size} crop="hat" animate={false} decorations={false} />
  {:else if item?.slot === 'pet'}
    <svg width={size * 0.78} height={size * 0.78} viewBox="-4 -6 58 62" aria-hidden="true"><PetArt {id} /></svg>
  {:else if item?.slot === 'bg'}
    <Scene {id} animate={false} />
  {:else}
    <svg width={size * 0.66} height={size * 0.66} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="25" r="21" fill="#ffd27a" opacity="0.3" />
      <path d="M24 5 38 10.5v10.3c0 9.4-6 16.3-14 19.7-8-3.4-14-10.3-14-19.7V10.5z" fill="#4a78c2" />
      <path d="M24 9 34.5 13v8c0 7.4-4.6 12.8-10.5 15.6C18.1 33.8 13.5 28.4 13.5 21v-8z" fill="#6f98da" />
      <path d="M24 14.5c2.6 2.9 4.2 5 4.2 7.4a4.2 4.2 0 0 1-8.4 0c0-2.4 1.6-4.5 4.2-7.4z" fill="#ffb04a" />
      <path d="M24 19.5c1.2 1.4 1.9 2.4 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-1.1.7-2.1 1.9-3.5z" fill="#ffe3a1" />
    </svg>
  {/if}
</div>

<style>
  .thumb {
    position: relative;
    width: 100%;
    height: var(--s);
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: 14px;
    background: var(--stage);
    isolation: isolate;
  }
  .thumb.hat :global(svg) {
    margin-top: 4px;
  }
  .char {
    align-self: end;
    display: grid;
  }
</style>
