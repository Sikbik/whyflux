import { type RefObject, useEffect, useState } from 'react';
import { clamp } from '@/lib/math';

export type Placement = 'top' | 'bottom' | 'left' | 'right';

export interface FloatingPosition {
  top: number;
  left: number;
  placement: Placement;
}

/**
 * Positions a floating element (`position: fixed`) next to an anchor: the preferred side if it
 * fits, the opposite side if not, clamped inside the viewport. Re-measures on scroll and resize
 * while open.
 */
export function useFloating(
  anchor: RefObject<HTMLElement | null>,
  floating: RefObject<HTMLElement | null>,
  open: boolean,
  preferred: Placement = 'top',
  offset = 10,
): FloatingPosition | null {
  const [pos, setPos] = useState<FloatingPosition | null>(null);

  useEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    let raf = 0;
    const measure = () => {
      raf = 0;
      const a = anchor.current?.getBoundingClientRect();
      const f = floating.current?.getBoundingClientRect();
      if (!a || !f) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 8;
      const fits: Record<Placement, boolean> = {
        top: a.top - f.height - offset >= margin,
        bottom: a.bottom + f.height + offset <= vh - margin,
        left: a.left - f.width - offset >= margin,
        right: a.right + f.width + offset <= vw - margin,
      };
      const opposite: Record<Placement, Placement> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
      let placement = preferred;
      if (!fits[placement] && fits[opposite[placement]]) placement = opposite[placement];
      let top: number;
      let left: number;
      if (placement === 'top' || placement === 'bottom') {
        top = placement === 'top' ? a.top - f.height - offset : a.bottom + offset;
        left = a.left + a.width / 2 - f.width / 2;
      } else {
        left = placement === 'left' ? a.left - f.width - offset : a.right + offset;
        top = a.top + a.height / 2 - f.height / 2;
      }
      left = clamp(left, margin, Math.max(margin, vw - f.width - margin));
      top = clamp(top, margin, Math.max(margin, vh - f.height - margin));
      setPos((prev) =>
        prev && prev.top === top && prev.left === left && prev.placement === placement ? prev : { top, left, placement },
      );
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', schedule, { passive: true, capture: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [anchor, floating, open, preferred, offset]);

  return pos;
}
