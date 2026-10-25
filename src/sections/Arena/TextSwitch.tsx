import { type KeyboardEvent, useRef } from 'react';
import { cn } from '@/lib/cn';
import styles from './TextSwitch.module.css';

export interface TextSwitchOption<T extends string> {
  value: T;
  label: string;
  /** Accessible name when the visible label is shortened. */
  ariaLabel?: string;
}

export interface TextSwitchProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly TextSwitchOption<T>[];
  'aria-label': string;
  size?: 'md' | 'lg';
  className?: string;
}

/**
 * A one-of-few switch set as plain words: the chosen one is white with a line under it, the rest
 * are quiet. A radio group underneath (arrow keys move and choose, one tab stop), so it works like
 * the kit's Segmented without the capsule. Shared by the arena's views and the cost workloads.
 */
export function TextSwitch<T extends string>({ value, onChange, options, size = 'md', className, ...aria }: TextSwitchProps<T>) {
  const ref = useRef<HTMLDivElement | null>(null);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = options.findIndex((o) => o.value === value);
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (at + 1) % options.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (at - 1 + options.length) % options.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = options.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const option = options[next];
    if (!option) return;
    onChange(option.value);
    requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>(`[data-v="${CSS.escape(option.value)}"]`)?.focus());
  };

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={aria['aria-label']}
      className={cn(styles.switch, className)}
      data-size={size}
      onKeyDown={onKey}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          aria-label={o.ariaLabel}
          data-v={o.value}
          tabIndex={o.value === value ? 0 : -1}
          className={styles.option}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
