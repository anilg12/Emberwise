<script lang="ts">
  import { store } from '../lib/state.svelte';
  import { timer } from '../lib/timer.svelte';
  import { t } from '../lib/i18n.svelte';
  import { AMBIENCES, PRESETS, mixSize } from '../lib/ambience';
  import type { AmbientKind, AmbientMix } from '../lib/types';
  import Icon from './Icon.svelte';

  const mix = $derived(store.data.settings.ambient);
  const playingByTimer = $derived(timer.status === 'running' && timer.phase === 'focus');
  const audible = $derived(playingByTimer || store.listening);
  const groups = ['nature', 'places', 'noise'] as const;
  const activePreset = $derived(
    PRESETS.find((p) => {
      const keys = Object.keys(p.mix);
      return keys.length === mixSize(mix) && keys.every((k) => (mix[k as AmbientKind] ?? 0) > 0);
    })?.id ?? null,
  );

  function toggle(kind: AmbientKind) {
    const next: AmbientMix = { ...mix };
    if ((next[kind] ?? 0) > 0) delete next[kind];
    else next[kind] = 0.6;
    store.setMix(next);
    if (mixSize(next) && !playingByTimer) store.listening = true;
    if (!mixSize(next)) store.listening = false;
  }

  function level(kind: AmbientKind, v: number) {
    store.setMix({ ...mix, [kind]: Math.max(0.02, v) });
  }

  function preset(m: AmbientMix) {
    store.setMix({ ...m });
    if (!playingByTimer) store.listening = true;
  }

  function silence() {
    store.setMix({});
    store.listening = false;
  }
</script>

<section class="card mixer">
  <div class="head">
    <div>
      <p class="eyebrow">{t('focus.mixer')}</p>
      <p class="hint">{playingByTimer ? t('focus.playsDuring') : t('focus.mixHint')}</p>
    </div>
    {#if !playingByTimer}
      <button
        class="listen"
        class:on={store.listening}
        disabled={!mixSize(mix)}
        onclick={() => (store.listening = !store.listening)}
        aria-pressed={store.listening}
      >
        {#if store.listening}
          <span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>{t('focus.stopListen')}
        {:else}
          <Icon name="play" size={13} />{t('focus.listen')}
        {/if}
      </button>
    {:else}
      <span class="listen on static"><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span></span>
    {/if}
  </div>

  {#each groups as g}
    <p class="group">{t(`focus.soundGroups.${g}`)}</p>
    <div class="tiles">
      {#each AMBIENCES.filter((a) => a.group === g) as a (a.id)}
        {@const on = (mix[a.id] ?? 0) > 0}
        <div class="tile" class:on class:live={on && audible}>
          <button class="tile-btn" onclick={() => toggle(a.id)} aria-pressed={on}>
            <span class="t-icon"><Icon name={a.icon} size={18} /></span>
            <span class="t-name">{t(`focus.sounds.${a.id}`)}</span>
          </button>
          {#if on}
            <input
              class="t-level"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={mix[a.id]}
              style="--p:{(mix[a.id] ?? 0) * 100}%"
              oninput={(e) => level(a.id, Number((e.currentTarget as HTMLInputElement).value))}
              aria-label="{t(`focus.sounds.${a.id}`)} · {t('focus.volume')}"
            />
          {/if}
        </div>
      {/each}
    </div>
  {/each}

  <p class="group">{t('focus.presets')}</p>
  <div class="presets">
    {#each PRESETS as p (p.id)}
      <button class="chip-btn" class:on={activePreset === p.id} onclick={() => preset(p.mix)}>{t(`focus.presetNames.${p.id}`)}</button>
    {/each}
  </div>

  <div class="foot">
    <label class="master" class:dim={!mixSize(mix)}>
      <Icon name="volume" size={16} />
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={store.data.settings.ambientVolume}
        style="--p:{store.data.settings.ambientVolume * 100}%"
        oninput={(e) => store.setSetting('ambientVolume', Number((e.currentTarget as HTMLInputElement).value))}
        aria-label={t('focus.master')}
      />
    </label>
    <button class="btn ghost sm" onclick={silence} disabled={!mixSize(mix)}><Icon name="mute" size={15} />{t('focus.silence')}</button>
  </div>
</section>

<style>
  .mixer {
    padding: 16px;
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 4px;
  }
  .hint {
    font-size: 12px;
    color: var(--ink-3);
    font-weight: 650;
    margin-top: 2px;
    line-height: 1.35;
  }
  .listen {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 12px;
    border-radius: 99px;
    font-size: 12px;
    font-weight: 800;
    background: var(--surface-2);
    border: 1px solid var(--line);
    color: var(--ink-2);
    transition:
      background-color 0.2s,
      color 0.2s,
      border-color 0.2s;
  }
  .listen:hover:not(:disabled) {
    border-color: var(--line-2);
    color: var(--ink);
  }
  .listen:disabled {
    opacity: 0.45;
  }
  .listen.on {
    background: var(--accent-soft);
    border-color: color-mix(in srgb, var(--accent) 35%, transparent);
    color: var(--accent-text);
  }
  .listen.static {
    padding: 0 10px;
  }
  .eq {
    display: inline-flex;
    align-items: flex-end;
    gap: 2px;
    height: 12px;
  }
  .eq i {
    width: 3px;
    height: 100%;
    border-radius: 2px;
    background: currentColor;
    transform-origin: bottom;
    animation: eq 1.1s ease-in-out infinite;
  }
  .eq i:nth-child(2) {
    animation-delay: -0.35s;
  }
  .eq i:nth-child(3) {
    animation-delay: -0.7s;
  }
  @keyframes eq {
    0%,
    100% {
      transform: scaleY(0.3);
    }
    50% {
      transform: scaleY(1);
    }
  }
  .group {
    margin: 14px 0 7px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--ink-4);
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  .tile {
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    background: var(--surface-2);
    border: 1px solid var(--line);
    overflow: hidden;
    transition:
      background-color 0.2s,
      border-color 0.2s;
  }
  .tile.on {
    background: var(--accent-softer);
    border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  }
  .tile-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 9px 4px 7px;
    color: var(--ink-3);
    font-size: 11.5px;
    font-weight: 750;
    transition: color 0.18s;
  }
  .tile-btn:hover {
    color: var(--ink);
  }
  .tile.on .tile-btn {
    color: var(--accent-text);
  }
  .t-icon {
    display: grid;
    transition: transform 0.3s var(--ease-spring);
  }
  .tile-btn:hover .t-icon {
    transform: scale(1.1);
  }
  .tile.live .t-icon {
    animation: breathe 3.2s ease-in-out infinite;
  }
  @keyframes breathe {
    50% {
      transform: scale(1.12);
    }
  }
  .t-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  .t-level {
    margin: 0 8px 8px;
    height: 14px;
  }
  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip-btn {
    height: 28px;
    padding: 0 11px;
    border-radius: 99px;
    font-size: 12px;
    font-weight: 750;
    background: var(--surface-2);
    border: 1px solid var(--line);
    color: var(--ink-2);
    transition:
      background-color 0.18s,
      border-color 0.18s,
      color 0.18s;
  }
  .chip-btn:hover {
    border-color: var(--line-2);
    color: var(--ink);
  }
  .chip-btn.on {
    background: var(--accent-soft);
    border-color: color-mix(in srgb, var(--accent) 40%, transparent);
    color: var(--accent-text);
  }
  .foot {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 14px;
  }
  .master {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--ink-3);
    transition: opacity 0.2s;
  }
  .master.dim {
    opacity: 0.45;
  }
  .master input {
    flex: 1;
  }
</style>
