import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import type { FluxLiveSnapshot } from '@/lib/live';
import { Reveal } from '@/ui';
import styles from './Operators.module.css';

export interface BeatHeadProps {
  /** The id of the h3, so the beat can name itself. */
  id: string;
  /** A mixed-weight line: the key words go in `<b>`. No periods anywhere in it. */
  children: ReactNode;
  className?: string;
}

/** The heading every beat starts with: one light line with its key words in bold. */
export function BeatHead({ id, children, className }: BeatHeadProps) {
  return (
    <Reveal as="h3" id={id} className={cn(styles.beatTitle, className)}>
      {children}
    </Reveal>
  );
}

/**
 * "Live" with a small pulse when the numbers come from the network, and a quiet "as of" date when
 * they come from the bundled snapshot. Never a pill: just the word, in its status colour.
 */
export function LiveMark({ live }: { live: FluxLiveSnapshot }) {
  if (live.status === 'live') {
    return (
      <span className={styles.live}>
        <i className={styles.pulse} aria-hidden="true" />
        Live
      </span>
    );
  }
  const day = live.snapshotAt ?? live.fetchedAt;
  return <span className={styles.asOf}>{live.status === 'loading' || !day ? 'Syncing' : `As of ${formatDate(day)}`}</span>;
}
