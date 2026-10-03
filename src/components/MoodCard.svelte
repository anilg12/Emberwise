<script lang="ts">
  import { store } from '../lib/state.svelte';
  import { t, tv } from '../lib/i18n.svelte';
  import { fx } from '../lib/fx.svelte';
  import { sfx } from '../lib/sound';
  import { motivate } from '../lib/actions';
  import { rise } from '../lib/motion';
  import MoodFace from './MoodFace.svelte';

  const entry = $derived(store.data.journal[store.today]);
  const labels = $derived(tv<string[]>('today.moods'));

  function pick(mood: number, el: HTMLElement) {
    const first = store.setMood(mood);
    sfx.pop();
    if (first) {
      const r = el.getBoundingClientRect();
      fx.float('+10 XP', 'xp', { x: r.left + r.width / 2, y: r.top });
    }
    motivate(mood <= 2 ? 'low' : mood >= 4 ? 'high' : 'life', mood <= 2 ? 'calm' : 'happy', 9000);
  }
</script>

<section class="card mood">
  <p class="eyebrow">{t('today.moodTitle')}</p>
  <div class="faces" role="radiogroup" aria-label={t('today.moodTitle')}>
    {#each [1, 2, 3, 4, 5] as m}
      <button
        class="face"
        class:on={entry?.mood === m}
        class:dim={!!entry && entry.mood !== m}
        role="radio"
        aria-checked={entry?.mood === m}
        title={labels[m - 1]}
        onclick={(e) => pick(m, e.currentTarget)}
      >
        <MoodFace mood={m} size={36} />
        <span>{labels[m - 1]}</span>
      </button>
    {/each}
  </div>
  {#if entry}
    <div class="note" in:rise={{ y: 4 }}>
      <input
        class="input"
        value={entry.note}
        maxlength="280"
        placeholder={t('today.notePh')}
        oninput={(e) => store.setJournalNote((e.currentTarget as HTMLInputElement).value)}
      />
    </div>
  {/if}
</section>

<style>
  .mood {
    padding: 16px 18px;
  }
  .faces {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    margin-top: 10px;
  }
  .face {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 2px 6px;
    border-radius: 14px;
    border: 1.5px solid transparent;
    font-size: 11px;
    font-weight: 800;
    color: var(--ink-3);
    transition:
      transform 0.25s var(--ease-spring),
      opacity 0.2s,
      background-color 0.2s,
      border-color 0.2s;
  }
  .face:hover {
    transform: translateY(-3px) scale(1.04);
    background: var(--hover);
  }
  .face.on {
    background: var(--accent-softer);
    border-color: color-mix(in srgb, var(--accent) 40%, transparent);
    color: var(--ink);
    transform: translateY(-2px);
  }
  .face.on :global(svg) {
    animation: bounce 0.5s var(--ease-spring);
  }
  @keyframes bounce {
    from {
      transform: scale(0.7);
    }
  }
  .face.dim {
    opacity: 0.55;
  }
  .face span {
    white-space: nowrap;
  }
  .note {
    margin-top: 10px;
  }
  .note .input {
    width: 100%;
  }
</style>
