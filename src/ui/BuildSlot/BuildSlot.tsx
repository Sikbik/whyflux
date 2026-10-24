import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './BuildSlot.module.css';

export interface BuildSlotProps {
  /** Where the spec lives, e.g. "docs/DESIGN.md, section 05". */
  spec: string;
  /** One line on what goes here. */
  children: ReactNode;
  className?: string;
}

/**
 * A placeholder for a section that has not been built yet: a dashed blueprint frame that says what
 * goes here and where its spec is. Delete it when the section is real. (It exists so the whole
 * page structure shows from day one.)
 */
export function BuildSlot({ spec, children, className }: BuildSlotProps) {
  return (
    <div className={cn(styles.slot, className)} role="note">
      <span className={styles.tag}>Under construction</span>
      <p className={styles.text}>{children}</p>
      <p className={styles.spec}>Spec: {spec}</p>
    </div>
  );
}
