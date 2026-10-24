import { type KeyboardEvent, useRef } from 'react';
import { type Host, HOSTS, HOST_NAME } from './model';
import styles from './NodeToggle.module.css';

/**
 * Which kind of node the operator is sitting at: two words, one underlined. A radio group, so the arrow
 * keys move and select, Home and End jump, and there is one Tab stop.
 */
export function NodeToggle({ host, onChange }: { host: Host; onChange: (host: Host) => void }) {
  const refs = useRef<Partial<Record<Host, HTMLButtonElement | null>>>({});

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = HOSTS.indexOf(host);
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % HOSTS.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + HOSTS.length) % HOSTS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = HOSTS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const target = HOSTS[next];
    if (!target) return;
    onChange(target);
    requestAnimationFrame(() => refs.current[target]?.focus());
  };

  return (
    <div role="radiogroup" aria-label="Kind of node" className={styles.toggle} onKeyDown={onKeyDown}>
      {HOSTS.map((h) => (
        <button
          key={h}
          ref={(el) => {
            refs.current[h] = el;
          }}
          type="button"
          role="radio"
          aria-checked={host === h}
          tabIndex={host === h ? 0 : -1}
          data-host={h}
          className={styles.opt}
          onClick={() => onChange(h)}
        >
          {HOST_NAME[h]}
        </button>
      ))}
    </div>
  );
}
