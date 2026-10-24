import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import { Sources } from '@/ui';
import type { Attempt } from './model';
import { Answer } from './verdict';
import styles from './Receipts.module.css';

/**
 * The receipts: one quiet toggle, closed by default. Open, it is the whole table the seat draws from, every
 * row of `operatorAccess`, with the answer on each kind of node, the short explanation and the sources. It is
 * the long form of everything above it, for anyone who wants to check.
 */
export function Receipts({ rows }: { rows: readonly Attempt[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (rows.length === 0) return null;

  return (
    <section className={styles.receipts} aria-label="The receipts">
      <button type="button" className={styles.toggle} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <span>{open ? 'Hide the receipts' : 'See the receipts'}</span>
        <ChevronDown size={18} strokeWidth={1.75} aria-hidden="true" className={styles.chevron} />
      </button>

      {open ? (
        <div id={id} className={styles.panel}>
          <p className={styles.lead}>The commands the operator types are illustrative; every answer comes from the sources beside it</p>
          <ul className={styles.rows} role="list">
            <li className={styles.cols} aria-hidden="true">
              <span>The attempt</span>
              <span className={styles.answers}>
                <span>Legacy node</span>
                <span>ArcaneOS node</span>
              </span>
            </li>
            {rows.map((row) => (
              <li key={row.key} className={styles.row}>
                <div className={styles.what}>
                  <p className={styles.cap}>{row.capability}</p>
                  <p className={styles.note}>{row.note}</p>
                </div>
                <div className={styles.answers}>
                  <p className={styles.cell}>
                    <span className={styles.which}>Legacy node</span>
                    <Answer verdict={row.legacy} />
                  </p>
                  <p className={styles.cell}>
                    <span className={styles.which}>ArcaneOS node</span>
                    <Answer verdict={row.arcane} />
                  </p>
                  <div className={styles.src}>
                    <Sources items={row.sources} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
