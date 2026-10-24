import type { ReactNode } from 'react';
import { Reveal } from '@/ui';
import type { Kind } from './model';
import styles from './Closing.module.css';

interface ClosingProps {
  /** Shows that kind of incident on the stage. */
  onKind: (k: Kind) => void;
}

/**
 * The chapter's one line, and the way back to the stage: each noun is a way the cloud fails, and
 * pressing it shows those incidents. Links, not buttons, so the line wraps like plain text.
 */
export function Closing({ onKind }: ClosingProps) {
  const noun = (kind: Kind, word: ReactNode) => (
    <a
      href="#fragile-stage"
      className={styles.noun}
      onClick={(e) => {
        e.preventDefault();
        onKind(kind);
      }}
    >
      {word}
    </a>
  );
  return (
    <Reveal className={styles.closing}>
      <p className={styles.line}>
        <span className={styles.part}>One {noun('outage', 'company')},</span>
        <span className={styles.part}>one {noun('physical', 'region')},</span>
        <span className={styles.part}>one {noun('deplatforming', 'switch')}</span>
      </p>
    </Reveal>
  );
}
