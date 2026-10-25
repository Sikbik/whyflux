import { type RefObject, useLayoutEffect, useState } from 'react';

export type AnchoredPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface AnchoredPosition {
  top: number;
  left: number;
  placement: AnchoredPlacement;
}

/**
 * Places a `position: fixed` panel next to an anchor element. `top` and `bottom` try that side first
 * and flip; `side` (for tall panels) tries right, then left, then below, then above, so the panel
 * never lands on the thing it describes. It centres on the anchor, clamps inside the viewport and
 * re-measures on scroll, resize and when the panel's own size changes. Null until the first
 * measurement, so the panel can render hidden, be measured, then appear in place (no jump).
 */
export function useAnchoredPosition(
  anchor: HTMLElement | null,
  panel: RefObject<HTMLElement | null>,
  active: boolean,
  preferred: 'top' | 'bottom' | 'side' = 'bottom',
  offset = 10,
): AnchoredPosition | null {
  const [pos, setPos] = useState<AnchoredPosition | null>(null);

  useLayoutEffect(() => {
    if (!active || !anchor) {
      setPos(null);
      return;
    }
    let raf = 0;
    const measure = () => {
      raf = 0;
      const el = panel.current;
      if (!el || !anchor.isConnected) return;
      const a = anchor.getBoundingClientRect();
      const f = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 8;
      const room: Record<AnchoredPlacement, number> = {
        bottom: vh - margin - (a.bottom + offset) - f.height,
        top: a.top - offset - margin - f.height,
        right: vw - margin - (a.right + offset) - f.width,
        left: a.left - offset - margin - f.width,
      };
      const order: AnchoredPlacement[] =
        preferred === 'side'
          ? ['right', 'left', 'bottom', 'top']
          : preferred === 'bottom'
            ? ['bottom', 'top']
            : ['top', 'bottom'];
      // The first side with room; if none has any, the one with the most (least overflow).
      const placement = order.find((p) => room[p] >= 0) ?? [...order].sort((p, q) => room[q] - room[p])[0] ?? 'bottom';

      let top: number;
      let left: number;
      if (placement === 'top' || placement === 'bottom') {
        top = placement === 'bottom' ? a.bottom + offset : a.top - offset - f.height;
        left = a.left + a.width / 2 - f.width / 2;
      } else {
        left = placement === 'right' ? a.right + offset : a.left - offset - f.width;
        top = a.top + a.height / 2 - f.height / 2;
      }
      top = Math.min(Math.max(top, margin), Math.max(margin, vh - f.height - margin));
      left = Math.min(Math.max(left, margin), Math.max(margin, vw - f.width - margin));
      setPos((p) => (p && p.top === top && p.left === left && p.placement === placement ? p : { top, left, placement }));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', schedule, { passive: true, capture: true });
    window.addEventListener('resize', schedule);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    if (panel.current) ro?.observe(panel.current);
    return () => {
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      ro?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [anchor, panel, active, preferred, offset]);

  return pos;
}
