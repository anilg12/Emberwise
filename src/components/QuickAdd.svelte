<script lang="ts">
  import { store } from '../lib/state.svelte';
  import { t } from '../lib/i18n.svelte';
  import { parseQuick } from '../lib/quickadd';
  import { dayLabel } from '../lib/format';
  import { sfx } from '../lib/sound';
  import Icon from './Icon.svelte';

  let { inputEl = $bindable() }: { inputEl?: HTMLInputElement } = $props();

  let value = $state('');
  let focused = $state(false);
  const parsed = $derived(value.trim() ? parseQuick(value, store.today) : null);

  function submit() {
    if (!parsed) return;
    store.createTask({ title: parsed.title, time: parsed.time, date: parsed.date });
    sfx.pop();
    value = '';
  }

  function more() {
    store.openEditor(null, parsed ? { title: parsed.title, time: parsed.time, date: parsed.date } : { date: store.today });
    value = '';
  }
</script>

<div class="qa" class:focused>
  <span class="plus"><Icon name="plus" size={18} /></span>
  <input
    bind:this={inputEl}
    bind:value
    placeholder={t('today.quickAdd')}
    maxlength="200"
    onfocus={() => (focused = true)}
    onblur={() => (focused = false)}
    onkeydown={(e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) more();
        else submit();
      }
      if (e.key === 'Escape') {
        value = '';
        (e.currentTarget as HTMLInputElement).blur();
      }
    }}
  />
  {#if parsed && (parsed.time || parsed.date !== store.today)}
    <span class="parsed">
      {#if parsed.date && parsed.date !== store.today}<span class="chip"><Icon name="calendar" size={12} />{dayLabel(parsed.date, store.today)}</span>{/if}
      {#if parsed.time}<span class="chip accent"><Icon name="bell" size={12} />{parsed.time}</span>{/if}
    </span>
  {/if}
  <button class="more" onclick={more} title={t('tasks.new')} aria-label={t('tasks.new')}><Icon name="sliders" size={16} /></button>
</div>
{#if focused}
  <p class="hint">{t('today.quickHint')}</p>
{/if}

<style>
  .qa {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 50px;
    padding: 0 8px 0 14px;
    border-radius: 16px;
    background: var(--surface);
    border: 1px dashed var(--line-2);
    transition:
      border-color 0.2s,
      box-shadow 0.2s,
      background-color 0.2s;
  }
  .qa:hover {
    border-color: color-mix(in srgb, var(--accent) 40%, var(--line-2));
  }
  .qa.focused {
    border-style: solid;
    border-color: var(--accent);
    box-shadow: var(--focus-ring);
  }
  .plus {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    color: var(--accent);
    background: var(--accent-soft);
    flex: none;
    transition: transform 0.3s var(--ease-spring);
  }
  .focused .plus {
    transform: rotate(90deg);
  }
  input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: none;
    background: transparent;
    font-weight: 650;
    font-size: 15px;
  }
  input::placeholder {
    color: var(--ink-4);
    font-weight: 550;
  }
  .parsed {
    display: flex;
    gap: 6px;
    flex: none;
  }
  .more {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    color: var(--ink-3);
    flex: none;
  }
  .more:hover {
    background: var(--hover);
    color: var(--ink);
  }
  .hint {
    margin: 7px 4px 0;
    font-size: 12px;
    color: var(--ink-4);
    font-weight: 600;
  }
</style>
