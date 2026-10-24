/**
 * One scroll loop for the whole page.
 *
 * Native scrolling, always. Nothing here moves the page; it only reads it. Every scroll-driven
 * piece (the nav spy, pinned stories, parallax plates, the hero globe) subscribes to the same
 * rAF-coalesced frame, and element trackers only measure while their element is near the
 * viewport, so an idle page costs nothing.
 */
import { clamp, clamp01 } from './math';
import { observe } from './observer';

export interface ScrollFrame {
  /** window.scrollY */
  y: number;
  /** Change in y since the previous frame (positive = scrolling down). */
  dy: number;
  vh: number;
  vw: number;
}

type FrameListener = (frame: ScrollFrame) => void;

const listeners = new Set<FrameListener>();
let raf = 0;
let lastY = 0;
let attached = false;

function read(): ScrollFrame {
  const y = window.scrollY;
  const frame = { y, dy: y - lastY, vh: window.innerHeight, vw: window.innerWidth };
  lastY = y;
  return frame;
}

function tick(): void {
  raf = 0;
  const frame = read();
  for (const l of [...listeners]) l(frame);
}

function schedule(): void {
  if (!raf) raf = requestAnimationFrame(tick);
}

function attach(): void {
  if (attached || typeof window === 'undefined') return;
  attached = true;
  lastY = window.scrollY;
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('load', schedule);
}

function detach(): void {
  if (!attached) return;
  attached = false;
  window.removeEventListener('scroll', schedule);
  window.removeEventListener('resize', schedule);
  window.removeEventListener('load', schedule);
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

/** Calls `listener` once per animation frame in which the page scrolled or resized. */
export function subscribeScroll(listener: FrameListener, { immediate = true } = {}): () => void {
  listeners.add(listener);
  attach();
  if (immediate) schedule();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) detach();
  };
}

export type ProgressMode = 'enter' | 'sticky';

export interface Progress {
  /**
   * `enter`: 0 when the element's top meets the viewport bottom, 1 when its bottom meets the
   * viewport top. `sticky`: for a tall wrapper holding a `position: sticky` stage: 0 when the
   * wrapper's top reaches the viewport top, 1 when its bottom reaches the viewport bottom.
   */
  p: number;
  /** Centre offset, -1 (element centre at the viewport bottom) .. 0 (centred) .. 1 (at the top). */
  pc: number;
  /** True while the element is within the tracking margin of the viewport. */
  near: boolean;
}

export function measureProgress(el: Element, mode: ProgressMode, vh = window.innerHeight): Progress {
  const r = el.getBoundingClientRect();
  const p =
    mode === 'sticky' ? clamp01(-r.top / Math.max(1, r.height - vh)) : clamp01((vh - r.top) / (vh + r.height));
  const pc = clamp((vh / 2 - (r.top + r.height / 2)) / (vh / 2 + r.height / 2), -1, 1);
  return { p, pc, near: r.bottom > -vh * 0.5 && r.top < vh * 1.5 };
}

/**
 * Tracks an element's scroll progress. Calls `onUpdate` every frame while the element is within
 * one screen of the viewport, and once when it leaves (so the last value is exact). Returns an
 * untrack function.
 */
export function trackProgress(
  el: Element,
  mode: ProgressMode,
  onUpdate: (progress: Progress, frame: ScrollFrame) => void,
): () => void {
  let near = true;
  const stopObserve = observe(
    el,
    (entry) => {
      near = entry.isIntersecting;
      if (near) schedule();
    },
    { rootMargin: '100% 0px 100% 0px' },
  );
  let wasNear = false;
  const stop = subscribeScroll((frame) => {
    if (!near && !wasNear) return;
    const progress = measureProgress(el, mode, frame.vh);
    wasNear = near;
    onUpdate(progress, frame);
  });
  return () => {
    stopObserve();
    stop();
  };
}
