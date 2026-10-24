import { useMemo } from 'react';
import type { OperatorAccessRow } from '@/data/types';
import { Reveal, Section, SectionHeader } from '@/ui';
import { Figures } from './Figures';
import { blockedOnArcane, toAttempts } from './model';
import { Receipts } from './Receipts';
import { Seat } from './Seat';
import styles from './SealedView.module.css';

export interface SealedViewProps {
  rows: readonly OperatorAccessRow[];
}

/**
 * Chapter 07, from its data. One big interaction (the operator's seat: try to get at an app on a legacy
 * node and on an ArcaneOS node), two large figures, and the receipts behind a toggle. The seat plays the
 * attempts an ArcaneOS node turns away; the receipts hold the same rows (the attempts an ArcaneOS node turns away). Where the data is
 * empty the chapter says so instead of inventing rows.
 */
export function SealedView({ rows }: SealedViewProps) {
  const attempts = useMemo(() => toAttempts(rows), [rows]);
  const played = useMemo(() => blockedOnArcane(attempts), [attempts]);

  const header = (
    <SectionHeader
      num="07"
      eyebrow="ArcaneOS and privacy"
      title="Your app, **sealed**"
      lede="Anyone can run a node, and on ArcaneOS the operator gets no root, no shell and no way into your files, logs or secrets"
      ghost={false}
      className={styles.header}
    />
  );

  return (
    <Section id="sealed" label="Your app, sealed" width="wide" pad="tight" className={styles.sealed}>
      {played.length > 0 ? (
        <Seat rows={played} header={header} />
      ) : (
        <>
          {header}
          <Reveal>
            <p className={styles.pending}>The comparison of what a node operator can reach is being verified</p>
          </Reveal>
        </>
      )}

      <Figures />
      <Receipts rows={played} />
    </Section>
  );
}
