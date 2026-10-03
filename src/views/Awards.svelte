<script lang="ts">
  import { store } from '../lib/state.svelte';
  import { t, fmtDate } from '../lib/i18n.svelte';
  import { ACHIEVEMENTS, achievementContext } from '../lib/catalog';
  import { ICONS } from '../lib/icons';
  import { rise } from '../lib/motion';
  import XPBar from '../components/XPBar.svelte';
  import Icon from '../components/Icon.svelte';

  const ctx = $derived(achievementContext(store.data, store.lvl.level));
  const list = $derived(
    ACHIEVEMENTS.map((a) => {
      const [cur, target] = a.progress(ctx);
      const at = store.data.achievements[a.id];
      return { a, cur, target, at, unlocked: !!at };
    }).sort((x, y) => Number(y.unlocked) - Number(x.unlocked)),
  );
  const unlockedCount = $derived(list.filter((x) => x.unlocked).length);

  function dateLabel(iso: string): string {
    const d = new Date(iso);
    const sameYear = d.getFullYear() === new Date().getFullYear();
    return t('awards.unlockedOn', {
      date: fmtDate(d, sameYear ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'short', year: 'numeric' }),
    });
  }
</script>

<div class="page">
  <header class="page-head" in:rise>
    <div>
      <h1>{t('awards.title')}</h1>
      <p>{t('awards.subtitle', { n: unlockedCount, total: ACHIEVEMENTS.length })}</p>
    </div>
    <div class="overall">
      <XPBar progress={unlockedCount / ACHIEVEMENTS.length} height={10} />
      <span class="num">{Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}%</span>
    </div>
  </header>

  <div class="grid">
    {#each list as item, i (item.a.id)}
      <article class="card award" class:unlocked={item.unlocked} in:rise={{ delay: Math.min(i, 12) * 22 }}>
        <div class="medal">
          <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
            <circle cx="32" cy="32" r="28" class="m-outer" />
            <circle cx="32" cy="32" r="22.5" class="m-inner" />
            <circle cx="32" cy="32" r="28" class="m-ring" />
            <g transform="translate(20 20)" class="m-icon" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
              {@html ICONS[item.a.icon] ?? ICONS.star}
            </g>
          </svg>
        </div>
        <div class="body">
          <h3>{t(`awards.items.${item.a.id}.0`)}</h3>
          <p>{t(`awards.items.${item.a.id}.1`)}</p>
          <div class="foot">
            {#if item.unlocked}
              <span class="when"><Icon name="check" size={13} stroke={2.6} />{dateLabel(item.at)}</span>
            {:else}
              <div class="prog">
                <XPBar progress={item.cur / item.target} height={6} tone="accent" shimmer={false} />
                <span class="num">{item.cur}/{item.target}</span>
              </div>
            {/if}
            <span class="reward">
              {#if item.a.xp}<b>+{item.a.xp} XP</b>{/if}
              {#if item.a.gold}<span class="coin"><Icon name="coin" size={12} />{item.a.gold}</span>{/if}
            </span>
          </div>
        </div>
      </article>
    {/each}
  </div>
</div>

<style>
  .overall {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 240px;
    font-weight: 800;
    color: var(--ink-2);
  }
  .overall :global(.bar) {
    flex: 1;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 12px;
  }
  .award {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px 14px 14px;
    transition: transform 0.25s var(--ease-out), box-shadow 0.25s;
  }
  .award:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow);
  }
  .medal {
    flex: none;
    transition: transform 0.4s var(--ease-spring);
  }
  .award.unlocked:hover .medal {
    transform: rotate(-8deg) scale(1.06);
  }
  .m-outer {
    fill: var(--surface-3);
  }
  .m-inner {
    fill: var(--surface-2);
  }
  .m-ring {
    fill: none;
    stroke: var(--line-2);
    stroke-width: 2;
  }
  .m-icon {
    stroke: var(--ink-4);
  }
  .unlocked .m-outer {
    fill: #f2c14e;
  }
  .unlocked .m-inner {
    fill: #ffe39a;
  }
  .unlocked .m-ring {
    stroke: #d99a25;
  }
  .unlocked .m-icon {
    stroke: #8a5a14;
  }
  :global(html.dark) .unlocked .m-outer {
    fill: #d9a43a;
  }
  :global(html.dark) .unlocked .m-inner {
    fill: #f6d27e;
  }
  .body {
    flex: 1;
    min-width: 0;
  }
  .body h3 {
    font-size: 16px;
    font-weight: 650;
  }
  .award:not(.unlocked) h3 {
    color: var(--ink-2);
  }
  .body p {
    font-size: 12.5px;
    color: var(--ink-3);
    margin-top: 1px;
  }
  .foot {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
  }
  .when {
    flex: 1;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 800;
    color: var(--success);
  }
  .prog {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .prog :global(.bar) {
    flex: 1;
  }
  .prog span {
    font-size: 11.5px;
    font-weight: 800;
    color: var(--ink-3);
  }
  .reward {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 11.5px;
    font-weight: 800;
    color: var(--ink-3);
    white-space: nowrap;
  }
  .reward b {
    font-weight: 800;
  }
  .coin {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
  .unlocked .reward {
    color: var(--gold);
  }
</style>
