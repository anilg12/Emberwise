// UI-level actions: store changes plus the sounds, floaters and toasts that make them feel good.

import { store } from './state.svelte';
import { fx } from './fx.svelte';
import { sfx } from './sound';
import { t, itemName } from './i18n.svelte';
import { timer } from './timer.svelte';
import { burst } from './confetti';
import { shopItem } from './catalog';
import type { Task } from './types';

function anchor(el?: Element | null) {
  if (!el) return undefined;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function toggleTask(task: Task, el?: Element | null) {
  if (store.isDoneToday(task)) {
    store.uncompleteTask(task.id);
    sfx.undo();
    return;
  }
  const reward = store.completeTask(task.id);
  if (!reward) return;
  const at = anchor(el);
  sfx.complete();
  setTimeout(() => sfx.coin(), 140);
  fx.float(`+${reward.xp} XP`, 'xp', at);
  fx.float(`+${reward.gold}`, 'gold', at ? { x: at.x + 34, y: at.y + 6 } : undefined, 160);
  const id = task.id;
  fx.toast({
    kind: 'success',
    icon: 'check',
    title: t('tasks.completed', { task: task.title }),
    body: `+${reward.xp} XP · +${reward.gold} ${t('common.gold')}`,
    action: { label: t('common.undo'), run: () => store.uncompleteTask(id) },
    duration: 3600,
  });
}

export function toggleSubtask(task: Task, subId: string, el?: Element | null) {
  const done = store.toggleSubtask(task.id, subId);
  if (done === true) {
    sfx.pop();
    fx.float('+5 XP', 'xp', anchor(el));
  }
}

export function deleteTask(task: Task) {
  const removed = store.deleteTask(task.id);
  if (!removed) return;
  sfx.undo();
  fx.toast({
    kind: 'info',
    icon: 'trash',
    title: t('tasks.deleted'),
    body: task.title,
    action: { label: t('common.undo'), run: () => store.restoreTask(removed.task, removed.index) },
    duration: 5000,
  });
}

export function focusOn(task: Task | null) {
  if (task && timer.status === 'idle') {
    timer.setPhase('focus');
    timer.setTask(task.id);
  } else if (task && timer.phase === 'focus') {
    timer.setTask(task.id);
  }
  store.navigate('focus');
}

export function claimQuest(id: string, el?: Element | null) {
  const r = store.claimQuest(id);
  if (!r) return;
  const at = anchor(el);
  sfx.coin();
  setTimeout(() => sfx.complete(), 90);
  fx.float(`+${r.xp} XP`, 'xp', at);
  fx.float(`+${r.gold}`, 'gold', at ? { x: at.x + 36, y: at.y } : undefined, 150);
}

export function openChest(el?: Element | null) {
  const r = store.openChest();
  if (!r) return;
  const at = anchor(el);
  sfx.achievement();
  if (!store.reducedMotion) burst({ x: at?.x, y: at?.y, count: 80, spread: 0.8 });
  fx.float(`+${r.xp} XP`, 'xp', at);
  fx.float(`+${r.gold}`, 'gold', at ? { x: at.x + 40, y: at.y } : undefined, 180);
}

export function buyItem(id: string, el?: Element | null) {
  const ok = store.buy(id);
  if (!ok) {
    sfx.error();
    return false;
  }
  const item = shopItem(id);
  sfx.coin();
  setTimeout(() => sfx.achievement(), 120);
  fx.float(`-${item?.price ?? 0}`, 'minus', anchor(el));
  fx.toast({ kind: 'gold', icon: 'bag', title: t('shop.bought', { item: itemName(id) }) });
  return true;
}
