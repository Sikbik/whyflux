import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import { platformById } from '@/lib/compare';
import { Marker } from '@/sections/Arena/Marker';
import { Sources } from '@/ui';
import type { Footnote } from './model';
import styles from './Fineprint.module.css';

export interface FineprintProps {
  items: Footnote[];
  /** The workload string from the data, exactly as priced. */
  workload: string;
  /** The date the prices were taken, formatted. */
  pricedOn: string;
}

/**
 * Everything behind the numbers, one word away: what exactly was priced, when, and the caveats that
 * come with comparing machines across providers. Closed until asked for. Each caveat is a sentence
 * lifted from a price's note (only the lead word is written here), with its sources one tap away.
 */
export function Fineprint({ items, workload, pricedOn }: FineprintProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={styles.fine}>
      <button type="button" className={styles.toggle} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        See the receipts
        <ChevronDown className={styles.chevron} size={18} strokeWidth={1.75} aria-hidden="true" />
      </button>

      <div id={id} className={styles.drawer} data-open={open || undefined} aria-hidden={!open} inert={!open}>
        <div className={styles.clip}>
          <div className={styles.inner}>
            <dl className={styles.facts}>
              <div>
                <dt>What we priced</dt>
                <dd>{workload}</dd>
              </div>
              <div>
                <dt>Priced on</dt>
                <dd>{pricedOn}</dd>
              </div>
            </dl>

            {items.length ? (
              <ol className={styles.list}>
                {items.map((f) => {
                  const platform = f.platformId ? platformById(f.platformId) : undefined;
                  return (
                    <li key={f.id} className={styles.item}>
                      <h4 className={styles.lead}>
                        {platform ? <Marker platform={platform} size={11} mono /> : null}
                        {f.lead}
                      </h4>
                      <p className={styles.text}>{f.text}</p>
                      <Sources items={f.sources} className={styles.sources} />
                    </li>
                  );
                })}
              </ol>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
