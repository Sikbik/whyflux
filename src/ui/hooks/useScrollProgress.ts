import { type RefObject, useEffect, useRef } from 'react';
import { type Progress, type ProgressMode, trackProgress } from '@/lib/scroll';

export interface ScrollProgressOptions {
  /** `enter` (default) or `sticky` (a tall wrapper around a sticky stage). See lib/scroll. */
  mode?: ProgressMode;
  /** Write `--p` and `--pc` on the element. Default true. Pure CSS can then scrub with them. */
  vars?: boolean;
  /** Called every frame while the element is near the viewport. Use it to drive a canvas. */
  onUpdate?: (progress: Progress) => void;
}

/**
 * Scroll progress without re-rendering. Writes CSS custom properties on the element:
 *
 *   --p    0..1 progress (see `mode`)
 *   --pc   -1..1 centre offset (parallax: translate: 0 calc(var(--pc) * -40px))
 *
 * and returns a mutable ref holding the latest numbers, for canvas loops to read each frame:
 *
 *   const progress = useScrollProgress(wrapperRef, { mode: 'sticky' });
 *   // inside a rAF loop: progress.current.p
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  { mode = 'enter', vars = true, onUpdate }: ScrollProgressOptions = {},
): RefObject<Progress> {
  const latest = useRef<Progress>({ p: 0, pc: 0, near: false });
  const cb = useRef(onUpdate);
  cb.current = onUpdate;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return trackProgress(el, mode, (progress) => {
      latest.current = progress;
      if (vars) {
        el.style.setProperty('--p', progress.p.toFixed(4));
        el.style.setProperty('--pc', progress.pc.toFixed(4));
      }
      cb.current?.(progress);
    });
  }, [ref, mode, vars]);

  return latest;
}
