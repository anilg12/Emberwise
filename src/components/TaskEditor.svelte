<script lang="ts">
  import { untrack } from 'svelte';
  import { store, categoryName, categoryColor, nextCategoryColor } from '../lib/state.svelte';
  import { t, tv } from '../lib/i18n.svelte';
  import { addDays, minutesToTime, nowMinutes, timeToMinutes, weekday } from '../lib/dates';
  import { DIFFICULTIES, TASK_GOLD, TASK_XP, uid } from '../lib/game';
  import { DIFF_COLOR, dayLabel } from '../lib/format';
  import { deleteTask } from '../lib/actions';
  import { sfx } from '../lib/sound';
  import { modKey } from '../lib/platform';
  import { collapse } from '../lib/motion';
  import type { Difficulty, Repeat, Subtask } from '../lib/types';
  import Modal from './Modal.svelte';
  import Icon from './Icon.svelte';
  import Segmented from './Segmented.svelte';
  import Switch from './Switch.svelte';
  import TimeField from './TimeField.svelte';
  import MiniCalendar from './MiniCalendar.svelte';

  // Form state is (re)initialised every time the editor opens.
  let title = $state('');
  let purpose = $state('');
  let difficulty = $state<Difficulty>('normal');
  let categoryId = $state<string | null>(null);
  let date = $state<string | null>(null);
  let time = $state('09:00');
  let remind = $state(false);
  let repeat = $state<Repeat>('none');
  let repeatDays = $state<number[]>([]);
  let subtasks = $state<Subtask[]>([]);
  let newSub = $state('');
  let showCal = $state(false);
  let addingCat = $state(false);
  let newCatName = $state('');
  let error = $state('');
  let shake = $state(false);
  let titleEl: HTMLInputElement | undefined = $state();

  const editing = $derived(store.editor.taskId ? store.task(store.editor.taskId) : undefined);

  function nextHour(): string {
    return minutesToTime(Math.min(23 * 60, (Math.floor(nowMinutes() / 60) + 1) * 60));
  }

  // Only re-initialise when the editor opens (or targets another task) — never while typing.
  $effect(() => {
    const open = store.editor.open;
    store.editor.taskId;
    store.editor.preset;
    if (!open) return;
    untrack(init);
  });

  function init() {
    const src = editing ?? store.editor.preset ?? {};
    title = src.title ?? '';
    purpose = src.purpose ?? '';
    difficulty = src.difficulty ?? 'normal';
    categoryId = src.categoryId ?? null;
    repeat = src.repeat ?? 'none';
    repeatDays = [...(src.repeatDays ?? [])];
    date = editing ? (src.date ?? null) : src.date !== undefined ? src.date : store.today;
    remind = !!src.time;
    time = src.time ?? nextHour();
    subtasks = (src.subtasks ?? []).map((s) => ({ ...s }));
    newSub = '';
    showCal = false;
    addingCat = false;
    newCatName = '';
    error = '';
  }

  const isNew = $derived(!editing);
  const reminderPast = $derived(
    remind && repeat === 'none' && date === store.today && timeToMinutes(time) <= nowMinutes(new Date(store.clock)),
  );
  const weekdayNames = $derived(tv<string[]>('calendar.weekdaysMid'));
  const dateMode = $derived(
    date === null ? 'none' : date === store.today ? 'today' : date === addDays(store.today, 1) ? 'tomorrow' : 'pick',
  );

  function close() {
    store.closeEditor();
  }

  function fail(msg: string) {
    error = msg;
    shake = false;
    requestAnimationFrame(() => (shake = true));
    setTimeout(() => (shake = false), 450);
    sfx.error();
    titleEl?.focus();
  }

  function save() {
    const name = title.trim();
    if (!name) {
      fail(t('editor.nameRequired'));
      return;
    }
    if (newSub.trim()) addSub();
    let finalDate = date;
    if (repeat === 'none' && remind && !finalDate) {
      finalDate = timeToMinutes(time) > nowMinutes() ? store.today : addDays(store.today, 1);
    }
    if (repeat !== 'none' && !finalDate) finalDate = store.today;
    const payload = {
      title: name,
      purpose: purpose.trim(),
      difficulty,
      categoryId,
      date: finalDate,
      time: remind ? time : null,
      repeat,
      repeatDays: repeat === 'custom' ? [...repeatDays] : [],
      subtasks: subtasks.filter((s) => s.title.trim()).map((s) => ({ ...s, title: s.title.trim() })),
    };
    if (editing) store.updateTask(editing.id, payload);
    else {
      store.createTask(payload);
      sfx.pop();
    }
    close();
  }

  function addSub() {
    const v = newSub.trim();
    if (!v) return;
    subtasks = [...subtasks, { id: uid(), title: v.slice(0, 200), done: false }];
    newSub = '';
  }

  function removeSub(id: string) {
    subtasks = subtasks.filter((s) => s.id !== id);
  }

  function setDateMode(mode: string) {
    if (mode === 'none') {
      date = null;
      showCal = false;
    } else if (mode === 'today') {
      date = store.today;
      showCal = false;
    } else if (mode === 'tomorrow') {
      date = addDays(store.today, 1);
      showCal = false;
    } else {
      showCal = !showCal;
    }
  }

  function setRepeat(r: Repeat) {
    repeat = r;
    if (r !== 'none' && !date) date = store.today;
    if (r === 'custom' && repeatDays.length === 0) repeatDays = [weekday(store.today)];
  }

  function toggleDay(d: number) {
    repeatDays = repeatDays.includes(d) ? repeatDays.filter((x) => x !== d) : [...repeatDays, d];
    if (repeatDays.length === 0) repeatDays = [d];
  }

  function addCategory() {
    const name = newCatName.trim();
    if (!name) {
      addingCat = false;
      return;
    }
    const color = nextCategoryColor(store.data.categories.map((c) => c.color));
    const id = `cat_${uid()}`;
    store.data.categories.push({ id, name: name.slice(0, 40), color });
    store.persist();
    categoryId = id;
    newCatName = '';
    addingCat = false;
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      save();
    }
  }

  function remove() {
    if (!editing) return;
    const task = editing;
    close();
    deleteTask(task);
  }
</script>

<Modal open={store.editor.open} onclose={close} width={620} label={isNew ? t('editor.newTitle') : t('editor.editTitle')}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="editor" {onkeydown}>
    <header>
      <h2>{isNew ? t('editor.newTitle') : t('editor.editTitle')}</h2>
      <button class="icon-btn" onclick={close} aria-label={t('common.close')}><Icon name="x" size={18} /></button>
    </header>

    <div class="content">
      <div class="field">
        <!-- svelte-ignore a11y_autofocus -->
        <input
          bind:this={titleEl}
          class="input title-input"
          class:shake
          class:invalid={!!error}
          bind:value={title}
          placeholder={t('editor.namePh')}
          maxlength="200"
          autofocus
          oninput={() => (error = '')}
          onkeydown={(e) => {
            if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
              e.preventDefault();
              save();
            }
          }}
        />
        {#if error}<p class="error">{error}</p>{/if}
      </div>

      <div class="field purpose">
        <span class="prefix"><Icon name="quill" size={16} /></span>
        <input class="input" bind:value={purpose} placeholder={t('editor.purposePh')} maxlength="300" />
      </div>

      <div class="field">
        <span class="label">{t('difficulty.label')}</span>
        <div class="diffs">
          {#each DIFFICULTIES as dkey}
            <button class="diff" class:on={difficulty === dkey} style="--d:{DIFF_COLOR[dkey]}" onclick={() => (difficulty = dkey)}>
              <strong>{t(`difficulty.${dkey}`)}</strong>
              <span>+{TASK_XP[dkey]} XP</span>
            </button>
          {/each}
        </div>
      </div>

      <div class="field">
        <span class="label">{t('editor.category')}</span>
        <div class="cats">
          <button class="cat" class:on={categoryId === null} onclick={() => (categoryId = null)}>{t('editor.noCategory')}</button>
          {#each store.data.categories as c (c.id)}
            <button class="cat" class:on={categoryId === c.id} style="--c:{categoryColor(c.color, store.dark)}" onclick={() => (categoryId = c.id)}>
              <i></i>{categoryName(c)}
            </button>
          {/each}
          {#if addingCat}
            <!-- svelte-ignore a11y_autofocus -->
            <input
              class="input cat-input"
              bind:value={newCatName}
              placeholder={t('editor.categoryPh')}
              maxlength="40"
              autofocus
              onkeydown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  addCategory();
                }
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  addingCat = false;
                }
              }}
              onblur={addCategory}
            />
          {:else}
            <button class="cat add" onclick={() => (addingCat = true)}><Icon name="plus" size={14} />{t('editor.newCategory')}</button>
          {/if}
        </div>
      </div>

      <div class="grid2">
        <div class="field">
          <span class="label">{repeat === 'none' ? t('editor.when') : t('editor.startsOn')}</span>
          <div class="cats">
            {#if repeat === 'none'}
              <button class="cat" class:on={dateMode === 'none'} onclick={() => setDateMode('none')}>{t('editor.noDate')}</button>
            {/if}
            <button class="cat" class:on={dateMode === 'today'} onclick={() => setDateMode('today')}>{t('common.today')}</button>
            <button class="cat" class:on={dateMode === 'tomorrow'} onclick={() => setDateMode('tomorrow')}>{t('common.tomorrow')}</button>
            <button class="cat" class:on={dateMode === 'pick' || showCal} onclick={() => setDateMode('pick')}>
              <Icon name="calendar" size={14} />
              {dateMode === 'pick' && date ? dayLabel(date, store.today) : t('editor.pickDate')}
            </button>
          </div>
          {#if showCal}
            <div class="cal-wrap" transition:collapse>
              <MiniCalendar
                value={date}
                today={store.today}
                onselect={(k) => {
                  date = k;
                  showCal = false;
                }}
              />
            </div>
          {/if}
        </div>

        <div class="field">
          <span class="label">{t('editor.repeat')}</span>
          <div class="cats">
            {#each ['none', 'daily', 'weekdays', 'custom'] as const as r}
              <button class="cat" class:on={repeat === r} onclick={() => setRepeat(r)}>
                {#if r !== 'none'}<Icon name="repeat" size={13} />{/if}{t(`repeat.${r}`)}
              </button>
            {/each}
          </div>
          {#if repeat === 'custom'}
            <div class="days" transition:collapse>
              {#each [1, 2, 3, 4, 5, 6, 0] as wd}
                <button class="day" class:on={repeatDays.includes(wd)} onclick={() => toggleDay(wd)}>{weekdayNames[wd]}</button>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <div class="field reminder" class:on={remind}>
        <div class="rem-head">
          <span class="rem-icon"><Icon name="bell" size={18} /></span>
          <div class="rem-text">
            <strong>{t('editor.reminder')}</strong>
            <span>{remind ? t('editor.reminderHint') : t('editor.reminderOff')}</span>
          </div>
          <Switch checked={remind} onchange={(v) => (remind = v)} label={t('editor.reminder')} />
        </div>
        {#if remind}
          <div class="rem-body" transition:collapse>
            <TimeField value={time} onchange={(v) => (time = v)} />
            {#if reminderPast}
              <p class="warn"><Icon name="alert" size={14} /> {t('editor.pastWarn')}</p>
            {/if}
          </div>
        {/if}
      </div>

      <div class="field">
        <span class="label">{t('editor.subtasks')}</span>
        {#if subtasks.length}
          <ul class="subs">
            {#each subtasks as s (s.id)}
              <li transition:collapse>
                <span class="bullet"></span>
                <input class="sub-input" bind:value={s.title} maxlength="200" />
                <button class="icon-btn danger" onclick={() => removeSub(s.id)} aria-label={t('common.delete')}><Icon name="x" size={14} /></button>
              </li>
            {/each}
          </ul>
        {/if}
        <div class="add-sub">
          <Icon name="plus" size={16} />
          <input
            bind:value={newSub}
            placeholder={t('editor.addSubtask')}
            maxlength="200"
            onkeydown={(e) => {
              if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                addSub();
              }
            }}
          />
        </div>
      </div>
    </div>

    <footer>
      {#if editing}
        <button class="btn ghost danger-text" onclick={remove}><Icon name="trash" size={16} />{t('editor.delete')}</button>
      {:else}
        <span class="reward" style="--d:{DIFF_COLOR[difficulty]}">
          <Icon name="spark" size={15} />
          {t('editor.reward')}: <b>+{TASK_XP[difficulty]} XP</b> · <b class="g">+{TASK_GOLD[difficulty]}</b> {t('common.gold')}
        </span>
      {/if}
      <div class="right">
        <span class="hint"><span class="kbd">{modKey}</span>+<span class="kbd">↵</span></span>
        <button class="btn ghost" onclick={close}>{t('common.cancel')}</button>
        <button class="btn primary" onclick={save}>{isNew ? t('editor.create') : t('editor.save')}</button>
      </div>
    </footer>
  </div>
</Modal>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }
  header {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 18px 6px 24px;
  }
  header h2 {
    font-size: 22px;
  }
  .content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 10px 24px 14px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .field {
    position: relative;
  }
  .title-input {
    height: 48px;
    font-size: 17px;
    font-weight: 700;
    border-radius: 14px;
  }
  .title-input.invalid {
    border-color: var(--danger);
    box-shadow: 0 0 0 3px var(--danger-soft);
  }
  .shake {
    animation: shake 0.42s var(--ease-out);
  }
  @keyframes shake {
    20% {
      transform: translateX(-6px);
    }
    40% {
      transform: translateX(6px);
    }
    60% {
      transform: translateX(-4px);
    }
    80% {
      transform: translateX(3px);
    }
  }
  .error {
    color: var(--danger);
    font-size: 12.5px;
    font-weight: 700;
    margin-top: 6px;
  }
  .purpose {
    display: flex;
    align-items: center;
  }
  .purpose .prefix {
    position: absolute;
    left: 14px;
    color: var(--ink-4);
    pointer-events: none;
  }
  .purpose .input {
    padding-left: 40px;
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 450;
    font-size: 15px;
  }
  .diffs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .diff {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1px;
    padding: 9px 12px;
    border-radius: 12px;
    border: 1.5px solid var(--line);
    background: var(--surface-2);
    text-align: left;
    transition: all 0.2s var(--ease-out);
  }
  .diff strong {
    font-weight: 800;
    font-size: 13.5px;
  }
  .diff span {
    font-size: 12px;
    font-weight: 800;
    color: var(--d);
  }
  .diff:hover {
    border-color: color-mix(in srgb, var(--d) 50%, var(--line));
  }
  .diff.on {
    border-color: var(--d);
    background: color-mix(in srgb, var(--d) 10%, var(--surface));
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--d) 15%, transparent);
  }
  .cats {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .cat {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 12px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--surface-2);
    font-weight: 700;
    font-size: 13px;
    color: var(--ink-2);
    transition: all 0.18s var(--ease-out);
  }
  .cat i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--c);
  }
  .cat:hover {
    border-color: var(--line-2);
    color: var(--ink);
  }
  .cat.on {
    background: var(--accent-soft);
    border-color: color-mix(in srgb, var(--accent) 45%, transparent);
    color: var(--accent-text);
  }
  .cat.add {
    border-style: dashed;
    color: var(--ink-3);
  }
  .cat-input {
    width: 160px;
    height: 32px;
    border-radius: 10px;
    font-size: 13px;
  }
  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }
  .cal-wrap {
    margin-top: 8px;
  }
  .days {
    display: flex;
    gap: 4px;
    margin-top: 8px;
  }
  .day {
    flex: 1;
    height: 30px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 800;
    color: var(--ink-3);
    background: var(--surface-2);
    border: 1px solid var(--line);
    transition: all 0.16s;
  }
  .day.on {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-ink);
  }
  .reminder {
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px solid var(--line);
    background: var(--surface-2);
    transition: border-color 0.2s, background-color 0.2s;
  }
  .reminder.on {
    border-color: color-mix(in srgb, var(--accent) 35%, var(--line));
    background: var(--accent-softer);
  }
  .rem-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .rem-icon {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 11px;
    background: var(--surface);
    color: var(--ink-3);
    border: 1px solid var(--line);
  }
  .on .rem-icon {
    color: var(--accent);
    border-color: transparent;
    background: var(--accent-soft);
  }
  .rem-text {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .rem-text strong {
    font-weight: 800;
    font-size: 14px;
  }
  .rem-text span {
    font-size: 12.5px;
    color: var(--ink-3);
  }
  .rem-body {
    display: flex;
    align-items: center;
    gap: 14px;
    padding-top: 12px;
  }
  .warn {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--danger);
    font-size: 12.5px;
    font-weight: 700;
  }
  .subs {
    list-style: none;
    margin: 0 0 6px;
    padding: 0;
  }
  .subs li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 2px 0 2px 4px;
  }
  .bullet {
    width: 14px;
    height: 14px;
    border-radius: 5px;
    border: 2px solid var(--line-2);
    flex: none;
  }
  .sub-input {
    flex: 1;
    height: 32px;
    border: none;
    background: transparent;
    font-weight: 600;
    border-radius: 8px;
    padding: 0 8px;
  }
  .sub-input:hover,
  .sub-input:focus {
    background: var(--surface-2);
  }
  .add-sub {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 40px;
    padding: 0 12px;
    border-radius: 12px;
    border: 1px dashed var(--line-2);
    color: var(--ink-4);
    transition: border-color 0.16s;
  }
  .add-sub:focus-within {
    border-color: var(--accent);
    border-style: solid;
    color: var(--accent);
  }
  .add-sub input {
    flex: 1;
    border: none;
    background: transparent;
    height: 100%;
    font-weight: 600;
    color: var(--ink);
  }
  .add-sub input::placeholder {
    color: var(--ink-4);
  }
  footer {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 20px 16px 24px;
    border-top: 1px solid var(--line);
  }
  .right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hint {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: var(--ink-4);
    font-size: 12px;
    margin-right: 4px;
  }
  .hint .kbd {
    height: 22px;
    min-width: 22px;
    font-size: 11px;
  }
  .reward {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: var(--ink-3);
  }
  .reward b {
    color: var(--d);
    font-weight: 800;
  }
  .reward b.g {
    color: var(--gold);
  }
  .danger-text {
    color: var(--danger);
  }
  .danger-text:hover {
    background: var(--danger-soft) !important;
    color: var(--danger) !important;
  }
</style>
