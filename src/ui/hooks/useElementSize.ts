import { type RefObject, useEffect, useState } from 'react';

export interface Size {
  width: number;
  height: number;
}

/** Observes an element's content box. Starts at 0 x 0 until the first measurement. */
export function useElementSize<T extends Element>(ref: RefObject<T | null>): Size {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize((s) => (s.width === width && s.height === height ? s : { width, height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}
