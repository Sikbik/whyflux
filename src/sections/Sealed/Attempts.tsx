import { type KeyboardEvent, type ReactNode, useRef, useState } from 'react';
import { type Attempt, HOST_NAME, type Host, verdictOn } from './model';
import type { Run } from './useSeat';
import { VERDICT, Answer } from './verdict';
import styles from './Attempts.module.css';

export interface AttemptsProps {
  /** The attempts, in the order they run. */
  rows: readonly Attempt[];
  host: Host;
  /** What has been tried on this kind of node. */
  tried: readonly string[];
  /** An attempt whose beam has not landed yet: its answer stays blank until it does. */
  flying: string | null;
  run: Run | null;
  /** On phones the detail of the selected attempt sits under its row, where the visitor's thumb is. */
  detail: (row: Attempt) => ReactNode;
  onAttempt: (key: string) => void;
  /** The pointer or keyboard is on an attempt: let the stage point at its layer. */
  onPreview: (key: string | null) => void;
  labelledBy: string;
}

/**
 * "Can a node operator ...?" and the ways to try. Plain rows divided by hairlines, each a real button; the
 * answer for the selected kind of node fills in at the end of the row (blank until tried). Arrow keys move
 * through the list; one Tab stop for the whole thing.
 */
export function Attempts({ rows, host, tried, flying, run, detail, onAttempt, onPreview, labelledBy }: AttemptsProps) {
  const list = useRef<HTMLUListElement>(null);
  const [focusKey, setFocusKey] = useState(rows[0]?.key ?? '');
  const here = new Set(tried);

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const buttons = Array.from(list.current?.querySelectorAll<HTMLButtonElement>('button[data-attempt]') ?? []);
    const i = buttons.findIndex((b) => b === document.activeElement);
    if (i < 0) return;
    let next = -1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = Math.min(buttons.length - 1, i + 1);
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = Math.max(0, i - 1);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = buttons.length - 1;
    if (next < 0) return;
    e.preventDefault();
    buttons[next]?.focus();
  };

  return (
    <ul ref={list} className={styles.list} role="list" aria-labelledby={labelledBy} onKeyDown={onKeyDown}>
      {rows.map((row) => {
        const answered = here.has(row.key) && flying !== row.key ? verdictOn(row, host) : null;
        const selected = run?.key === row.key && run.host === host;
        return (
          <li key={row.key} className={styles.item}>
            <button
              type="button"
              data-attempt=""
              className={styles.attempt}
              data-selected={selected || undefined}
              tabIndex={focusKey === row.key ? 0 : -1}
              aria-current={selected ? 'true' : undefined}
              onClick={() => {
                setFocusKey(row.key);
                onAttempt(row.key);
              }}
              onFocus={() => {
                setFocusKey(row.key);
                onPreview(row.key);
              }}
              onBlur={() => onPreview(null)}
              onPointerEnter={() => onPreview(row.key)}
              onPointerLeave={() => onPreview(null)}
            >
              <span className={styles.label}>{row.capability}</span>
              <span className={styles.answer}>
                {answered ? (
                  <>
                    <span className="sr-only">{`${HOST_NAME[host]}: ${VERDICT[answered].word}`}</span>
                    <span aria-hidden="true">
                      <Answer verdict={answered} />
                    </span>
                  </>
                ) : (
                  <span className="sr-only">{`${HOST_NAME[host]}: not tried`}</span>
                )}
              </span>
            </button>
            {selected && answered ? <div className={styles.detail}>{detail(row)}</div> : null}
          </li>
        );
      })}
    </ul>
  );
}
