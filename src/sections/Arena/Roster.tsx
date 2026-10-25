import { type KeyboardEvent, type ReactNode, useRef } from 'react';
import type { Platform } from '@/data/types';
import { cn } from '@/lib/cn';
import { Marker } from './Marker';
import { KIND_LABEL, rivalGroups, shortName } from './model';
import styles from './Roster.module.css';

export interface RosterProps {
  /** Accessible name of the group. */
  label: string;
  /** `single` picks one opponent (a radio group); `multi` toggles several (the radar). */
  mode: 'single' | 'multi';
  /** The picked platform ids. */
  picked: readonly string[];
  onPick: (platformId: string) => void;
  /** `multi`: the mark beside a picked name (its line key). Everyone else gets the platform swatch. */
  leadFor?: (platform: Platform) => ReactNode;
  /** `multi`: a platform that is always on and cannot be toggled (Flux on the radar). */
  pinned?: { platform: Platform; lead: ReactNode };
  className?: string;
}

/**
 * Who to fight: every opponent as a name in a quiet list, DePIN first and the clouds under a rule.
 * No chips and no labels; the chosen name is white and bold with a line leading it. A column that
 * sticks beside the matchup on a desktop, one scrolling line on a phone. Arrow keys move the choice.
 */
export function Roster({ label, mode, picked, onPick, leadFor, pinned, className }: RosterProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const single = mode === 'single';
  const groups = rivalGroups();
  const ids = groups.flatMap((g) => g.platforms.map((p) => p.id));
  const value = picked[0] ?? '';

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = ids.indexOf(value);
    let next = -1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (at + 1) % ids.length;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (at - 1 + ids.length) % ids.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = ids.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const id = ids[next];
    if (!id) return;
    onPick(id);
    requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>(`[data-v="${CSS.escape(id)}"]`)?.focus());
  };

  return (
    <div
      ref={ref}
      role={single ? 'radiogroup' : 'group'}
      aria-label={label}
      className={cn(styles.roster, className)}
      data-mode={mode}
      onKeyDown={single ? onKey : undefined}
    >
      {pinned ? (
        <div className={styles.group}>
          <span className={cn(styles.item, styles.pinned)} data-on aria-label={`${pinned.platform.name}, always drawn`} role="img">
            <span className={styles.line} aria-hidden="true" />
            {pinned.lead}
            <span className={styles.name}>{shortName(pinned.platform)}</span>
          </span>
        </div>
      ) : null}
      {groups.map((g) => (
        <div key={g.kind} className={styles.group}>
          {g.platforms.map((p) => {
            const on = picked.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                role={single ? 'radio' : undefined}
                aria-checked={single ? on : undefined}
                aria-pressed={single ? undefined : on}
                aria-label={`${p.name}, ${KIND_LABEL[p.kind]}`}
                data-v={p.id}
                data-on={on || undefined}
                tabIndex={single ? (on ? 0 : -1) : undefined}
                className={styles.item}
                onClick={() => onPick(p.id)}
              >
                <span className={styles.line} aria-hidden="true" />
                {on && leadFor ? leadFor(p) : single ? null : <Marker platform={p} size={11} muted mono />}
                <span className={styles.name}>{shortName(p)}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
