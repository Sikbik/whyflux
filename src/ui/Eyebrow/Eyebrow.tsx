import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './Eyebrow.module.css';

export interface EyebrowProps {
  /** @deprecated No effect. Chapter numbers ("03 / ...") were removed from the page. */
  num?: string;
  children: ReactNode;
  /** A small breathing dot before the words: for "live" kickers. Off by default. */
  live?: boolean;
  className?: string;
}

/**
 * The quiet line above a headline: sentence case, one accent colour, nothing else. No bullet, no
 * number, no tracked uppercase mono. Skip it whenever the headline already says it.
 */
export function Eyebrow({ num: _num, children, live = false, className }: EyebrowProps) {
  return (
    <p className={cn(styles.eyebrow, className)}>
      {live ? <span className={styles.dot} aria-hidden="true" /> : null}
      <span>{children}</span>
    </p>
  );
}
