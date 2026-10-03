// The focus timer. Time is always derived from wall-clock timestamps, so it stays exact
// through sleep, throttling, minimised windows and even app restarts.

import { store } from './state.svelte';
import { fx } from './fx.svelte';
import { sfx } from './sound';
import { t } from './i18n.svelte';
import { notify, pinWindow, setProgress, updateTray } from './platform';
import { formatClock } from './dates';
import { burst } from './confetti';
import type { PersistedTimer } from './types';

export type Phase = 'focus' | 'short' | 'long';
export type Status = 'idle' | 'running' | 'paused';

class FocusTimer {
  phase = $state<Phase>('focus');
  status = $state<Status>('idle');
  endsAt = $state<number | null>(null);
  remainingMs = $state(25 * 60_000);
  totalMs = $state(25 * 60_000);
  startedAt = $state<number | null>(null);
  cycle = $state(0);
  taskId = $state<string | null>(null);
  now = $state(Date.now());

  remaining = $derived(
    this.status === 'running' && this.endsAt !== null ? Math.max(0, this.endsAt - this.now) : this.remainingMs,
  );
  progress = $derived(this.totalMs > 0 ? Math.min(1, Math.max(0, 1 - this.remaining / this.totalMs)) : 0);
  clock = $derived(formatClock(this.remaining));
  elapsedMin = $derived(Math.max(0, (this.totalMs - this.remaining) / 60_000));

  private handle: ReturnType<typeof setTimeout> | null = null;

  durationFor(phase: Phase): number {
    const s = store.data.settings;
    const min = phase === 'focus' ? s.focusMin : phase === 'short' ? s.shortMin : s.longMin;
    return Math.max(1, min) * 60_000;
  }

  /** Re-sync the idle duration when settings change. */
  syncIdleDuration() {
    if (this.status !== 'idle') return;
    this.totalMs = this.durationFor(this.phase);
    this.remainingMs = this.totalMs;
    this.publish();
  }

  restore() {
    const p = store.data.timer;
    if (!p || !['focus', 'short', 'long'].includes(p.phase)) {
      this.syncIdleDuration();
      return;
    }
    this.phase = p.phase;
    this.cycle = Number.isFinite(p.cycle) ? p.cycle : 0;
    this.taskId = typeof p.taskId === 'string' && store.task(p.taskId) ? p.taskId : null;
    this.totalMs = p.totalMs > 0 ? p.totalMs : this.durationFor(p.phase);
    this.startedAt = p.startedAt;
    if (p.status === 'running' && p.endsAt) {
      this.status = 'running';
      this.endsAt = p.endsAt;
      this.remainingMs = Math.max(0, p.endsAt - Date.now());
      if (p.endsAt <= Date.now()) {
        this.complete(true);
        return;
      }
    } else if (p.status === 'paused') {
      this.status = 'paused';
      this.remainingMs = Math.min(p.remainingMs, this.totalMs);
      this.endsAt = null;
    } else {
      this.status = 'idle';
      this.totalMs = this.durationFor(this.phase);
      this.remainingMs = this.totalMs;
    }
    this.now = Date.now();
    this.schedule();
    this.publish();
  }

  private save() {
    const snapshot: PersistedTimer = {
      phase: this.phase,
      status: this.status,
      endsAt: this.endsAt,
      remainingMs: this.remainingMs,
      totalMs: this.totalMs,
      startedAt: this.startedAt,
      cycle: this.cycle,
      taskId: this.taskId,
    };
    store.data.timer = snapshot;
    store.persist();
  }

  private clearHandle() {
    if (this.handle) clearTimeout(this.handle);
    this.handle = null;
  }

  private schedule() {
    this.clearHandle();
    if (this.status !== 'running' || this.endsAt === null) return;
    const rem = this.endsAt - Date.now();
    const delay = rem <= 0 ? 0 : Math.min(1000, (rem % 1000) + 12);
    this.handle = setTimeout(() => {
      this.tick();
      this.schedule();
    }, delay);
  }

  tick() {
    this.now = Date.now();
    if (this.status === 'running' && this.endsAt !== null && this.now >= this.endsAt) {
      this.complete(false);
      return;
    }
    this.publish();
  }

  /** Called when the app wakes from sleep or becomes visible again. */
  wake() {
    this.tick();
    this.schedule();
  }

  start() {
    if (this.status === 'running') return;
    if (this.status === 'idle') {
      this.totalMs = this.durationFor(this.phase);
      this.remainingMs = this.totalMs;
      this.startedAt = Date.now();
    }
    this.now = Date.now();
    this.endsAt = this.now + this.remainingMs;
    this.status = 'running';
    if (this.phase === 'focus') sfx.start();
    this.save();
    this.schedule();
    this.publish();
  }

  pause() {
    if (this.status !== 'running' || this.endsAt === null) return;
    this.remainingMs = Math.max(0, this.endsAt - Date.now());
    this.endsAt = null;
    this.status = 'paused';
    this.clearHandle();
    this.save();
    this.publish();
  }

  toggle() {
    if (this.status === 'running') this.pause();
    else this.start();
  }

  setPhase(phase: Phase) {
    if (this.status !== 'idle') return;
    this.phase = phase;
    this.syncIdleDuration();
    this.save();
  }

  setTask(id: string | null) {
    this.taskId = id;
    this.save();
  }

  /** Finish a focus session early. Partial focus still counts (≥ 5 minutes earns XP). */
  finishEarly(): { xp: number; gold: number } | null {
    if (this.status === 'idle') return null;
    this.clearHandle();
    let result: { xp: number; gold: number } | null = null;
    if (this.phase === 'focus') {
      const end = Date.now();
      const minutes = Math.floor(this.elapsedMin);
      if (minutes >= 1) {
        result = store.recordFocus({
          start: this.startedAt ?? end - minutes * 60_000,
          end,
          minutes,
          completed: false,
          taskId: this.taskId,
        });
      }
    }
    this.toIdle('focus');
    return result;
  }

  skipBreak() {
    if (this.phase === 'focus') return;
    this.clearHandle();
    this.toIdle('focus');
  }

  reset() {
    this.clearHandle();
    this.toIdle(this.phase);
  }

  private toIdle(phase: Phase) {
    this.phase = phase;
    this.status = 'idle';
    this.endsAt = null;
    this.startedAt = null;
    this.totalMs = this.durationFor(phase);
    this.remainingMs = this.totalMs;
    this.save();
    this.publish();
  }

  private complete(away: boolean) {
    this.clearHandle();
    const s = store.data.settings;
    const finished = this.phase;
    let next: Phase = 'focus';

    if (finished === 'focus') {
      const end = this.endsAt ?? Date.now();
      const minutes = Math.round(this.totalMs / 60_000);
      const reward = store.recordFocus({
        start: this.startedAt ?? end - this.totalMs,
        end,
        minutes,
        completed: true,
        taskId: this.taskId,
      });
      this.cycle += 1;
      next = this.cycle % Math.max(2, s.longEvery) === 0 ? 'long' : 'short';
      sfx.chime();
      if (away) {
        fx.toast({ kind: 'success', icon: 'flame', title: t('focus.awayDone'), body: t('focus.completeBody', reward), duration: 7000 });
      } else {
        fx.toast({ kind: 'success', icon: 'flame', title: t('focus.completeTitle'), body: t('focus.completeBody', reward), duration: 6000 });
        if (!store.reducedMotion && !document.hidden) burst({ count: 70 });
      }
      if (s.notifications && !away) notify(t('focus.completeTitle'), t('focus.completeBody', reward), 'focus');
    } else {
      next = 'focus';
      if (!away) {
        sfx.reminder();
        fx.toast({ kind: 'info', icon: 'coffee', title: t('focus.breakOverTitle'), body: t('focus.breakOverBody') });
        if (s.notifications) notify(t('focus.breakOverTitle'), t('focus.breakOverBody'), 'focus');
      }
    }

    this.toIdle(next);
    if (away) return;
    if ((next !== 'focus' && s.autoBreak) || (next === 'focus' && s.autoFocus)) this.start();
  }

  /** Mirror the timer to the tray / menu bar, the taskbar progress and the always-on-top pin. */
  publish() {
    const running = this.status === 'running';
    const active = this.status !== 'idle';
    updateTray({
      title: active ? this.clock : '',
      running,
      labels: {
        show: t('focus.trayShow'),
        toggle: running ? t('focus.trayPause') : t('focus.trayStart'),
        quit: t('focus.trayQuit'),
        hidden: t('focus.trayHidden'),
      },
    });
    setProgress(active && this.phase === 'focus' ? this.progress : -1);
    pinWindow(running && this.phase === 'focus' && store.data.settings.pinWhileFocus);
  }
}

export const timer = new FocusTimer();
