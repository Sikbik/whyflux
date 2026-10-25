import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './Switch.module.css';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** The visible label. */
  children: ReactNode;
  /** Tone of the lit state: `crit` for "chaos mode", `ok` for "auto heal". Default accent. */
  tone?: 'ok' | 'warn' | 'crit';
  disabled?: boolean;
  className?: string;
}

/** An on/off switch with a visible label (a role=switch button). */
export function Switch({ checked, onChange, children, tone, disabled, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      data-tone={tone}
      className={cn(styles.switch, className)}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.track} aria-hidden="true">
        <span className={styles.knob} />
      </span>
      <span className={styles.label}>{children}</span>
    </button>
  );
}
