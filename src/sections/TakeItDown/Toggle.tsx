import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Hex } from './Hex';
import styles from './TakeItDown.module.css';

export interface ToggleProps {
  on: boolean;
  onChange: (on: boolean) => void;
  /** `crit` lights the hexagon in the alarm colour (chaos). */
  tone?: 'crit';
  children: ReactNode;
  className?: string;
}

/**
 * A switch that is just words and a hexagon: hollow when off, filled when on. A real
 * `role="switch"` button, 44 px tall for a thumb.
 */
export function Toggle({ on, onChange, tone, children, className }: ToggleProps) {
  return (
    <button type="button" role="switch" aria-checked={on} data-tone={tone} className={cn(styles.toggle, className)} onClick={() => onChange(!on)}>
      <Hex state={on ? 'up' : 'off'} className={styles.toggleHex} />
      <span>{children}</span>
    </button>
  );
}
