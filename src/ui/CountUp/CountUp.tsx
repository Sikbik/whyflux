import { type CSSProperties, useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { formatCompact, formatNumber } from '@/lib/format';
import { easeOutExpo } from '@/lib/math';
import { observe } from '@/lib/observer';
import { useReducedMotion } from '../hooks/useReducedMotion';
import styles from './CountUp.module.css';

export interface CountUpProps {
  /** The number to show. `null` or `undefined` renders the placeholder (data not here yet). */
  value: number | null | undefined;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** `int`/`number` use thousands separators; `compact` gives 12.4K, 3.1M. */
  format?: 'number' | 'compact';
  /** Count duration in ms. Default 1600. */
  duration?: number;
  /** Count on mount instead of when it scrolls into view. */
  immediate?: boolean;
  /** Text shown while there is no value. Default an en dash (the house voice has no em dashes). */
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
}

function render(v: number, decimals: number, format: 'number' | 'compact', prefix: string, suffix: string): string {
  const body = format === 'compact' ? formatCompact(v, decimals || 1) : formatNumber(v, decimals);
  return `${prefix}${body}${suffix}`;
}

/**
 * A number that counts up the first time it is seen and eases to every new value (live data
 * ticking). It writes straight to the DOM, so a ticking figure never re-renders React. Tabular
 * figures, so the width does not jitter. Under reduced motion it just sets the value.
 */
export function CountUp({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  format = 'number',
  duration = 1600,
  immediate = false,
  placeholder = '–',
  className,
  style,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const shown = useRef<number | null>(null);
  const visible = useRef(false);
  const raf = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value == null || !Number.isFinite(value)) {
      el.textContent = placeholder;
      shown.current = null;
      return;
    }
    const target = value;
    const write = (v: number) => {
      el.textContent = render(v, decimals, format, prefix, suffix);
    };
    const run = () => {
      cancelAnimationFrame(raf.current);
      const from = shown.current ?? 0;
      if (reduced || from === target) {
        shown.current = target;
        write(target);
        return;
      }
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        const v = from + (target - from) * easeOutExpo(t);
        shown.current = v;
        write(v);
        if (t < 1) raf.current = requestAnimationFrame(step);
        else shown.current = target;
      };
      raf.current = requestAnimationFrame(step);
    };

    if (visible.current || immediate || reduced || typeof IntersectionObserver === 'undefined') {
      visible.current = true;
      run();
      return () => cancelAnimationFrame(raf.current);
    }
    write(shown.current ?? 0);
    const stop = observe(el, (entry) => {
      if (!entry.isIntersecting) return;
      visible.current = true;
      stop();
      run();
    });
    return () => {
      stop();
      cancelAnimationFrame(raf.current);
    };
  }, [value, decimals, prefix, suffix, format, duration, immediate, reduced, placeholder]);

  const final = value == null || !Number.isFinite(value) ? placeholder : render(value, decimals, format, prefix, suffix);

  return (
    <span ref={ref} className={cn(styles.count, className)} style={style}>
      {final}
    </span>
  );
}
