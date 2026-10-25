import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { clamp01 } from '@/lib/math';
import styles from './HexGauge.module.css';

export interface HexGaugeProps {
  /** 0..1 fill. */
  value: number;
  /** Pixel size of the gauge. Default 112. */
  size?: number;
  /** What sits in the centre: a number, a word. */
  children?: ReactNode;
  /** A short name under the gauge, in quiet sentence case. */
  label?: ReactNode;
  tone?: 'accent' | 'ok' | 'warn' | 'crit' | 'cumulus' | 'nimbus' | 'stratus';
  /** Accessible reading, e.g. "Uptime 99 percent". */
  'aria-label'?: string;
  className?: string;
}

// A pointy-top hexagon path inscribed in a 100 x 100 box, starting at the top vertex.
const PATH = 'M50 3 L90.7 26.5 L90.7 73.5 L50 97 L9.3 73.5 L9.3 26.5 Z';

/** A hex gauge: a brand hexagon outline that fills clockwise from the top. */
export function HexGauge({ value, size = 112, children, label, tone = 'accent', className, ...aria }: HexGaugeProps) {
  const v = clamp01(value);
  const tier = tone === 'cumulus' || tone === 'nimbus' || tone === 'stratus' ? tone : undefined;
  const status = tone === 'ok' || tone === 'warn' || tone === 'crit' ? tone : undefined;
  return (
    <figure
      className={cn(styles.gauge, className)}
      data-tier={tier}
      data-tone={status}
      style={{ inlineSize: size }}
      role={aria['aria-label'] ? 'img' : undefined}
      aria-label={aria['aria-label']}
    >
      <div className={styles.dial} style={{ blockSize: size }}>
        <svg viewBox="0 0 100 100" className={styles.svg} aria-hidden="true">
          <path d={PATH} className={styles.track} pathLength={100} />
          <path d={PATH} className={styles.fill} pathLength={100} strokeDasharray={`${(v * 100).toFixed(2)} 100`} />
        </svg>
        <div className={styles.center}>{children}</div>
      </div>
      {label ? <figcaption className={styles.label}>{label}</figcaption> : null}
    </figure>
  );
}
