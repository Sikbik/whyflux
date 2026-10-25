import { type KeyboardEvent, type ReactNode, useId, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import styles from './Segmented.module.css';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Accessible name when the label is only an icon. */
  ariaLabel?: string;
  disabled?: boolean;
}

export interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for assistive tech: required. */
  'aria-label': string;
  size?: 'sm' | 'md';
  /** Stretch the options to fill the width. */
  fullWidth?: boolean;
  className?: string;
}

/**
 * A segmented control (a radio group that looks like a hex-pill toggle) with a sliding lit
 * indicator. Arrow keys move and select, Home and End jump. Use it for filters and view modes.
 *
 *   <Segmented aria-label="Group" value={group} onChange={setGroup} options={[{ value: 'all', label: 'All' }, ...]} />
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className,
  ...aria
}: SegmentedProps<T>) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState({ x: 0, w: 0, ready: false });

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => {
      const active = el.querySelector<HTMLElement>('[aria-checked="true"]');
      if (active) setInd({ x: active.offsetLeft, w: active.offsetWidth, ready: true });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [value, options]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const enabled = options.filter((o) => !o.disabled);
    const i = enabled.findIndex((o) => o.value === value);
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % enabled.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + enabled.length) % enabled.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = enabled.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const target = enabled[next];
    if (!target) return;
    onChange(target.value);
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`[data-v="${CSS.escape(target.value)}"]`)?.focus());
  };

  return (
    <div
      ref={root}
      role="radiogroup"
      aria-label={aria['aria-label']}
      className={cn(styles.seg, className)}
      data-size={size}
      data-full={fullWidth || undefined}
      onKeyDown={onKey}
    >
      <span
        className={styles.ind}
        aria-hidden="true"
        data-ready={ind.ready}
        style={{ translate: `${ind.x}px 0`, inlineSize: ind.w }}
      />
      {options.map((o) => {
        const checked = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            id={`${id}-${o.value}`}
            data-v={o.value}
            aria-checked={checked}
            aria-label={o.ariaLabel}
            tabIndex={checked ? 0 : -1}
            disabled={o.disabled}
            className={styles.opt}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
