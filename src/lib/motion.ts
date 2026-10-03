import { cubicOut, backOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

export function reduced(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('reduce-motion');
}

/** Duration helper: collapses to 0 when the user prefers reduced motion. */
export function d(ms: number): number {
  return reduced() ? 0 : ms;
}

/** Soft rise + fade, the default entrance for cards and pages. */
export function rise(_node: Element, { y = 10, duration = 280, delay = 0 } = {}): TransitionConfig {
  if (reduced()) return { duration: 0 };
  return {
    duration,
    delay,
    easing: cubicOut,
    css: (t, u) => `opacity:${t};transform:translateY(${u * y}px)`,
  };
}

/** Springy pop used for badges and celebratory things. */
export function pop(_node: Element, { duration = 380, delay = 0, from = 0.6 } = {}): TransitionConfig {
  if (reduced()) return { duration: 0 };
  return {
    duration,
    delay,
    easing: backOut,
    css: (t) => `opacity:${Math.min(1, t * 1.6)};transform:scale(${from + (1 - from) * t})`,
  };
}

/** Panel entrance for dialogs. */
export function panel(_node: Element, { duration = 300 } = {}): TransitionConfig {
  if (reduced()) return { duration: 0 };
  return {
    duration,
    easing: cubicOut,
    css: (t, u) => `opacity:${t};transform:translateY(${u * 14}px) scale(${0.97 + 0.03 * t})`,
  };
}

/** Collapses height smoothly (lists, expanders). */
export function collapse(node: Element, { duration = 240 } = {}): TransitionConfig {
  if (reduced()) return { duration: 0 };
  const style = getComputedStyle(node);
  const h = parseFloat(style.height);
  const pt = parseFloat(style.paddingTop);
  const pb = parseFloat(style.paddingBottom);
  const mt = parseFloat(style.marginTop);
  const mb = parseFloat(style.marginBottom);
  return {
    duration,
    easing: cubicOut,
    css: (t) =>
      `overflow:hidden;opacity:${t};height:${t * h}px;padding-top:${t * pt}px;padding-bottom:${t * pb}px;margin-top:${t * mt}px;margin-bottom:${t * mb}px`,
  };
}
