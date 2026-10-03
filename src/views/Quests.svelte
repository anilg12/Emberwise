<script lang="ts">
  import { flip } from 'svelte/animate';
  import { store, categoryName, categoryColor, compareOpen } from '../lib/state.svelte';
  import { t, i18n } from '../lib/i18n.svelte';
  import { addDays } from '../lib/dates';
  import { dayLabel } from '../lib/format';
  import { fx } from '../lib/fx.svelte';
  import { modKey } from '../lib/platform';
  import { rise, d } from '../lib/motion';
  import type { Task } from '../lib/types';
  import Icon from '../components/Icon.svelte';
  import Segmented from '../components/Segmented.svelte';
  import TaskItem from '../components/TaskItem.svelte';
  import QuickAdd from '../components/QuickAdd.svelte';
  import Ember from '../components/Ember.svelte';

  type Filter = 'today' | 'upcoming' | 'all' | 'habits' | 'done';
  type Row = { key: string; kind: 'header'; label: string } | { key: string; kind: 'task'; task: Task; showDate: boolean };

  let filter = $state<Filter>('today');
  let category = $state<string | null>(null);
  let query = $state('');
  let searchEl: HTMLInputElement | undefined = $state();
  let confirmClear = $state(false);

  const today = $derived(store.today);
  const norm = (s: string) => s.toLocaleLowerCase(i18n.locale);

  const matches = (task: Task) => {
    if (category && task.categoryId !== category) return false;
    const q = norm(query.trim());
    if (!q) return true;
    return norm(task.title).includes(q) || norm(task.purpose).includes(q) || task.subtasks.some((s) => norm(s.title).includes(q));
  };

  const counts = $derived({
    today: store.todayTasks.open.length,
    upcoming: store.data.tasks.filter((x) => x.repeat === 'none' && !x.done && x.date && x.date > today).length,
    all: store.data.tasks.filter((x) => x.repeat !== 'none' || !x.done).length,
    habits: store.data.tasks.filter((x) => x.repeat !== 'none').length,
    done: store.data.tasks.filter((x) => x.repeat === 'none' && x.done).length,
  });

  const rows = $derived.by((): Row[] => {
    const out: Row[] = [];
    const push = (task: Task, showDate = false) => {
      if (matches(task)) out.push({ key: task.id, kind: 'task', task, showDate });
    };
    if (filter === 'today') {
      store.todayTasks.open.forEach((x) => push(x));
      const done = store.todayTasks.done.filter(matches);
      if (done.length) {
        out.push({ key: 'h-done', kind: 'header', label: t('tasks.doneToday') });
        done.forEach((x) => push(x));
      }
    } else if (filter === 'upcoming') {
      const items = store.data.tasks
        .filter((x) => x.repeat === 'none' && !x.done && x.date && x.date > today)
        .sort((a, b) => (a.date! < b.date! ? -1 : a.date! > b.date! ? 1 : compareOpen(a, b, today)));
      let last = '';
      for (const x of items) {
        if (!matches(x)) continue;
        if (x.date !== last) {
          last = x.date!;
          out.push({ key: `h-${last}`, kind: 'header', label: dayLabel(last, today) });
        }
        push(x);
      }
    } else if (filter === 'all') {
      const oneOff = store.data.tasks.filter((x) => x.repeat === 'none' && !x.done);
      const dated = oneOff.filter((x) => x.date).sort((a, b) => (a.date! < b.date! ? -1 : a.date! > b.date! ? 1 : compareOpen(a, b, today)));
      const undated = oneOff.filter((x) => !x.date).sort((a, b) => compareOpen(a, b, today));
      dated.forEach((x) => push(x, true));
      const und = undated.filter(matches);
      if (und.length) {
        out.push({ key: 'h-nodate', kind: 'header', label: t('tasks.groupNoDate') });
        und.forEach((x) => push(x));
      }
      const habits = store.data.tasks.filter((x) => x.repeat !== 'none' && matches(x));
      if (habits.length) {
        out.push({ key: 'h-habits', kind: 'header', label: t('tasks.filters.habits') });
        habits.forEach((x) => push(x));
      }
    } else if (filter === 'habits') {
      store.data.tasks.filter((x) => x.repeat !== 'none').sort((a, b) => compareOpen(a, b, today)).forEach((x) => push(x));
    } else {
      store.data.tasks
        .filter((x) => x.repeat === 'none' && x.done)
        .sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? ''))
        .forEach((x) => push(x, true));
    }
    return out;
  });

  const filterOptions = $derived(
    (['today', 'upcoming', 'all', 'habits', 'done'] as Filter[]).map((f) => ({
      value: f,
      label: counts[f] ? `${t(`tasks.filters.${f}`)} · ${counts[f]}` : t(`tasks.filters.${f}`),
    })),
  );

  function clearDone() {
    if (!confirmClear) {
      confirmClear = true;
      setTimeout(() => (confirmClear = false), 4000);
      return;
    }
    confirmClear = false;
    const n = store.clearCompleted();
    if (n) fx.toast({ kind: 'info', icon: 'trash', title: t('tasks.cleared', { n }), body: t('tasks.keepXp') });
  }

  function onWindowKey(e: KeyboardEvent) {
    const el = e.target as HTMLElement;
    if (e.key === '/' && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA' && !store.editor.open) {
      e.preventDefault();
      searchEl?.focus();
    }
  }

  function newTask() {
    store.openEditor(null, { date: filter === 'upcoming' ? addDays(today, 1) : today, repeat: filter === 'habits' ? 'daily' : 'none' });
  }
</script>

<svelte:window onkeydown={onWindowKey} />

<div class="page">
  <header class="page-head" in:rise>
    <div>
      <h1>{t('tasks.title')}</h1>
      <p>{t('tasks.subtitle')}</p>
    </div>
    <div class="head-actions">
      <label class="search">
        <Icon name="search" size={16} />
        <input bind:this={searchEl} bind:value={query} placeholder={t('common.search')} onkeydown={(e) => e.key === 'Escape' && (query = '')} />
        {#if query}
          <button class="clear" onclick={() => (query = '')} aria-label={t('common.clear')}><Icon name="x" size={13} /></button>
        {:else}
          <span class="kbd">/</span>
        {/if}
      </label>
      <button class="btn primary" onclick={newTask} title="{modKey}+N"><Icon name="plus" size={17} />{t('tasks.new')}</button>
    </div>
  </header>

  <div class="toolbar" in:rise={{ delay: 40 }}>
    <Segmented options={filterOptions} value={filter} onchange={(f) => (filter = f)} />
    {#if filter === 'done' && counts.done > 0}
      <button class="btn sm" class:danger-soft={confirmClear} onclick={clearDone}>
        <Icon name="trash" size={15} />{confirmClear ? t('common.sure') : t('tasks.clearDone')}
      </button>
    {/if}
  </div>

  {#if store.data.categories.length}
    <div class="cats" in:rise={{ delay: 70 }}>
      <button class="cat" class:on={category === null} onclick={() => (category = null)}>{t('tasks.allCategories')}</button>
      {#each store.data.categories as c (c.id)}
        <button class="cat" class:on={category === c.id} style="--c:{categoryColor(c.color, store.dark)}" onclick={() => (category = category === c.id ? null : c.id)}>
          <i></i>{categoryName(c)}
        </button>
      {/each}
    </div>
  {/if}

  {#if filter === 'today' || filter === 'all'}
    <div class="qa" in:rise={{ delay: 90 }}><QuickAdd /></div>
  {/if}

  <div class="list">
    {#each rows as row (row.key)}
      <div class="row" animate:flip={{ duration: d(320) }} in:rise={{ y: 6, duration: 240 }}>
        {#if row.kind === 'header'}
          <p class="group">{row.label}</p>
        {:else}
          <TaskItem task={row.task} showDate={row.showDate} />
        {/if}
      </div>
    {/each}
  </div>

  {#if rows.length === 0}
    <div class="empty" in:rise>
      <Ember size={84} mood={query ? 'wow' : 'sleepy'} />
      <p>{query ? t('tasks.empty.search') : t(`tasks.empty.${filter}`)}</p>
      {#if !query && filter !== 'done'}
        <button class="btn soft" onclick={newTask}><Icon name="plus" size={16} />{t('tasks.new')}</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .head-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 38px;
    width: 230px;
    padding: 0 8px 0 12px;
    border-radius: 12px;
    background: var(--surface);
    border: 1px solid var(--line-2);
    color: var(--ink-4);
    transition: border-color 0.16s, box-shadow 0.16s;
  }
  .search:focus-within {
    border-color: var(--accent);
    box-shadow: var(--focus-ring);
    color: var(--accent);
  }
  .search input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    font-weight: 650;
    color: var(--ink);
  }
  .search input::placeholder {
    color: var(--ink-4);
  }
  .search .kbd {
    height: 22px;
    min-width: 22px;
    font-size: 11px;
  }
  .clear {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    color: var(--ink-3);
  }
  .clear:hover {
    background: var(--hover);
  }
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .cats {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 14px;
  }
  .cat {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 12px;
    border-radius: 99px;
    border: 1px solid var(--line);
    background: transparent;
    font-weight: 700;
    font-size: 12.5px;
    color: var(--ink-3);
    transition: all 0.18s var(--ease-out);
  }
  .cat i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--c);
  }
  .cat:hover {
    color: var(--ink);
    border-color: var(--line-2);
  }
  .cat.on {
    background: var(--surface);
    color: var(--ink);
    border-color: var(--line-2);
    box-shadow: var(--shadow-sm);
  }
  .qa {
    margin-top: 16px;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 16px;
  }
  .group {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-4);
    margin: 10px 4px 0;
  }
  .row:first-child .group {
    margin-top: 0;
  }
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 48px 0;
    color: var(--ink-3);
    font-weight: 700;
    font-size: 15px;
    text-align: center;
  }
</style>
