<script lang="ts">
  import { fade } from 'svelte/transition';
  import { store } from '../lib/state.svelte';
  import { t } from '../lib/i18n.svelte';
  import { quoteOfDay, quoteText } from '../lib/motivation';
  import { d } from '../lib/motion';
  import Icon from './Icon.svelte';
  import Modal from './Modal.svelte';

  let offset = $state(0);
  let listOpen = $state(false);

  const q = $derived.by(() => {
    store.data.settings.lang;
    return quoteOfDay(store.today, store.data.profile.name, offset);
  });
  const saved = $derived(store.data.favorites.includes(q.id));
  const favorites = $derived.by(() => {
    store.data.settings.lang;
    return store.data.favorites.map((id) => ({ id, text: quoteText(id, store.data.profile.name) })).filter((x) => x.text);
  });
</script>

<section class="card words">
  <span class="mark" aria-hidden="true"><Icon name="quote" size={34} /></span>
  <div class="top">
    <p class="eyebrow">{t('today.wordsTitle')}</p>
    <div class="tools">
      {#if store.data.favorites.length}
        <button class="fav-count" onclick={() => (listOpen = true)} title={t('today.favorites')}>
          <Icon name="heart" size={13} />{store.data.favorites.length}
        </button>
      {/if}
      <button class="icon-btn sm" onclick={() => (offset += 1)} title={t('today.another')} aria-label={t('today.another')}>
        <Icon name="shuffle" size={15} />
      </button>
      <button
        class="icon-btn sm heart"
        class:saved
        onclick={() => store.toggleFavorite(q.id)}
        title={saved ? t('today.savedWords') : t('today.saveWords')}
        aria-label={saved ? t('today.savedWords') : t('today.saveWords')}
        aria-pressed={saved}
      >
        <Icon name="heart" size={15} />
      </button>
    </div>
  </div>
  {#key q.id}
    <p class="text" in:fade={{ duration: d(380) }}>{q.text}</p>
  {/key}
</section>

<Modal open={listOpen} onclose={() => (listOpen = false)} width={520} label={t('today.favorites')}>
  <div class="fav">
    <h2><Icon name="heart" size={20} />{t('today.favorites')}</h2>
    {#if favorites.length === 0}
      <p class="empty">{t('today.noFavorites')}</p>
    {:else}
      <ul>
        {#each favorites as f (f.id)}
          <li>
            <p>{f.text}</p>
            <button class="icon-btn sm" onclick={() => store.toggleFavorite(f.id)} aria-label={t('common.delete')}><Icon name="x" size={14} /></button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</Modal>

<style>
  .words {
    position: relative;
    padding: 16px 18px 18px;
    overflow: hidden;
    background:
      radial-gradient(circle at 100% 0%, var(--accent-softer), transparent 60%),
      var(--surface);
  }
  .mark {
    position: absolute;
    left: 10px;
    bottom: 4px;
    color: var(--accent);
    opacity: 0.12;
    transform: scale(2.2);
    transform-origin: bottom left;
    pointer-events: none;
  }
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .tools {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .icon-btn.sm {
    width: 30px;
    height: 30px;
  }
  .heart.saved {
    color: #e5484d;
  }
  .heart.saved :global(svg path) {
    fill: currentColor;
  }
  .heart:active {
    transform: scale(0.88);
  }
  .fav-count {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 26px;
    padding: 0 9px;
    margin-right: 4px;
    border-radius: 99px;
    font-size: 12px;
    font-weight: 800;
    color: #e5484d;
    background: color-mix(in srgb, #e5484d 10%, transparent);
  }
  .text {
    position: relative;
    margin-top: 10px;
    font-family: var(--font-display);
    font-size: 17.5px;
    line-height: 1.42;
    font-weight: 500;
    color: var(--ink);
  }
  .fav {
    padding: 22px 22px 18px;
  }
  .fav h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 21px;
    margin-bottom: 12px;
  }
  .fav h2 :global(svg) {
    color: #e5484d;
  }
  .fav ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 60vh;
    overflow: auto;
  }
  .fav li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 14px;
    background: var(--surface-2);
    border: 1px solid var(--line);
  }
  .fav li p {
    flex: 1;
    font-family: var(--font-display);
    font-size: 15px;
    line-height: 1.4;
  }
  .empty {
    color: var(--ink-3);
    font-weight: 700;
  }
</style>
