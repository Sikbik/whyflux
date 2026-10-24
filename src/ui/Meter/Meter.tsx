import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { clamp01 } from '@/lib/math';
import styles from './Meter.module.css';

export interface MeterProps {
  /** 0..1. */
  value: number;
  label?: ReactNode;
  /** The reading at the right, e.g. "99.4%". */
  reading?: ReactNode;
  tone?: 'accent' | 'ok' | 'warn' | 'crit';
  /** Tick marks along the bar. Default 20. */
  ticks?: number;
  /** Accessible reading. Defaults to the value as a percentage. */
  'aria-valuetext'?: string;
  className?: string;
}

/** A thin instrument bar with tick marks: uptime, share, score. */
export function Meter({ value, label, reading, tone = 'accent', ticks = 20, className, ...aria }: MeterProps) {
  const v = clamp01(value);
  return (
    <div className={cn(styles.meter, className)} data-tone={tone === 'accent' ? undefined : tone}>
      {label || reading ? (
        <div className={styles.row}>
          <span>{label}</span>
          <span className={styles.reading}>{reading}</span>
        </div>
      ) : null}
      <div
        className={styles.bar}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={Number(v.toFixed(3))}
        aria-valuetext={aria['aria-valuetext'] ?? `${Math.round(v * 100)} percent`}
        style={{ '--ticks': ticks } as CSSProperties}
      >
        <span className={styles.fill} style={{ transform: `scaleX(${v})` }} />
        <span className={styles.ticks} aria-hidden="true" />
      </div>
    </div>
  );
}
