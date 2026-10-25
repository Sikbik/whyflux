import { type RefObject } from 'react';
import { useInView } from './useInView';
import { usePageVisible } from './usePageVisible';

/**
 * True while the element is within one screen of the viewport AND the tab is visible. Every
 * canvas, requestAnimationFrame loop and timer-driven simulation gates itself on this, so
 * nothing runs offscreen (the 60 fps rule).
 */
export function useActive<T extends Element>(ref: RefObject<T | null>, rootMargin = '25% 0px 25% 0px'): boolean {
  const near = useInView(ref, { rootMargin });
  const visible = usePageVisible();
  return near && visible;
}
