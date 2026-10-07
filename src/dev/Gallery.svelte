<script lang="ts">
  // dev only (/#gallery): all outfits, tones, accessories, hats, pets and realms on one page
  import { CHARACTERS } from '../lib/characters';
  import { SHOP } from '../lib/catalog';
  import type { Look } from '../lib/types';
  import Avatar from '../components/Avatar.svelte';
  import Scene from '../components/Scene.svelte';
  import PetArt from '../components/PetArt.svelte';

  const params = new URLSearchParams(location.search);
  const section = params.get('s') ?? 'chars';
  const body = (params.get('body') ?? 'f') as 'f' | 'm';
  const base: Look = { body, skin: Number(params.get('skin') ?? 1), hair: Number(params.get('hair') ?? 1), hairColor: 1, heroClass: 'wizard', tone: 0 };
  const level = Number(params.get('level') ?? 1);
  const hats = SHOP.filter((i) => i.slot === 'hat');
  const accs = SHOP.filter((i) => i.slot === 'acc');
  const pets = SHOP.filter((i) => i.slot === 'pet');
  const bgs = SHOP.filter((i) => i.slot === 'bg');
  document.documentElement.classList.add('theme-ready');
</script>

<div class="gallery">
  {#if section === 'chars'}
    {#each CHARACTERS as c}
      <div class="row">
        <b>{c.id}</b>
        {#each c.tones as _, i}
          <div class="cell"><Avatar look={{ ...base, heroClass: c.id, tone: i }} size={Number(params.get("z") ?? 150)} {level} animate={false} /></div>
        {/each}
      </div>
    {/each}
  {:else if section === 'hats'}
    <div class="wrap">
      {#each hats as h}
        <div class="cell"><b>{h.id}</b><Avatar look={{ ...base, hair: (hats.indexOf(h) % 6) }} hat={h.id} size={160} animate={false} crop="bust" /></div>
      {/each}
    </div>
  {:else if section === 'accs'}
    <div class="wrap">
      {#each accs as a}
        <div class="cell"><b>{a.id}</b><Avatar look={{ ...base, heroClass: 'coder' }} acc={a.id} size={170} animate={false} crop="bust" /></div>
      {/each}
      {#each accs as a}
        <div class="cell"><b>{a.id} + hat</b><Avatar look={{ ...base, hair: 0, body: 'm' }} acc={a.id} hat="hat_cap" size={170} animate={false} crop="bust" /></div>
      {/each}
    </div>
  {:else if section === 'pets'}
    <div class="wrap">
      {#each pets as p}
        <div class="cell"><b>{p.id}</b><svg width="160" height="170" viewBox="-6 -8 62 66"><PetArt id={p.id} /></svg></div>
      {/each}
    </div>
  {:else}
    <div class="wrap">
      {#each bgs as b}
        <div class="scene"><b>{b.id}</b><div class="stage"><Scene id={b.id} /><div class="fig"><Avatar look={base} size={130} animate={false} /></div></div></div>
      {/each}
    </div>
  {/if}
</div>

<style>
  :global(body) {
    overflow: auto !important;
  }
  .gallery {
    padding: 16px;
    background: #f6efe4;
    min-height: 100vh;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
  }
  .row b {
    width: 90px;
    font-size: 13px;
    color: #3b3149;
  }
  .wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #fffaf2;
    border-radius: 12px;
    padding: 4px;
  }
  .cell b {
    font-size: 11px;
  }
  .scene {
    width: 300px;
  }
  .stage {
    position: relative;
    height: 220px;
    border-radius: 12px;
    overflow: hidden;
    isolation: isolate;
  }
  .fig {
    position: absolute;
    left: 50%;
    bottom: 4px;
    transform: translateX(-50%);
  }
</style>
