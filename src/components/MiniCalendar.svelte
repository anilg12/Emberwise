<script lang="ts">
  import { untrack } from 'svelte';
  import { dayKey, parseDayKey } from '../lib/dates';
  import { fmtDate, t, tv } from '../lib/i18n.svelte';
  import Icon from './Icon.svelte';

  let {
    value,
    today,
    onselect,
    min = null,
  }: { value: string | null; today: string; onselect: (key: string) => void; min?: string | null } = $props();

  // opens on the selected month, navigating after that is local
  const start = parseDayKey(untrack(() => value ?? today));
  let year = $state(start.getFullYear());
  let month = $state(start.getMonth());

  const cells = $derived.by(() => {
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7; // Monday first
    const days = new Date(year, month + 1, 0).getDate();
    const total = Math.ceil((offset + days) / 7) * 7;
    const out: { key: string; day: number; inMonth: boolean }[] = [];
    for (let i = 0; i < total; i++) {
      const d = new Date(year, month, 1 - offset + i);
      out.push({ key: dayKey(d), day: d.getDate(), inMonth: d.getMonth() === month });
    }
    return out;
  });
  const title = $derived(fmtDate(new Date(year, month, 1), { month: 'long', year: 'numeric' }));
  const names = $derived(tv<string[]>('calendar.weekdaysShort'));
  const order = [1, 2, 3, 4, 5, 6, 0];

  function shift(n: number) {
    const d = new Date(year, month + n, 1);
    year = d.getFullYear();
    month = d.getMonth();
  }
</script>

<div class="cal">
  <div class="head">
    <button class="icon-btn" onclick={() => shift(-1)} aria-label={t('calendar.prev')}><Icon name="left" size={16} /></button>
    <strong>{title}</strong>
    <button class="icon-btn" onclick={() => shift(1)} aria-label={t('calendar.next')}><Icon name="right" size={16} /></button>
  </div>
  <div class="grid">
    {#each order as w}
      <span class="wd">{names[w]}</span>
    {/each}
    {#each cells as c (c.key)}
      <button
        class="day"
        class:out={!c.inMonth}
        class:today={c.key === today}
        class:sel={c.key === value}
        disabled={!!min && c.key < min}
        onclick={() => onselect(c.key)}
      >
        {c.day}
      </button>
    {/each}
  </div>
</div>

<style>
  .cal {
    padding: 10px;
    border-radius: 16px;
    background: var(--surface-2);
    border: 1px solid var(--line);
    width: 100%;
    max-width: 300px;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .head strong {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 15px;
    text-transform: capitalize;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }
  .wd {
    text-align: center;
    font-size: 11px;
    font-weight: 800;
    color: var(--ink-4);
    padding: 4px 0;
  }
  .day {
    height: 32px;
    border-radius: 9px;
    font-weight: 700;
    font-size: 13px;
    color: var(--ink-2);
    font-variant-numeric: tabular-nums;
    transition: background-color 0.15s, color 0.15s;
  }
  .day:hover:not(:disabled) {
    background: var(--hover);
  }
  .day.out {
    color: var(--ink-4);
  }
  .day.today {
    color: var(--accent-text);
    box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--accent) 50%, transparent);
  }
  .day.sel {
    background: var(--accent);
    color: var(--accent-ink);
    box-shadow: none;
  }
  .day:disabled {
    opacity: 0.3;
  }
</style>
