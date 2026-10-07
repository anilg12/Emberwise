<script lang="ts">
  import type { Task } from '../lib/types';
  import { store, categoryName, categoryColor } from '../lib/state.svelte';
  import { t, fmtTime } from '../lib/i18n.svelte';
  import { TASK_XP } from '../lib/game';
  import { DIFF_COLOR, dayLabel, repeatLabel } from '../lib/format';
  import { toggleTask, toggleSubtask, deleteTask, focusOn } from '../lib/actions';
  import { collapse } from '../lib/motion';
  import Icon from './Icon.svelte';

  let { task, showDate = false, compact = false }: { task: Task; showDate?: boolean; compact?: boolean } = $props();

  let expanded = $state(false);
  let checkEl: HTMLButtonElement | undefined = $state();
  let justDone = $state(false);

  const done = $derived(store.isDoneToday(task));
  const category = $derived(store.data.categories.find((c) => c.id === task.categoryId));
  const overdue = $derived(task.repeat === 'none' && !task.done && !!task.date && task.date < store.today);
  const timePassed = $derived.by(() => {
    if (!task.time || done) return false;
    const day = task.repeat === 'none' ? (task.date ?? store.today) : store.today;
    if (day !== store.today) return day < store.today;
    const [h, m] = task.time.split(':').map(Number);
    const now = new Date(store.clock);
    return now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
  });
  const subs = $derived.by(() => {
    // repeating tasks get fresh subtasks every day
    if (task.repeat !== 'none' && task.subtasksDay !== store.today) return task.subtasks.map((s) => ({ ...s, done: false }));
    return task.subtasks;
  });
  const subsDone = $derived(subs.filter((s) => s.done).length);
  const color = $derived(DIFF_COLOR[task.difficulty]);

  function onCheck() {
    if (!done) {
      justDone = true;
      setTimeout(() => (justDone = false), 700);
    }
    toggleTask(task, checkEl);
  }

  function open() {
    store.openEditor(task.id);
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter') open();
    if (e.key === ' ') {
      e.preventDefault();
      onCheck();
    }
    if (e.key === 'Delete') deleteTask(task);
  }
</script>

<div class="task" class:done class:compact class:just-done={justDone} style="--d:{color}">
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <div class="row" role="group" tabindex="0" {onkeydown}>
    <button
      bind:this={checkEl}
      class="check"
      class:on={done}
      onclick={onCheck}
      aria-label={done ? t('common.undo') : t('tasks.completed', { task: task.title })}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="m5 12.5 4.5 4.5L19 7.5" />
      </svg>
    </button>

    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="body" onclick={open}>
      <div class="title-line">
        <span class="title">{task.title}</span>
      </div>
      {#if task.purpose && !compact}
        <p class="purpose"><Icon name="quill" size={13} /> <span>{task.purpose}</span></p>
      {/if}
      <div class="meta">
        {#if showDate && task.repeat === 'none' && task.date}
          <span class="chip" class:danger={overdue}><Icon name="calendar" size={13} />{dayLabel(task.date, store.today)}</span>
        {:else if overdue}
          <span class="chip danger"><Icon name="alert" size={13} />{t('tasks.overdue')} · {dayLabel(task.date!, store.today)}</span>
        {/if}
        {#if task.time}
          <span class="chip" class:accent={!timePassed} class:danger={timePassed && !done && overdue}>
            <Icon name="bell" size={13} />{task.time}
          </span>
        {/if}
        {#if task.repeat !== 'none'}
          <span class="chip"><Icon name="repeat" size={13} />{repeatLabel(task)}</span>
        {/if}
        {#if category}
          <span class="chip cat" style="--c:{categoryColor(category.color, store.dark)}"><i></i>{categoryName(category)}</span>
        {/if}
        {#if subs.length}
          <button class="chip steps" class:all={subsDone === subs.length} onclick={(e) => { e.stopPropagation(); expanded = !expanded; }}>
            <Icon name="list" size={13} />{t('tasks.steps', { done: subsDone, total: subs.length })}
            <span class="chev" class:open={expanded}><Icon name="down" size={12} /></span>
          </button>
        {/if}
        {#if task.focusMinutes > 0 && !compact}
          <span class="chip"><Icon name="flame" size={13} />{t('tasks.focusMinutes', { m: task.focusMinutes })}</span>
        {/if}
        {#if done && task.repeat === 'none' && task.doneAt}
          <span class="chip success"><Icon name="check" size={13} />{t('tasks.doneAt', { time: fmtTime(new Date(task.doneAt)) })}</span>
        {/if}
      </div>
    </div>

    <div class="side">
      <span class="xp" title={t(`difficulty.${task.difficulty}`)}>+{TASK_XP[task.difficulty]} XP</span>
      <div class="actions">
        {#if !done}
          <button class="icon-btn" title={t('tasks.focus')} aria-label={t('tasks.focus')} onclick={() => focusOn(task)}>
            <Icon name="flame" size={17} />
          </button>
        {/if}
        <button class="icon-btn" title={t('common.edit')} aria-label={t('common.edit')} onclick={open}>
          <Icon name="edit" size={17} />
        </button>
        <button class="icon-btn danger" title={t('common.delete')} aria-label={t('common.delete')} onclick={() => deleteTask(task)}>
          <Icon name="trash" size={17} />
        </button>
      </div>
    </div>
  </div>

  {#if expanded && subs.length}
    <ul class="subs" transition:collapse>
      {#each subs as s (s.id)}
        <li>
          <button class="sub" class:on={s.done} onclick={(e) => toggleSubtask(task, s.id, e.currentTarget)}>
            <span class="mini-check"><Icon name="check" size={11} stroke={3} /></span>
            <span class="sub-title">{s.title}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .task {
    position: relative;
    border-radius: 16px;
    background: var(--surface);
    border: 1px solid var(--line);
    box-shadow: var(--shadow-sm);
    transition:
      border-color 0.2s,
      box-shadow 0.2s,
      transform 0.25s var(--ease-out),
      background-color 0.3s;
  }
  .task:hover {
    border-color: var(--line-2);
    box-shadow: var(--shadow);
  }
  .task::before {
    content: '';
    position: absolute;
    left: -1px;
    top: 14px;
    bottom: 14px;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: var(--d);
    opacity: 0.85;
  }
  .task.done {
    background: var(--surface-2);
    box-shadow: none;
  }
  .task.done::before {
    opacity: 0.25;
  }
  .just-done {
    animation: celebrate 0.6s var(--ease-out);
  }
  @keyframes celebrate {
    0% {
      transform: scale(1);
    }
    35% {
      transform: scale(1.012);
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--success) 25%, transparent);
    }
    100% {
      transform: scale(1);
    }
  }
  .row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 13px 12px 13px 14px;
    border-radius: 16px;
  }
  .compact .row {
    padding: 10px 10px 10px 12px;
    align-items: center;
  }
  .check {
    flex: none;
    position: relative;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    margin-top: 1px;
    border-radius: 50%;
    border: 2px solid color-mix(in srgb, var(--d) 70%, var(--line-2));
    background: var(--surface);
    transition:
      background-color 0.25s,
      border-color 0.25s,
      transform 0.3s var(--ease-spring);
  }
  .compact .check {
    margin-top: 0;
  }
  .check:hover {
    background: color-mix(in srgb, var(--d) 12%, var(--surface));
    transform: scale(1.08);
  }
  .check:active {
    transform: scale(0.9);
  }
  .check svg {
    fill: none;
    stroke: #fff;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 22;
    stroke-dashoffset: 22;
    transition: stroke-dashoffset 0.35s var(--ease-out) 0.05s;
  }
  .check:hover:not(.on) svg {
    stroke: var(--d);
    stroke-dashoffset: 0;
    opacity: 0.45;
  }
  .check.on {
    background: var(--success);
    border-color: var(--success);
  }
  .check.on svg {
    stroke-dashoffset: 0;
  }
  .just-done .check {
    animation: check-pop 0.5s var(--ease-spring);
  }
  @keyframes check-pop {
    0% {
      transform: scale(0.7);
    }
    60% {
      transform: scale(1.18);
    }
    100% {
      transform: scale(1);
    }
  }
  .body {
    flex: 1;
    min-width: 0;
    cursor: pointer;
  }
  .title-line {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .title {
    font-weight: 750;
    font-size: 15px;
    line-height: 1.35;
    overflow-wrap: anywhere;
    position: relative;
    transition: color 0.3s;
  }
  .done .title {
    color: var(--ink-3);
    text-decoration: line-through;
    text-decoration-color: color-mix(in srgb, var(--ink-3) 60%, transparent);
    text-decoration-thickness: 1.5px;
  }
  .purpose {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
    color: var(--ink-3);
    font-family: var(--font-display);
    font-style: italic;
    font-size: 14px;
    font-weight: 450;
  }
  .purpose span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }
  .meta:empty {
    display: none;
  }
  .compact .meta {
    margin-top: 5px;
  }
  .chip.cat i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--c);
  }
  .steps {
    cursor: pointer;
  }
  .steps:hover {
    background: var(--line);
  }
  .steps.all {
    background: var(--success-soft);
    color: var(--success);
  }
  .chev {
    display: grid;
    transition: transform 0.25s var(--ease-out);
  }
  .chev.open {
    transform: rotate(180deg);
  }
  .side {
    position: relative;
    display: flex;
    align-items: center;
    flex: none;
    min-height: 28px;
    margin-top: -2px;
  }
  .compact .side {
    margin-top: 0;
  }
  .xp {
    font-size: 12px;
    font-weight: 800;
    color: var(--d);
    background: color-mix(in srgb, var(--d) 12%, transparent);
    padding: 3px 8px;
    border-radius: 99px;
    white-space: nowrap;
  }
  .done .xp {
    opacity: 0.5;
  }
  .actions {
    position: absolute;
    right: -4px;
    top: 50%;
    display: flex;
    gap: 2px;
    padding: 2px 2px 2px 10px;
    border-radius: 12px;
    background: var(--surface);
    box-shadow: -12px 0 12px -4px var(--surface);
    opacity: 0;
    transform: translate(6px, -50%);
    pointer-events: none;
    transition:
      opacity 0.18s,
      transform 0.22s var(--ease-out);
  }
  .task:hover .actions,
  .row:focus-within .actions {
    opacity: 1;
    transform: translate(0, -50%);
    pointer-events: auto;
  }
  .done .actions {
    background: var(--surface-2);
    box-shadow: -12px 0 12px -4px var(--surface-2);
  }
  .subs {
    list-style: none;
    margin: 0;
    padding: 0 14px 12px 50px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .sub {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 6px 8px;
    border-radius: 9px;
    text-align: left;
    font-weight: 600;
    color: var(--ink-2);
  }
  .sub:hover {
    background: var(--hover);
  }
  .mini-check {
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border-radius: 6px;
    border: 2px solid var(--line-2);
    color: transparent;
    transition: all 0.2s var(--ease-out);
  }
  .sub.on .mini-check {
    background: var(--success);
    border-color: var(--success);
    color: #fff;
  }
  .sub.on .sub-title {
    color: var(--ink-3);
    text-decoration: line-through;
  }
</style>
