<script lang="ts">
  import { store, categoryName, categoryColor } from '../lib/state.svelte';
  import { t, fmtDate, fmtNumber, fmtDuration, fmtTime, tv, itemName } from '../lib/i18n.svelte';
  import { addDays, dayKeyOfIso, parseDayKey, weekday } from '../lib/dates';
  import { rise } from '../lib/motion';
  import type { LogEntry } from '../lib/types';
  import Icon from '../components/Icon.svelte';
  import Segmented from '../components/Segmented.svelte';
  import MoodFace from '../components/MoodFace.svelte';

  let range = $state<7 | 30>(7);
  let showTable = $state(false);
  let chartW = $state(600);
  let hoverBar = $state<number | null>(null);
  let hoverCell = $state<{ key: string; x: number; y: number } | null>(null);

  const today = $derived(store.today);

  /* ---------- totals ---------- */
  const totals = $derived.by(() => {
    let focus = 0;
    let completedSessions = 0;
    for (const s of store.data.sessions) {
      focus += s.minutes;
      if (s.completed) completedSessions++;
    }
    const tasks = store.data.log.filter((e) => e.kind === 'task').length;
    const avg = store.data.sessions.length ? Math.round(focus / store.data.sessions.length) : 0;
    return { focus, tasks, avg, sessions: completedSessions };
  });

  /* ---------- per-day aggregates ---------- */
  const perDay = $derived.by(() => {
    const map = new Map<string, { focus: number; sessions: number; xp: number; tasks: number }>();
    const get = (k: string) => {
      let v = map.get(k);
      if (!v) map.set(k, (v = { focus: 0, sessions: 0, xp: 0, tasks: 0 }));
      return v;
    };
    for (const s of store.data.sessions) {
      const v = get(dayKeyOfIso(s.end));
      v.focus += s.minutes;
      if (s.completed) v.sessions++;
    }
    for (const e of store.data.log) {
      if (e.xp <= 0) continue;
      const v = get(dayKeyOfIso(e.t));
      v.xp += e.xp;
      if (e.kind === 'task') v.tasks++;
    }
    return map;
  });

  /* ---------- focus chart ---------- */
  const days = $derived(Array.from({ length: range }, (_, i) => addDays(today, i - range + 1)));
  const series = $derived(days.map((k) => ({ key: k, min: perDay.get(k)?.focus ?? 0, sessions: perDay.get(k)?.sessions ?? 0 })));
  const maxMin = $derived(Math.max(0, ...series.map((s) => s.min)));
  const yMax = $derived.by(() => {
    const steps = [30, 60, 90, 120, 180, 240, 300, 360, 480, 600, 720, 900, 1200];
    return steps.find((s) => s >= maxMin) ?? Math.ceil(maxMin / 300) * 300;
  });
  const ticks = $derived([0, yMax / 3, (yMax * 2) / 3, yMax].map(Math.round));
  const PAD_L = 40;
  const PAD_R = 8;
  const PAD_T = 22;
  const PLOT_H = 170;
  const AXIS_H = 26;
  const plotW = $derived(Math.max(100, chartW - PAD_L - PAD_R));
  const band = $derived(plotW / range);
  const barW = $derived(Math.min(24, band * 0.62));
  const maxIndex = $derived(series.findIndex((s) => s.min === maxMin && maxMin > 0));
  const weekdayNames = $derived(tv<string[]>('calendar.weekdaysMid'));
  const y = (v: number) => PAD_T + PLOT_H - (v / yMax) * PLOT_H;

  function barPath(i: number, v: number): string {
    const x = PAD_L + band * i + (band - barW) / 2;
    const top = y(v);
    const bottom = PAD_T + PLOT_H;
    const h = bottom - top;
    if (h <= 0) return '';
    const r = Math.min(4, h, barW / 2);
    return `M${x} ${bottom}V${top + r}Q${x} ${top} ${x + r} ${top}H${x + barW - r}Q${x + barW} ${top} ${x + barW} ${top + r}V${bottom}Z`;
  }

  function xLabel(k: string, i: number): string {
    if (range === 7) return weekdayNames[weekday(k)];
    const d = parseDayKey(k).getDate();
    return i % 5 === 0 || i === range - 1 ? String(d) : '';
  }

  /* ---------- heatmap ---------- */
  const CELL = 15;
  const GAP = 4;
  const STEP = CELL + GAP;
  const LABEL_W = 34;
  let heatW = $state(900);
  const weeks = $derived(Math.max(12, Math.min(53, Math.floor((heatW - LABEL_W) / STEP))));
  const heat = $derived.by(() => {
    // Columns are weeks (Monday first), ending with the current week.
    const offset = (weekday(today) + 6) % 7;
    const start = addDays(today, -offset - (weeks - 1) * 7);
    const cols: { key: string; xp: number; future: boolean }[][] = [];
    let max = 0;
    for (let w = 0; w < weeks; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const key = addDays(start, w * 7 + d);
        const xp = perDay.get(key)?.xp ?? 0;
        if (xp > max) max = xp;
        col.push({ key, xp, future: key > today });
      }
      cols.push(col);
    }
    return { cols, max };
  });
  const level = (xp: number) => (xp <= 0 ? 0 : Math.min(4, Math.ceil((xp / Math.max(1, heat.max)) * 4)));
  const monthLabels = $derived(
    heat.cols.map((col, i) => {
      const first = parseDayKey(col[0].key);
      const prev = i > 0 ? parseDayKey(heat.cols[i - 1][0].key) : null;
      return !prev || prev.getMonth() !== first.getMonth() ? fmtDate(first, { month: 'short' }) : '';
    }),
  );

  /* ---------- categories ---------- */
  const byCategory = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const e of store.data.log) {
      if (e.kind !== 'task') continue;
      const k = e.meta?.c ?? '__none';
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const rows = [...counts.entries()]
      .map(([id, n]) => {
        const c = store.data.categories.find((x) => x.id === id);
        return {
          id,
          n,
          name: c ? categoryName(c) : t('editor.noCategory'),
          color: c ? categoryColor(c.color, store.dark) : 'var(--ink-4)',
        };
      })
      .sort((a, b) => b.n - a.n);
    return { rows, max: Math.max(1, ...rows.map((r) => r.n)) };
  });

  /* ---------- log ---------- */
  const LOG_ICON: Record<LogEntry['kind'], string> = {
    task: 'check',
    subtask: 'list',
    focus: 'flame',
    quest: 'scroll',
    chest: 'chest',
    achievement: 'trophy',
    streak: 'spark',
    purchase: 'bag',
    login: 'gift',
    journal: 'heart',
  };

  /* ---------- mood ---------- */
  const moodDays = $derived.by(() => {
    const out: { key: string; mood: number; note: string }[] = [];
    for (let i = 29; i >= 0; i--) {
      const key = addDays(today, -i);
      const e = store.data.journal[key];
      out.push({ key, mood: e?.mood ?? 0, note: e?.note ?? '' });
    }
    return out;
  });
  const moodLabels = $derived(tv<string[]>('today.moods'));
  const hasMood = $derived(moodDays.some((m) => m.mood));
  const recent = $derived(store.data.log.slice(-40).reverse());

  function logLabel(e: LogEntry): string {
    if (e.kind === 'quest') return t(`quests.items.${e.label}`);
    if (e.kind === 'achievement') return t(`awards.items.${e.label}.0`);
    if (e.kind === 'login') {
      if (e.label === 'gift') return t('rewards.giftTitle');
      if (e.label === 'week') return t('rewards.weekTitle');
      if (e.label === 'month') return t('rewards.monthTitle');
      if (e.label && e.label !== 'path') return itemName(e.label);
      return t('rewards.pathTitle');
    }
    if (e.kind === 'journal') return t('stats.kinds.journal');
    return e.label || t(`stats.kinds.${e.kind}`);
  }

  function when(iso: string): string {
    const d = new Date(iso);
    const k = dayKeyOfIso(iso);
    if (k === today) return `${t('common.today')} ${fmtTime(d)}`;
    if (k === addDays(today, -1)) return `${t('common.yesterday')} ${fmtTime(d)}`;
    return `${fmtDate(d, { day: 'numeric', month: 'short' })} ${fmtTime(d)}`;
  }

  const hovered = $derived(hoverBar !== null ? series[hoverBar] : null);
  const hoveredCell = $derived(hoverCell ? { ...hoverCell, data: perDay.get(hoverCell.key) } : null);
</script>

<div class="page">
  <header class="page-head" in:rise>
    <div>
      <h1>{t('stats.title')}</h1>
      <p>{t('stats.subtitle')}</p>
    </div>
  </header>

  <div class="tiles" in:rise={{ delay: 30 }}>
    <div class="card tile">
      <span class="t-label"><Icon name="flame" size={15} />{t('stats.totalFocus')}</span>
      <b>{fmtDuration(totals.focus)}</b>
      <span class="t-sub">{t('stats.avgSession')}: {fmtDuration(totals.avg)} · {t('stats.sessions', { n: totals.sessions })}</span>
    </div>
    <div class="card tile">
      <span class="t-label"><Icon name="check" size={15} />{t('stats.tasksDone')}</span>
      <b>{fmtNumber(totals.tasks)}</b>
      <span class="t-sub">{t('today.tasksLeft', { n: store.todayTasks.open.length })}</span>
    </div>
    <div class="card tile">
      <span class="t-label"><Icon name="spark" size={15} />{t('stats.streak')}</span>
      <b>{t('common.days', { n: store.streakNow })}</b>
      <span class="t-sub">{t('stats.best', { n: store.data.streak.best })} · {t('streak.shields', { n: store.data.shields })}</span>
    </div>
    <div class="card tile">
      <span class="t-label"><Icon name="star" size={15} />{t('stats.totalXp')}</span>
      <b>{fmtNumber(store.totalXp)}</b>
      <span class="t-sub">{t('common.level')} {store.lvl.level} · {t(`ranks.${store.rank.id}`)}</span>
    </div>
  </div>

  <div class="grid">
    <section class="card chart-card" in:rise={{ delay: 60 }}>
      <div class="section-title">
        <h2>{t('stats.focusChart')}</h2>
        <div class="controls">
          <Segmented
            size="sm"
            options={[
              { value: 7, label: t('stats.range7') },
              { value: 30, label: t('stats.range30') },
            ]}
            value={range}
            onchange={(v) => (range = v as 7 | 30)}
          />
          <button class="icon-btn" class:on={showTable} onclick={() => (showTable = !showTable)} title={showTable ? t('stats.chart') : t('stats.table')} aria-label={showTable ? t('stats.chart') : t('stats.table')}>
            <Icon name={showTable ? 'chart' : 'list'} size={17} />
          </button>
        </div>
      </div>

      {#if showTable}
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>{t('stats.date')}</th><th>{t('stats.minutesCol')}</th><th>{t('stats.sessionsCol')}</th></tr>
            </thead>
            <tbody>
              {#each [...series].reverse() as s (s.key)}
                <tr>
                  <td>{fmtDate(parseDayKey(s.key), { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                  <td class="num">{s.min}</td>
                  <td class="num">{s.sessions}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="chart" bind:clientWidth={chartW}>
          <svg width={chartW} height={PAD_T + PLOT_H + AXIS_H} role="img" aria-label={t('stats.focusChart')}>
            {#each ticks as tk}
              <line class="grid-line" x1={PAD_L} x2={chartW - PAD_R} y1={y(tk)} y2={y(tk)} />
              <text class="axis" x={PAD_L - 8} y={y(tk) + 4} text-anchor="end">{tk}</text>
            {/each}
            {#each series as s, i (s.key)}
              <g
                class="col"
                class:dim={hoverBar !== null && hoverBar !== i}
                role="button"
                tabindex="0"
                aria-label="{fmtDate(parseDayKey(s.key), { day: 'numeric', month: 'long' })}: {s.min} {t('common.min')}"
                onmouseenter={() => (hoverBar = i)}
                onmouseleave={() => (hoverBar = null)}
                onfocus={() => (hoverBar = i)}
                onblur={() => (hoverBar = null)}
              >
                <rect class="hit" x={PAD_L + band * i} y={PAD_T} width={band} height={PLOT_H} />
                {#if s.min > 0}
                  <path class="bar" class:today={s.key === today} d={barPath(i, s.min)} />
                {/if}
                {#if i === maxIndex}
                  <text class="val" x={PAD_L + band * i + band / 2} y={y(s.min) - 7} text-anchor="middle">{s.min}</text>
                {/if}
                <text class="axis x" class:cur={s.key === today} x={PAD_L + band * i + band / 2} y={PAD_T + PLOT_H + 18} text-anchor="middle">{xLabel(s.key, i)}</text>
              </g>
            {/each}
            <line class="base" x1={PAD_L} x2={chartW - PAD_R} y1={PAD_T + PLOT_H} y2={PAD_T + PLOT_H} />
          </svg>
          {#if hovered && hoverBar !== null}
            <div class="tip" style="left:{Math.min(chartW - 90, Math.max(90, PAD_L + band * hoverBar + band / 2))}px;top:{Math.max(4, y(hovered.min) - 64)}px">
              <strong>{fmtDate(parseDayKey(hovered.key), { weekday: 'long', day: 'numeric', month: 'short' })}</strong>
              <span>{fmtDuration(hovered.min)} · {t('stats.sessions', { n: hovered.sessions })}</span>
            </div>
          {/if}
          {#if maxMin === 0}
            <p class="no-data">{t('stats.noFocus')}</p>
          {/if}
        </div>
      {/if}
    </section>

    <section class="card cat-card" in:rise={{ delay: 90 }}>
      <div class="section-title"><h2>{t('stats.byCategory')}</h2></div>
      {#if byCategory.rows.length === 0}
        <p class="muted empty-line">{t('stats.noCategoryData')}</p>
      {:else}
        <ul class="hbars">
          {#each byCategory.rows as r (r.id)}
            <li>
              <span class="h-name"><i style="background:{r.color}"></i>{r.name}</span>
              <div class="h-track">
                <span class="h-bar" style="width:{(r.n / byCategory.max) * 100}%;background:{r.color}"></span>
                <b class="num">{r.n}</b>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section class="card heat-card" in:rise={{ delay: 120 }}>
      <div class="section-title">
        <h2>{t('stats.heatmap')}</h2>
        <span class="muted hint">{t('stats.heatmapHint', { n: weeks })}</span>
      </div>
      <div class="heat-wrap" bind:clientWidth={heatW}>
        <div class="heat" style="--cell:{CELL}px;--gap:{GAP}px;--label:{LABEL_W}px">
          <div class="months">
            {#each monthLabels as m}<span>{m}</span>{/each}
          </div>
          <div class="days-col" aria-hidden="true">
            {#each [1, 2, 3, 4, 5, 6, 0] as wd, i}<span>{i % 2 === 0 ? weekdayNames[wd] : ''}</span>{/each}
          </div>
          <div class="cols">
            {#each heat.cols as col, ci}
              <div class="hcol">
                {#each col as cell, di (cell.key)}
                  <span
                    class="cell l{level(cell.xp)}"
                    class:future={cell.future}
                    class:is-today={cell.key === today}
                    role="img"
                    aria-label="{cell.key}: {cell.xp} XP"
                    onmouseenter={() => (hoverCell = { key: cell.key, x: ci, y: di })}
                    onmouseleave={() => (hoverCell = null)}
                  ></span>
                {/each}
              </div>
            {/each}
          </div>
          {#if hoveredCell}
            <div
              class="tip heat-tip"
              style="left:{Math.min(heatW - 80, Math.max(80, LABEL_W + hoveredCell.x * STEP + CELL / 2))}px;top:{18 + hoveredCell.y * STEP - 52}px"
            >
              <strong>{fmtDate(parseDayKey(hoveredCell.key), { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
              <span>{t('stats.xpDay', { n: hoveredCell.data?.xp ?? 0 })} · {fmtDuration(hoveredCell.data?.focus ?? 0)}</span>
            </div>
          {/if}
        </div>
        <div class="legend">
          <span>{t('stats.less')}</span>
          {#each [0, 1, 2, 3, 4] as l}<span class="cell l{l}"></span>{/each}
          <span>{t('stats.more')}</span>
        </div>
      </div>
    </section>

    <section class="card mood-card" in:rise={{ delay: 135 }}>
      <div class="section-title">
        <h2>{t('stats.mood')}</h2>
        <span class="hint">{t('stats.moodHint')}</span>
      </div>
      {#if !hasMood}
        <p class="muted empty-line">{t('stats.moodEmpty')}</p>
      {/if}
      <div class="moods">
        {#each moodDays as m (m.key)}
          <div class="m-day" title="{fmtDate(parseDayKey(m.key), { day: 'numeric', month: 'long' })}{m.mood ? ` · ${moodLabels[m.mood - 1]}` : ''}{m.note ? ` · ${m.note}` : ''}">
            {#if m.mood}
              <MoodFace mood={m.mood} size={24} />
            {:else}
              <span class="m-empty"></span>
            {/if}
            <span class="m-n" class:today={m.key === today}>{Number(m.key.slice(8))}</span>
          </div>
        {/each}
      </div>
    </section>

    <section class="card log-card" in:rise={{ delay: 150 }}>
      <div class="section-title"><h2>{t('stats.log')}</h2></div>
      {#if recent.length === 0}
        <p class="muted empty-line">{t('stats.logEmpty')}</p>
      {:else}
        <ul class="log">
          {#each recent as e (e.id)}
            <li>
              <span class="l-icon k-{e.kind}"><Icon name={LOG_ICON[e.kind]} size={15} /></span>
              <div class="l-body">
                <span class="l-title">{logLabel(e)}</span>
                <span class="l-meta">{t(`stats.kinds.${e.kind}`)} · {when(e.t)}</span>
              </div>
              <span class="l-reward">
                {#if e.xp}<b class="xp">+{e.xp} XP</b>{/if}
                {#if e.gold}<b class="gold" class:neg={e.gold < 0}>{e.gold > 0 ? '+' : ''}{e.gold}</b>{/if}
              </span>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </div>
</div>

<style>
  .tiles {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 18px;
  }
  .tile {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px 18px;
  }
  .t-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 750;
    color: var(--ink-3);
  }
  .tile b {
    font-family: var(--font-ui);
    font-size: 27px;
    font-weight: 800;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }
  .t-sub {
    font-size: 12px;
    color: var(--ink-3);
    font-weight: 650;
  }
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    gap: 18px;
    align-items: start;
  }
  .card {
    padding: 18px 20px;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .icon-btn.on {
    background: var(--accent-soft);
    color: var(--accent-text);
  }
  .chart {
    position: relative;
    width: 100%;
  }
  .chart svg {
    display: block;
    overflow: visible;
  }
  .grid-line {
    stroke: var(--line);
    stroke-width: 1;
  }
  .base {
    stroke: var(--line-2);
    stroke-width: 1;
  }
  .axis {
    fill: var(--ink-4);
    font-size: 11px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .axis.cur {
    fill: var(--ink);
  }
  .val {
    fill: var(--ink-2);
    font-size: 11.5px;
    font-weight: 800;
  }
  .hit {
    fill: transparent;
  }
  .col {
    outline: none;
    cursor: default;
  }
  .bar {
    fill: var(--accent);
    transition: opacity 0.2s;
  }
  .col.dim .bar {
    opacity: 0.4;
  }
  .col:focus-visible .hit {
    fill: var(--hover);
  }
  .tip {
    position: absolute;
    z-index: 5;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 8px 11px;
    border-radius: 11px;
    background: var(--ink);
    color: var(--bg);
    font-size: 12px;
    font-weight: 650;
    pointer-events: none;
    white-space: nowrap;
    box-shadow: var(--shadow);
  }
  .tip strong {
    font-weight: 800;
    font-size: 12.5px;
  }
  .no-data {
    position: absolute;
    left: 0;
    right: 0;
    top: 80px;
    text-align: center;
    font-weight: 700;
    color: var(--ink-3);
  }
  .table-wrap {
    max-height: 220px;
    overflow: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  th {
    text-align: left;
    font-size: 11.5px;
    font-weight: 800;
    color: var(--ink-3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 6px 8px;
    border-bottom: 1px solid var(--line);
    position: sticky;
    top: 0;
    background: var(--surface);
  }
  td {
    padding: 6px 8px;
    border-bottom: 1px solid var(--line);
    font-weight: 650;
  }
  td.num,
  th:not(:first-child) {
    text-align: right;
  }
  .empty-line {
    font-weight: 700;
    padding: 20px 0;
    text-align: center;
  }
  .hbars {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .hbars li {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .h-name {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 750;
    color: var(--ink-2);
  }
  .h-name i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .h-track {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .h-bar {
    height: 12px;
    min-width: 6px;
    border-radius: 0 4px 4px 0;
    transition: width 0.8s var(--ease-out);
  }
  .h-track b {
    font-size: 12.5px;
    font-weight: 800;
    color: var(--ink-2);
  }
  .heat-card {
    grid-column: 1 / -1;
  }
  .hint {
    font-size: 12px;
    font-weight: 700;
  }
  .heat-wrap {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }
  .heat {
    position: relative;
    display: grid;
    grid-template-columns: var(--label) auto;
    grid-template-rows: 18px auto;
    width: max-content;
  }
  .months {
    grid-column: 2;
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: calc(var(--cell) + var(--gap));
    font-size: 11px;
    font-weight: 700;
    color: var(--ink-4);
  }
  .months span {
    white-space: nowrap;
    text-transform: capitalize;
  }
  .days-col {
    grid-column: 1;
    grid-row: 2;
    display: grid;
    grid-auto-rows: var(--cell);
    row-gap: var(--gap);
    font-size: 10.5px;
    font-weight: 700;
    color: var(--ink-4);
    line-height: var(--cell);
  }
  .cols {
    grid-column: 2;
    grid-row: 2;
    display: flex;
    gap: var(--gap);
  }
  .hcol {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
  }
  .cell {
    width: var(--cell, 15px);
    height: var(--cell, 15px);
    border-radius: 4px;
    display: block;
    transition: transform 0.15s var(--ease-out);
  }
  .cols .cell:hover {
    transform: scale(1.25);
  }
  .l0 {
    background: var(--surface-3);
  }
  .l1 {
    background: color-mix(in oklab, var(--accent) 28%, var(--surface-3));
  }
  .l2 {
    background: color-mix(in oklab, var(--accent) 52%, var(--surface-3));
  }
  .l3 {
    background: color-mix(in oklab, var(--accent) 76%, var(--surface-3));
  }
  .l4 {
    background: var(--accent);
  }
  .cell.future {
    opacity: 0.35;
  }
  .cell.is-today {
    box-shadow: 0 0 0 1.5px var(--ink-3);
  }
  .legend .cell {
    width: 13px;
    height: 13px;
  }
  .legend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--ink-4);
  }
  .legend span:first-child {
    margin-right: 4px;
  }
  .legend span:last-child {
    margin-left: 4px;
  }
  .log-card {
    grid-column: 1 / -1;
  }
  .mood-card {
    grid-column: 1 / -1;
  }
  .moods {
    display: grid;
    grid-template-columns: repeat(30, minmax(0, 1fr));
    gap: 2px;
  }
  .m-day {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .m-empty {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1.5px dashed var(--line-2);
    transform: scale(0.55);
  }
  .m-n {
    font-size: 10px;
    font-weight: 800;
    color: var(--ink-4);
    font-variant-numeric: tabular-nums;
  }
  .m-n.today {
    color: var(--accent-text);
  }
  .log {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 18px;
  }
  .log li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 4px;
    border-bottom: 1px solid var(--line);
  }
  .l-icon {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 9px;
    background: var(--surface-3);
    color: var(--ink-3);
    flex: none;
  }
  .k-task,
  .k-subtask {
    background: var(--success-soft);
    color: var(--success);
  }
  .k-focus,
  .k-streak {
    background: var(--accent-soft);
    color: var(--accent-text);
  }
  .k-quest,
  .k-chest,
  .k-achievement {
    background: var(--gold-soft);
    color: var(--gold);
  }
  .l-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .l-title {
    font-weight: 750;
    font-size: 13.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .l-meta {
    font-size: 11.5px;
    color: var(--ink-3);
    font-weight: 650;
  }
  .l-reward {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    font-size: 12px;
    font-weight: 800;
  }
  .l-reward .xp {
    color: var(--xp);
  }
  .l-reward .gold {
    color: var(--gold);
  }
  .l-reward .gold.neg {
    color: var(--ink-3);
  }
  @media (max-width: 1120px) {
    .tiles {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .grid {
      grid-template-columns: 1fr;
    }
    .log {
      grid-template-columns: 1fr;
    }
  }
</style>
