<script lang="ts">
  import { store } from '../lib/state.svelte';
  import { t, itemName, itemDesc, fmtNumber } from '../lib/i18n.svelte';
  import { FOR_SALE, MAX_SHIELDS, shopItem, type Slot, type WearSlot } from '../lib/catalog';
  import type { HeroClass } from '../lib/types';
  import { buyItem } from '../lib/actions';
  import { rise } from '../lib/motion';
  import Icon from '../components/Icon.svelte';
  import Segmented from '../components/Segmented.svelte';
  import ItemThumb from '../components/ItemThumb.svelte';
  import Avatar from '../components/Avatar.svelte';
  import Scene from '../components/Scene.svelte';

  let tab = $state<Slot>('char');
  let confirming = $state<string | null>(null);
  let preview = $state<string | null>(null);
  let confirmTimer: ReturnType<typeof setTimeout> | null = null;

  const items = $derived(FOR_SALE.filter((i) => i.slot === tab));
  const previewItem = $derived(shopItem(preview));
  const pHat = $derived(previewItem?.slot === 'hat' ? previewItem.id : store.data.equipped.hat);
  const pPet = $derived(previewItem?.slot === 'pet' ? previewItem.id : store.data.equipped.pet);
  const pBg = $derived(previewItem?.slot === 'bg' ? previewItem.id : store.data.equipped.bg);
  const pAcc = $derived(previewItem?.slot === 'acc' ? previewItem.id : store.data.equipped.acc);
  const pLook = $derived(
    previewItem?.slot === 'char' ? { ...store.data.profile.look, heroClass: previewItem.id.slice(5) as HeroClass, tone: 0 } : store.data.profile.look,
  );

  function isWorn(id: string, slot: Slot) {
    if (slot === 'char') return store.data.profile.look.heroClass === id.slice(5);
    if (slot === 'consumable') return false;
    return store.data.equipped[slot] === id;
  }

  function wear(id: string, slot: Slot, on: boolean) {
    if (slot === 'char') store.setCharacter((on ? id.slice(5) : 'wizard') as HeroClass);
    else if (slot !== 'consumable') store.equip(slot as WearSlot, on ? id : null);
  }

  function onBuy(id: string, el: HTMLElement) {
    const state = store.canBuy(id);
    if (state !== 'ok') return;
    if (confirming !== id) {
      confirming = id;
      if (confirmTimer) clearTimeout(confirmTimer);
      confirmTimer = setTimeout(() => (confirming = null), 3500);
      return;
    }
    confirming = null;
    buyItem(id, el);
  }
</script>

<div class="page">
  <header class="page-head" in:rise>
    <div>
      <h1>{t('shop.title')}</h1>
      <p>{t('shop.subtitle')}</p>
    </div>
    <div class="purse">
      <span class="coin"><Icon name="coin" size={22} /></span>
      <div>
        <span class="eyebrow">{t('shop.balance')}</span>
        <b class="num">{fmtNumber(store.gold)}</b>
      </div>
    </div>
  </header>

  <div class="layout">
    <aside class="card preview" in:rise={{ delay: 40 }}>
      <div class="stage">
        <Scene id={pBg} />
        <div class="figure">
          <Avatar look={pLook} hat={pHat} pet={pPet} acc={pAcc} level={store.lvl.level} size={190} />
        </div>
      </div>
      <p class="p-label">
        {#if previewItem}
          <Icon name="spark" size={14} /> {t('shop.preview')}: <b>{itemName(previewItem.id)}</b>
        {:else}
          {store.data.profile.name}
        {/if}
      </p>
    </aside>

    <section in:rise={{ delay: 70 }}>
      <Segmented
        options={[
          { value: 'char', label: t('shop.tabs.char') },
          { value: 'hat', label: t('shop.tabs.hat') },
          { value: 'acc', label: t('shop.tabs.acc') },
          { value: 'pet', label: t('shop.tabs.pet') },
          { value: 'bg', label: t('shop.tabs.bg') },
          { value: 'consumable', label: t('shop.tabs.consumable') },
        ]}
        value={tab}
        onchange={(v) => {
          tab = v as Slot;
          preview = null;
          confirming = null;
        }}
      />

      {#key tab}
        <div class="grid" in:rise={{ y: 6, duration: 240 }}>
          {#each items as it (it.id)}
            {@const state = store.canBuy(it.id)}
            {@const isOwned = it.slot !== 'consumable' && store.data.owned.includes(it.id)}
            {@const equipped = isWorn(it.id, it.slot)}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <article
              class="item card"
              class:owned={isOwned}
              class:locked={state === 'level'}
              onmouseenter={() => it.slot !== 'consumable' && (preview = it.id)}
              onmouseleave={() => preview === it.id && (preview = null)}
            >
              <div class="thumb-wrap">
                <ItemThumb id={it.id} size={118} />
                {#if state === 'level'}
                  <div class="lock"><Icon name="lock" size={18} />{t('shop.locked', { n: it.minLevel ?? 1 })}</div>
                {/if}
                {#if equipped}<span class="badge"><Icon name="check" size={12} stroke={3} />{t('shop.equipped')}</span>{/if}
              </div>
              <div class="info">
                <h3>{itemName(it.id)}</h3>
                <p>{itemDesc(it.id)}</p>
              </div>
              <div class="foot">
                {#if isOwned}
                  <span class="owned-label"><Icon name="check" size={14} />{t('shop.owned')}</span>
                  {#if !equipped}
                    <button class="btn sm soft" onclick={() => wear(it.id, it.slot, true)}>{it.slot === 'char' ? t('shop.wear') : t('shop.equip')}</button>
                  {:else if it.slot === 'char'}
                    <span class="wearing">{t('shop.wearing')}</span>
                  {:else}
                    <button class="btn sm ghost" onclick={() => wear(it.id, it.slot, false)}>{t('hero.unequip')}</button>
                  {/if}
                {:else}
                  <span class="price" class:short={state === 'gold'}><Icon name="coin" size={15} /><b class="num">{it.price}</b></span>
                  {#if it.slot === 'consumable'}
                    <span class="count">{store.data.shields}/{MAX_SHIELDS}</span>
                  {/if}
                  <button
                    class="btn sm"
                    class:primary={state === 'ok'}
                    class:confirm={confirming === it.id}
                    disabled={state !== 'ok'}
                    title={state === 'gold' ? t('shop.need', { n: it.price - store.gold }) : state === 'maxed' ? t('shop.maxed') : ''}
                    onclick={(e) => onBuy(it.id, e.currentTarget)}
                  >
                    {#if state === 'gold'}
                      {t('shop.need', { n: it.price - store.gold })}
                    {:else if state === 'maxed'}
                      {t('shop.maxed')}
                    {:else if confirming === it.id}
                      {t('shop.confirm')}
                    {:else}
                      {t('shop.buy')}
                    {/if}
                  </button>
                {/if}
              </div>
            </article>
          {/each}
        </div>
      {/key}
      <p class="exclusive-note"><Icon name="gift" size={15} />{t('shop.exclusiveHint')} <button class="link" onclick={() => store.navigate('rewards')}>{t('rewards.seeAll')}</button></p>
    </section>
  </div>
</div>

<style>
  .purse {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 18px 8px 10px;
    border-radius: 18px;
    background: var(--surface);
    border: 1px solid var(--line);
    box-shadow: var(--shadow-sm);
  }
  .coin {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 13px;
    background: var(--gold-soft);
    color: var(--gold);
  }
  .purse div {
    display: flex;
    flex-direction: column;
  }
  .purse .eyebrow {
    font-size: 10.5px;
  }
  .purse b {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 650;
    line-height: 1.1;
  }
  .layout {
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    gap: 18px;
    align-items: start;
  }
  .preview {
    position: sticky;
    top: 0;
    padding: 10px;
  }
  .stage {
    position: relative;
    height: 270px;
    border-radius: 14px;
    overflow: hidden;
    isolation: isolate;
  }
  .figure {
    position: absolute;
    left: 50%;
    bottom: 4px;
    transform: translateX(-50%);
  }
  .p-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 4px 4px;
    font-size: 13px;
    font-weight: 700;
    color: var(--ink-3);
    text-align: center;
  }
  .p-label b {
    color: var(--ink);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 14px;
    margin-top: 16px;
  }
  .item {
    display: flex;
    flex-direction: column;
    padding: 10px;
    transition: transform 0.25s var(--ease-out), box-shadow 0.25s, border-color 0.25s;
  }
  .item:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow);
    border-color: var(--line-2);
  }
  .thumb-wrap {
    position: relative;
  }
  .lock {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--surface) 72%, transparent);
    backdrop-filter: grayscale(0.9);
    font-size: 12.5px;
    font-weight: 800;
    color: var(--ink-2);
  }
  .badge {
    position: absolute;
    top: 8px;
    left: 8px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 22px;
    padding: 0 8px;
    border-radius: 99px;
    background: var(--accent);
    color: #fff;
    font-size: 11px;
    font-weight: 800;
  }
  .info {
    padding: 10px 4px 8px;
    flex: 1;
  }
  .info h3 {
    font-size: 16px;
    font-weight: 650;
  }
  .info p {
    font-size: 12.5px;
    color: var(--ink-3);
    margin-top: 3px;
    line-height: 1.4;
  }
  .foot {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 2px 0;
  }
  .foot .btn {
    margin-left: auto;
  }
  .price {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--gold);
    font-weight: 800;
  }
  .price b {
    font-size: 15px;
    color: var(--ink);
  }
  .price.short b {
    color: var(--ink-3);
  }
  .count {
    font-size: 12px;
    font-weight: 800;
    color: var(--ink-3);
  }
  .owned-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12.5px;
    font-weight: 800;
    color: var(--success);
  }
  .btn.confirm {
    animation: pulse-btn 0.9s ease-in-out infinite;
  }
  @keyframes pulse-btn {
    50% {
      box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent) 25%, transparent);
    }
  }
  .btn:disabled {
    font-size: 12px;
  }
  .wearing {
    margin-left: auto;
    font-size: 12.5px;
    font-weight: 800;
    color: var(--accent-text);
  }
  .exclusive-note {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 18px;
    font-size: 13px;
    font-weight: 700;
    color: var(--ink-3);
  }
  .exclusive-note :global(svg) {
    color: var(--accent);
  }
  .link {
    color: var(--accent-text);
    font-weight: 800;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  @media (max-width: 1000px) {
    .layout {
      grid-template-columns: 1fr;
    }
    .preview {
      position: static;
    }
  }
</style>
