import { type RefObject, useEffect, useState } from 'react';

/**
 * True once `fraction` of the element is on screen, or `fraction` of the viewport's height when the element
 * is taller than that can ever be (a phone, where the whole seat never fits). Used to start the opening
 * sequence at the moment the visitor is actually looking at it.
 */
export function useVisibleEnough<T extends Element>(ref: RefObject<T | null>, fraction = 0.6): boolean {
  const [enough, setEnough] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const view = entry.rootBounds?.height ?? window.innerHeight;
        const need = Math.min(entry.boundingClientRect.height, view) * fraction;
        setEnough(entry.isIntersecting && entry.intersectionRect.height >= need - 1);
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, fraction]);
  return enough;
}
