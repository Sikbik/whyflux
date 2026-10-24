import { ArrowUpRight } from 'lucide-react';
import type { EcosystemItem } from '@/data/types';
import { stripPeriod } from '@/lib/format';
import { Sources } from '@/ui';
import { type Ring, shortName, STATUS } from './model';
import styles from './Caption.module.css';

/** Documentation pages describe a product; they are not the product, so the link says so. */
const isDocs = (url: string): boolean => /^https:\/\/docs\.runonflux\.com\//.test(url);

export interface CaptionEntry {
  item: EcosystemItem;
  ring: Ring;
}

/**
 * What the orbit is pointing at: the family, the name, the one line from the data and a link. Set
 * straight on the page, no card. Every product lives in one grid cell so the block never changes
 * height and nothing below it jumps; only the one being shown is visible, reachable and read out.
 * Anything that is not live yet says so in a word beside the family.
 */
export function Caption({ entries, shownId }: { entries: readonly CaptionEntry[]; shownId: string }) {
  return (
    <div className={styles.caption} role="region" aria-label="Selected product">
      {entries.map(({ item, ring }) => {
        const active = item.id === shownId;
        const planned = item.status === 'announced';
        return (
          <article
            key={item.id}
            className={styles.entry}
            data-active={active ? 'true' : 'false'}
            data-status={item.status}
            aria-hidden={active ? undefined : true}
            inert={!active}
          >
            <p className={styles.family}>
              {ring.name}
              {item.status !== 'live' ? (
                <>
                  <span className={styles.sep} aria-hidden="true">
                    {' · '}
                  </span>
                  <b>{STATUS[item.status].label}</b>
                </>
              ) : null}
            </p>
            <h3 className={styles.name}>{item.name}</h3>
            <p className={styles.line}>{stripPeriod(item.headline)}</p>
            <p className={styles.actions}>
              {item.url ? (
                <a className={styles.open} href={item.url} target="_blank" rel="noopener noreferrer">
                  {planned ? 'See the roadmap' : isDocs(item.url) ? `Read about ${shortName(item)}` : `Open ${shortName(item)}`}
                  <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span className="sr-only"> (Opens in a new tab)</span>
                </a>
              ) : null}
              <Sources items={item.sources} />
            </p>
          </article>
        );
      })}
    </div>
  );
}
