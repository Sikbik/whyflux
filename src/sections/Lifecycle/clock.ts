/**
 * The story clock for the pinned scene.
 *
 * The picture is a pure function of one number, `--t` (0 to 10): every element is a window on it (see
 * Scene.tsx). Written once on the stage root, a new `--t` is re-resolved by every element of the picture on
 * every scroll frame, though nearly all of them sit before or after their window and would not change.
 * So each windowed element gets a `--t` of its own, held at the edge of its own window (or windows, or the span
 * a `data-win="lo hi"` declares for something it contains that runs on the number, like a micro-scene) until the
 * clock is within it. Out of window it is one constant and costs nothing; in window it follows the clock. A
 * windowed element never reads its parent's number, so a parent is not kept moving for its children's sake and
 * per frame only the few elements in play are touched.
 *
 * The scene stays a plain function of `--t` for anything that does not use this (a phone card sets `--t`
 * once and lets it inherit). The scene's camera (`[data-camera]`, see model.ts) is pointed from the same number.
 */
import { cameraTransform } from './model';

export interface Clock {
  /** Move the clock to `t` (0 to 10). */
  set: (t: number) => void;
}

interface Entry {
  el: HTMLElement | SVGElement;
  lo: number;
  hi: number;
  last: number;
}

const read = (el: HTMLElement | SVGElement, name: string): number => Number.parseFloat(el.style.getPropertyValue(name));

/** The windows an element declares inline (`--a`..`--d`, or `data-win="lo hi"` for a span it owns by hand). */
function span(el: HTMLElement | SVGElement): [number, number] | null {
  const edges = ['--a', '--b', '--c', '--d'].map((n) => read(el, n)).filter(Number.isFinite);
  const hand = el.dataset.win?.split(' ').map(Number).filter(Number.isFinite) ?? [];
  const all = [...edges, ...hand];
  return all.length ? [Math.min(...all), Math.max(...all)] : null;
}

/** Reads the windows out of `scene` once and returns the clock that drives them (and points its camera). */
export function createClock(scene: Element): Clock {
  const camera = scene.querySelector('[data-camera]');
  let view = '';
  const entries = new Map<Element, Entry>();
  const nodes = [...scene.querySelectorAll<HTMLElement | SVGElement>('*')];
  for (const el of nodes) {
    // A micro-scene runs on a number of its own; its parent's span covers it.
    if (el.closest('[data-kind]')) continue;
    const s = span(el);
    if (s) entries.set(el, { el, lo: s[0], hi: s[1], last: Number.NaN });
  }

  const list = [...entries.values()];
  return {
    set(t) {
      if (camera) {
        const next = cameraTransform(t);
        if (next !== view) {
          view = next;
          camera.setAttribute('transform', next);
        }
      }
      for (const e of list) {
        const v = t < e.lo ? e.lo : t > e.hi ? e.hi : t;
        if (v === e.last) continue;
        e.last = v;
        e.el.style.setProperty('--t', v.toFixed(4));
      }
    },
  };
}
