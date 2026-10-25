import { type KeyboardEvent, useRef } from 'react';
import { formatInt } from '@/lib/format';
import { HexBullet } from '@/ui';
import { tierName, TIER_IDS, type TierFilter } from './model';
import styles from './TierToggle.module.css';

export interface TierToggleProps {
  value: TierFilter;
  onChange: (value: TierFilter) => void;
  /** Nodes online per option, when the network has said. */
  counts?: Partial<Record<TierFilter, number>>;
}

const OPTIONS: readonly TierFilter[] = ['all', ...TIER_IDS];

/**
 * The map's tier filter: plain words in a row, the chosen one underlined in its own colour. A radio
 * group underneath (arrow keys move and choose, Home and End jump). Each tier carries the hexagon in
 * its colour, so the row doubles as the map's legend.
 */
export function TierToggle({ value, onChange, counts }: TierToggleProps) {
  const root = useRef<HTMLDivElement>(null);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = OPTIONS.indexOf(value);
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % OPTIONS.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + OPTIONS.length) % OPTIONS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = OPTIONS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const target = OPTIONS[next];
    if (!target) return;
    onChange(target);
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`[data-v="${target}"]`)?.focus());
  };

  return (
    <div ref={root} role="radiogroup" aria-label="Show nodes of tier" className={styles.toggle} onKeyDown={onKey}>
      {OPTIONS.map((id) => {
        const checked = id === value;
        const count = counts?.[id];
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            data-v={id}
            data-tier={id === 'all' ? undefined : id}
            className={styles.opt}
            onClick={() => onChange(id)}
          >
            {id === 'all' ? null : <HexBullet size={8} className={styles.bullet} />}
            {id === 'all' ? (
              <span>
                All<span className={styles.more}> nodes</span>
              </span>
            ) : (
              <span>{tierName(id)}</span>
            )}
            {count ? <span className={styles.count}>{formatInt(count)}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
