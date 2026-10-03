<script lang="ts">
  import { store } from '../lib/state.svelte';
  import { t, itemName } from '../lib/i18n.svelte';
  import { RANKS, nextRank } from '../lib/game';
  import { SHOP, shopItem } from '../lib/catalog';
  import { CHARACTERS, character } from '../lib/characters';
  import { achievementContext } from '../lib/catalog';
  import { rise } from '../lib/motion';
  import type { Body, HeroClass, Equipped } from '../lib/types';
  import Icon from '../components/Icon.svelte';
  import Avatar from '../components/Avatar.svelte';
  import Scene from '../components/Scene.svelte';
  import XPBar from '../components/XPBar.svelte';
  import Segmented from '../components/Segmented.svelte';
  import RankBadge from '../components/RankBadge.svelte';
  import ItemThumb from '../components/ItemThumb.svelte';

  type Tab = 'appearance' | 'wardrobe' | 'ranks';
  let tab = $state<Tab>('appearance');

  const SKINS = ['#ffe3cc', '#f6cfab', '#e3ad83', '#c78c60', '#9c6541', '#6f462b'];
  const HAIRS = ['#2c2226', '#5b3a29', '#9a5631', '#dcae62', '#c9503c', '#8f8aa6', '#efe3cb', '#3f5f8f'];
  const TIERS = ['free', 'shop', 'login'] as const;

  const look = $derived(store.data.profile.look);
  const next = $derived(nextRank(store.lvl.level));

  const attrs = $derived.by(() => {
    const c = achievementContext(store.data, store.lvl.level);
    const hard = store.data.log.filter((e) => e.kind === 'task' && (e.meta?.d === 'hard' || e.meta?.d === 'epic')).length;
    const cap = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
    return [
      { id: 'focus', icon: 'flame', value: cap(Math.sqrt(c.focusMin) * 1.8), color: '#ee6c3a' },
      { id: 'discipline', icon: 'repeat', value: cap(store.data.streak.best * 3 + c.habitDone * 1.5), color: '#3e9b6e' },
      { id: 'wisdom', icon: 'quill', value: cap(c.purposeDone * 4), color: '#4a78c2' },
      { id: 'courage', icon: 'sword', value: cap(hard * 5 + c.epicDone * 5), color: '#c4477a' },
    ];
  });

  function setLook<K extends keyof typeof look>(key: K, value: (typeof look)[K]) {
    store.data.profile.look[key] = value;
    store.persist();
  }

  function setBody(b: Body) {
    setLook('body', b);
    // A gentle default: switching presentation suggests a matching hairstyle.
    if (b === 'f' && look.hair === 0) setLook('hair', 1);
    if (b === 'm' && look.hair === 1) setLook('hair', 0);
  }

  function owned(slot: keyof Equipped) {
    return SHOP.filter((i) => i.slot === slot && store.data.owned.includes(i.id));
  }

  function pickCharacter(id: HeroClass) {
    if (store.hasCharacter(id)) {
      if (look.heroClass !== id) store.setCharacter(id, 0);
    } else store.navigate(character(id).tier === 'login' ? 'rewards' : 'shop');
  }

  const tones = $derived(character(look.heroClass).tones);
</script>

<div class="page">
  <header class="page-head" in:rise>
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
    </div>
  </header>

  <div class="layout">
    <div class="left">
      <section class="card stage-card" in:rise={{ delay: 40 }}>
        <div class="stage">
          <Scene id={store.data.equipped.bg} />
          <div class="figure">
            <Avatar
              {look}
              hat={store.data.equipped.hat}
              pet={store.data.equipped.pet}
              acc={store.data.equipped.acc}
              level={store.lvl.level}
              size={230}
            />
          </div>
        </div>
        <div class="identity">
          <div class="id-top">
            <RankBadge rank={store.rank} size={40} />
            <div>
              <h2>{store.data.profile.name}</h2>
              <p><b style="color:{store.rank.color}">{t(`ranks.${store.rank.id}`)}</b> · {t('common.level')} {store.lvl.level} · {t(`hero.classes.${look.heroClass}`)}</p>
            </div>
          </div>
          <XPBar progress={store.lvl.progress} height={10} />
          <div class="xp-line">
            <span class="num">{store.lvl.into} / {store.lvl.needed} XP</span>
            <span>{next ? t('hero.nextRank', { rank: t(`ranks.${next.id}`), level: next.minLevel }) : t('hero.maxRank')}</span>
          </div>
        </div>
      </section>

      <section class="card attrs" in:rise={{ delay: 80 }}>
        <h3>{t('hero.attributes')}</h3>
        {#each attrs as a (a.id)}
          <div class="attr" title={t(`hero.attrHint.${a.id}`)} style="--c:{a.color}">
            <span class="a-icon"><Icon name={a.icon} size={16} /></span>
            <span class="a-name">{t(`hero.attr.${a.id}`)}</span>
            <div class="a-bar"><span style="width:{a.value}%"></span></div>
            <b class="num">{a.value}</b>
          </div>
        {/each}
      </section>
    </div>

    <section class="card right" in:rise={{ delay: 60 }}>
      <Segmented
        full
        options={[
          { value: 'appearance', label: t('hero.appearance'), icon: 'palette' },
          { value: 'wardrobe', label: t('hero.wardrobe'), icon: 'bag' },
          { value: 'ranks', label: t('hero.ranks'), icon: 'shield' },
        ]}
        value={tab}
        onchange={(v) => (tab = v as Tab)}
      />

      {#key tab}
        <div class="tab" in:rise={{ y: 6, duration: 240 }}>
          {#if tab === 'appearance'}
            <div class="field">
              <span class="label">{t('hero.name')}</span>
              <input
                class="input"
                value={store.data.profile.name}
                maxlength="40"
                placeholder={t('hero.namePh')}
                oninput={(e) => {
                  store.data.profile.name = (e.currentTarget as HTMLInputElement).value;
                  store.persist();
                }}
                onblur={(e) => {
                  const v = (e.currentTarget as HTMLInputElement).value.trim();
                  if (!v) store.data.profile.name = store.data.settings.lang === 'tr' ? 'Kahraman' : 'Hero';
                  else store.data.profile.name = v;
                  store.persist();
                }}
              />
            </div>
            <div class="field">
              <span class="label">{t('hero.body')}</span>
              <Segmented
                options={[
                  { value: 'f', label: t('hero.female') },
                  { value: 'm', label: t('hero.male') },
                ]}
                value={look.body}
                onchange={(v) => setBody(v as Body)}
              />
            </div>
            <div class="field">
              <span class="label">{t('hero.skin')}</span>
              <div class="swatches">
                {#each SKINS as c, i}
                  <button class="sw" class:on={look.skin === i} style="--c:{c}" onclick={() => setLook('skin', i)} aria-label="{t('hero.skin')} {i + 1}"></button>
                {/each}
              </div>
            </div>
            <div class="field">
              <span class="label">{t('hero.hair')}</span>
              <div class="hairs">
                {#each [0, 1, 2, 3, 4, 5] as h}
                  <button class="hair" class:on={look.hair === h} onclick={() => setLook('hair', h)} aria-label="{t('hero.hair')} {h + 1}">
                    <Avatar look={{ ...look, hair: h }} size={58} crop="head" animate={false} decorations={false} />
                  </button>
                {/each}
              </div>
            </div>
            <div class="field">
              <span class="label">{t('hero.hairColor')}</span>
              <div class="swatches">
                {#each HAIRS as c, i}
                  <button class="sw" class:on={look.hairColor === i} style="--c:{c}" onclick={() => setLook('hairColor', i)} aria-label="{t('hero.hairColor')} {i + 1}"></button>
                {/each}
              </div>
            </div>
            <div class="field">
              <span class="label">{t('hero.heroClass')}</span>
              {#each TIERS as tier}
                <p class="tier">{t(`hero.tiers.${tier}`)}</p>
                <div class="chars">
                  {#each CHARACTERS.filter((c) => c.tier === tier) as c (c.id)}
                    {@const has = store.hasCharacter(c.id)}
                    {@const price = shopItem(`char_${c.id}`)}
                    <button
                      class="char"
                      class:on={look.heroClass === c.id}
                      class:locked={!has}
                      onclick={() => pickCharacter(c.id)}
                      title={t(`hero.classDesc.${c.id}`)}
                    >
                      <span class="char-art">
                        <Avatar
                          look={{ ...look, heroClass: c.id, tone: look.heroClass === c.id ? look.tone : 0 }}
                          size={70}
                          crop="figure"
                          animate={false}
                          decorations={false}
                        />
                      </span>
                      <span class="char-name">{t(`hero.classes.${c.id}`)}</span>
                      {#if !has}
                        <span class="char-lock">
                          {#if c.tier === 'login'}
                            <Icon name="gift" size={12} />{t('rewards.day', { n: price?.login ?? 0 })}
                          {:else}
                            <Icon name="coin" size={12} />{price?.price}
                          {/if}
                        </span>
                      {/if}
                    </button>
                  {/each}
                </div>
              {/each}
              <p class="char-desc"><b>{t(`hero.classes.${look.heroClass}`)}</b> · {t(`hero.classDesc.${look.heroClass}`)}</p>
            </div>
            <div class="field">
              <span class="label">{t('hero.tone')}</span>
              <div class="tones">
                {#each tones as tone, i}
                  <button
                    class="tone"
                    class:on={(look.tone ?? 0) === i}
                    style="--a:{tone.main};--b:{tone.alt === tone.main ? tone.dark : tone.alt};--c:{tone.trim}"
                    onclick={() => setLook('tone', i)}
                    aria-label="{t('hero.tone')} {i + 1}"
                  ></button>
                {/each}
              </div>
            </div>
          {:else if tab === 'wardrobe'}
            {#if store.data.owned.length === 0}
              <div class="empty">
                <Icon name="bag" size={32} />
                <p>{t('hero.emptyWardrobe')}</p>
                <button class="btn soft" onclick={() => store.navigate('shop')}><Icon name="bag" size={16} />{t('hero.goShop')}</button>
              </div>
            {:else}
              {#each ['hat', 'acc', 'pet', 'bg'] as const as slot}
                <div class="field">
                  <span class="label">{t(`hero.slots.${slot}`)}</span>
                  <div class="items">
                    <button class="item none" class:on={!store.data.equipped[slot]} onclick={() => store.equip(slot, null)}>
                      <span class="none-art"><Icon name="x" size={22} /></span>
                      <span class="iname">{t('hero.noItem')}</span>
                    </button>
                    {#each owned(slot) as it (it.id)}
                      <button class="item" class:on={store.data.equipped[slot] === it.id} onclick={() => store.equip(slot, it.id)}>
                        <ItemThumb id={it.id} size={74} />
                        <span class="iname">{itemName(it.id)}</span>
                        {#if it.login}<span class="excl" title={t('common.exclusive')}><Icon name="spark" size={11} /></span>{/if}
                        {#if store.data.equipped[slot] === it.id}<span class="tick"><Icon name="check" size={12} stroke={3} /></span>{/if}
                      </button>
                    {/each}
                  </div>
                </div>
              {/each}
            {/if}
          {:else}
            <ol class="ladder">
              {#each RANKS as r, i (r.id)}
                {@const reached = store.lvl.level >= r.minLevel}
                {@const current = store.rank.id === r.id}
                <li class:reached class:current style="--rank:{r.color}">
                  <RankBadge rank={r} size={42} locked={!reached} />
                  <div class="r-body">
                    <div class="r-top">
                      <strong>{t(`ranks.${r.id}`)}</strong>
                      <span class="chip">{t('hero.levelShort', { n: r.minLevel })}</span>
                      {#if current}<span class="chip accent">{t('hero.current')}</span>{:else if reached}<span class="chip success">{t('hero.reached')}</span>{/if}
                    </div>
                    <p>{t(`rankDesc.${r.id}`)}</p>
                    {#if current && RANKS[i + 1]}
                      {@const nx = RANKS[i + 1]}
                      {@const span = nx.minLevel - r.minLevel}
                      <div class="r-prog">
                        <XPBar progress={(store.lvl.level - r.minLevel + store.lvl.progress) / span} height={6} shimmer={false} />
                      </div>
                    {/if}
                  </div>
                </li>
              {/each}
            </ol>
          {/if}
        </div>
      {/key}
    </section>
  </div>
</div>

<style>
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    gap: 18px;
    align-items: start;
  }
  .left {
    display: flex;
    flex-direction: column;
    gap: 18px;
    position: sticky;
    top: 0;
  }
  .stage-card {
    padding: 12px;
  }
  .stage {
    position: relative;
    height: 300px;
    border-radius: 16px;
    overflow: hidden;
    isolation: isolate;
  }
  .figure {
    position: absolute;
    left: 50%;
    bottom: 6px;
    transform: translateX(-50%);
  }
  .identity {
    padding: 14px 8px 6px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .id-top {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .id-top h2 {
    font-size: 22px;
  }
  .id-top p {
    color: var(--ink-3);
    font-size: 13px;
    font-weight: 700;
  }
  .xp-line {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    font-size: 12.5px;
    font-weight: 700;
    color: var(--ink-3);
  }
  .attrs {
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .attrs h3 {
    font-size: 17px;
    margin-bottom: 2px;
  }
  .attr {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .a-icon {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 9px;
    color: var(--c);
    background: color-mix(in srgb, var(--c) 13%, transparent);
  }
  .a-name {
    width: 92px;
    font-weight: 750;
    font-size: 13.5px;
  }
  .a-bar {
    flex: 1;
    height: 8px;
    border-radius: 99px;
    background: var(--surface-3);
    overflow: hidden;
  }
  .a-bar span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--c);
    transition: width 0.8s var(--ease-out);
  }
  .attr b {
    width: 30px;
    text-align: right;
    font-weight: 800;
    font-size: 13.5px;
  }
  .right {
    padding: 16px;
  }
  .tab {
    padding: 18px 4px 4px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .sw {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--c);
    box-shadow:
      inset 0 0 0 1px var(--swatch-ring),
      0 0 0 0 var(--accent);
    transition: transform 0.2s var(--ease-spring), box-shadow 0.2s;
  }
  .sw:hover {
    transform: scale(1.1);
  }
  .sw.on {
    box-shadow:
      inset 0 0 0 1px var(--swatch-ring),
      0 0 0 3px var(--surface),
      0 0 0 5px var(--accent);
  }
  .hairs {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
  }
  .hair {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    border-radius: 14px;
    background: var(--stage);
    border: 2px solid transparent;
    overflow: hidden;
    transition: border-color 0.2s, transform 0.2s var(--ease-out);
  }
  .hair:hover {
    transform: translateY(-2px);
  }
  .hair.on {
    border-color: var(--accent);
  }
  .tier {
    margin: 2px 0 8px;
    font-size: 11.5px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .tier:not(:first-of-type) {
    margin-top: 14px;
  }
  .chars {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(86px, 1fr));
    gap: 8px;
  }
  .char {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 6px 4px 8px;
    border-radius: 14px;
    border: 1.5px solid var(--line);
    background: var(--surface-2);
    transition:
      border-color 0.2s,
      background-color 0.2s,
      transform 0.25s var(--ease-spring);
  }
  .char:hover {
    transform: translateY(-2px);
    border-color: var(--line-2);
  }
  .char.on {
    border-color: var(--accent);
    background: var(--accent-softer);
  }
  .char-art {
    width: 100%;
    height: 82px;
    border-radius: 10px;
    background: var(--stage);
    display: grid;
    place-items: end center;
    overflow: hidden;
  }
  .char.locked .char-art :global(svg) {
    filter: grayscale(0.85) opacity(0.55);
  }
  .char-name {
    font-size: 12px;
    font-weight: 800;
    text-align: center;
    line-height: 1.15;
  }
  .char-lock {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10.5px;
    font-weight: 800;
    color: var(--ink-3);
  }
  .char-desc {
    margin-top: 10px;
    font-size: 13px;
    color: var(--ink-3);
  }
  .char-desc b {
    color: var(--ink);
  }
  .tones {
    display: flex;
    gap: 10px;
  }
  .tone {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--a) 0 55%, var(--b) 55% 100%);
    box-shadow:
      inset 0 0 0 1px var(--swatch-ring),
      inset -5px -5px 0 -2px var(--c);
    transition:
      transform 0.2s var(--ease-spring),
      box-shadow 0.2s;
  }
  .tone:hover {
    transform: scale(1.08);
  }
  .tone.on {
    box-shadow:
      inset 0 0 0 1px var(--swatch-ring),
      inset -5px -5px 0 -2px var(--c),
      0 0 0 3px var(--surface),
      0 0 0 5px var(--accent);
  }
  .excl {
    position: absolute;
    top: 10px;
    left: 10px;
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ffd27a, #f4743b);
    color: #fff;
  }
  .items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: 8px;
  }
  .item {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 6px 6px 8px;
    border-radius: 16px;
    border: 1.5px solid var(--line);
    background: var(--surface-2);
    transition: border-color 0.2s, transform 0.2s var(--ease-out);
  }
  .item:hover {
    transform: translateY(-2px);
  }
  .item.on {
    border-color: var(--accent);
  }
  .none-art {
    display: grid;
    place-items: center;
    height: 74px;
    border-radius: 14px;
    background: var(--surface-3);
    color: var(--ink-4);
  }
  .iname {
    font-size: 12px;
    font-weight: 750;
    text-align: center;
    color: var(--ink-2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tick {
    position: absolute;
    top: 10px;
    right: 10px;
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
  }
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 40px 10px;
    color: var(--ink-3);
    font-weight: 700;
    text-align: center;
  }
  .ladder {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ladder li {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px solid var(--line);
    background: var(--surface-2);
  }
  .ladder li.current {
    border-color: color-mix(in srgb, var(--rank) 50%, var(--line));
    background: color-mix(in srgb, var(--rank) 8%, var(--surface));
  }
  .r-body {
    flex: 1;
    min-width: 0;
  }
  .r-top {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .r-top strong {
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 650;
  }
  .reached .r-top strong {
    color: var(--rank);
  }
  .r-body p {
    font-size: 13px;
    color: var(--ink-3);
    margin-top: 2px;
  }
  .r-prog {
    margin-top: 10px;
  }
  @media (max-width: 1140px) {
    .layout {
      grid-template-columns: 1fr;
    }
    .left {
      position: static;
    }
  }
</style>
