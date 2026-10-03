// Transient UI feedback: toasts, floating "+XP" numbers and full-screen celebrations.

export type ToastKind = 'info' | 'success' | 'xp' | 'gold' | 'achievement' | 'reminder' | 'warn';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
  icon?: string;
  action?: { label: string; run: () => void };
  duration: number;
}

export interface Floater {
  id: number;
  x: number;
  y: number;
  text: string;
  tone: 'xp' | 'gold' | 'minus';
}

export interface Celebration {
  id: number;
  kind: 'level';
  level: number;
  rankChanged: boolean;
}

let seq = 1;

class Fx {
  toasts = $state<Toast[]>([]);
  floaters = $state<Floater[]>([]);
  celebrations = $state<Celebration[]>([]);
  /** Last pointer position, used to anchor floaters to where the user clicked. */
  pointer = { x: 0, y: 0 };

  toast(t: Omit<Toast, 'id' | 'duration'> & { duration?: number }) {
    const id = seq++;
    const toast: Toast = { duration: 3800, ...t, id };
    this.toasts = [...this.toasts.slice(-3), toast];
    if (toast.duration > 0) setTimeout(() => this.dismiss(id), toast.duration);
    return id;
  }

  dismiss(id: number) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  float(text: string, tone: Floater['tone'] = 'xp', at?: { x: number; y: number }, delay = 0) {
    const spawn = () => {
      const id = seq++;
      const p = at ?? this.pointer;
      const jitter = (Math.random() - 0.5) * 18;
      this.floaters = [...this.floaters, { id, x: p.x + jitter, y: p.y, text, tone }];
      setTimeout(() => {
        this.floaters = this.floaters.filter((f) => f.id !== id);
      }, 1300);
    };
    if (delay) setTimeout(spawn, delay);
    else spawn();
  }

  celebrate(c: Omit<Celebration, 'id'>) {
    // Only keep the most recent level-up; several at once collapse into one.
    this.celebrations = [{ ...c, id: seq++ }];
  }

  closeCelebration() {
    this.celebrations = [];
  }
}

export const fx = new Fx();

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointerdown',
    (e) => {
      fx.pointer = { x: e.clientX, y: e.clientY };
    },
    { capture: true, passive: true },
  );
}
