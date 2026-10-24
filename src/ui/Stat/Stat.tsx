import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import type { FluxLiveSnapshot } from '@/lib/live';
import type { Source, Stat as StatData } from '@/data/types';
import { Chip } from '../Chip/Chip';
import { FreshnessChip } from '../Chip/FreshnessChip';
import { CountUp } from '../CountUp/CountUp';
import { Sources } from '../Sources/Sources';
import styles from './Stat.module.css';

export interface StatProps {
  /** A sourced stat straight from src/data (fluxStats). Fills label, value, affixes, asOf, source. */
  stat?: StatData;
  label?: ReactNode;
  value?: number | null;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  format?: 'number' | 'compact';
  /** One quiet line under the number. */
  caption?: ReactNode;
  /** For numbers fed by useFluxLive(): shows the honest LIVE / SNAPSHOT / SYNCING chip. */
  status?: FluxLiveSnapshot['status'];
  fetchedAt?: string;
  /** For static numbers: the date it was true and where it came from. */
  asOf?: string;
  source?: Source;
  /** md 36 px numbers, lg 56 px, xl up to 128 px (the proof wall). */
  size?: 'md' | 'lg' | 'xl';
  align?: 'start' | 'center';
  className?: string;
}

/**
 * A big number: an animated tabular value, its name in quiet sentence case, and honest provenance as
 * plain text (live, snapshot, or "As of" with a source link). No hardcoded figures: pass a `stat`
 * from src/data or a value from useFluxLive().
 *
 *   <Stat label="Nodes online" value={snap.totalNodes} status={snap.status} fetchedAt={snap.fetchedAt} size="xl" />
 *   <Stat stat={fluxStats[0]} />
 */
export function Stat({
  stat,
  label,
  value,
  prefix,
  suffix,
  decimals,
  format = 'number',
  caption,
  status,
  fetchedAt,
  asOf,
  source,
  size = 'lg',
  align = 'start',
  className,
}: StatProps) {
  const v = stat ? stat.value : value;
  const lbl = stat ? stat.label : label;
  const pre = stat ? stat.prefix : prefix;
  const suf = stat ? stat.suffix : suffix;
  const dec = stat ? stat.decimals : decimals;
  const when = stat ? stat.asOf : asOf;
  const src = stat ? stat.source : source;
  const cap = stat?.note ?? caption;

  return (
    <div className={cn(styles.stat, className)} data-size={size} data-align={align}>
      <div className={styles.value}>
        <CountUp value={v} prefix={pre} suffix={suf} decimals={dec} format={format} />
      </div>
      <div className={styles.head}>
        <span className={styles.label}>{lbl}</span>
        {status ? (
          <FreshnessChip status={status} fetchedAt={fetchedAt} />
        ) : when ? (
          <Chip tone="neutral" size="sm">
            As of {formatDate(when)}
          </Chip>
        ) : null}
      </div>
      {cap ? <p className={styles.caption}>{cap}</p> : null}
      {src && !status ? <Sources items={[src]} label="Source" className={styles.src} /> : null}
    </div>
  );
}
