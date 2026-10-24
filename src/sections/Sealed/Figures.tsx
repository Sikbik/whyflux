import type { ReactNode } from 'react';
import type { Source } from '@/data/types';
import { formatDate } from '@/lib/format';
import { useFluxLive } from '@/lib/live';
import { CountUp, Reveal, Sources } from '@/ui';
import { arcanePercent, statById } from './facts';
import styles from './Figures.module.css';

function Figure({
  value,
  unit,
  asOf,
  sources,
  offset = false,
  children,
}: {
  value: number | null | undefined;
  unit: string;
  asOf: string | undefined;
  sources: Source[] | undefined;
  /** Sits a little lower than its neighbour: the pair is staggered, not a grid. */
  offset?: boolean;
  children: ReactNode;
}) {
  return (
    <Reveal className={styles.fig} data-offset={offset || undefined}>
      <p className={styles.big}>
        <CountUp value={value} />
        {value == null ? null : <span className={styles.unit}>{unit}</span>}
      </p>
      <p className={styles.cap}>{children}</p>
      <p className={styles.meta}>
        {asOf ? <span>As of {formatDate(asOf)}</span> : null}
        <Sources items={sources} label="Source" />
      </p>
    </Reveal>
  );
}

/**
 * Two figures, set large on the page: how much of the network runs ArcaneOS, and how many apps are private.
 * Each claim carries its own scope ("of nodes run ArcaneOS", "of registered apps are private"), a quiet
 * "as of" date and its source. The share of nodes comes from the snapshot counts when they exist.
 */
export function Figures() {
  const live = useFluxLive();
  const arcane = statById('arcane');
  const priv = statById('privateApps');
  const share = arcanePercent(live);
  const arcaneAsOf = live.snapshotAt ?? arcane?.asOf;

  return (
    <div className={styles.figures}>
      <Figure value={share} unit="%" asOf={arcaneAsOf} sources={arcane ? [arcane.source] : undefined}>
        of nodes run <b>ArcaneOS</b>, where the machine&apos;s owner never gets root
      </Figure>
      {priv ? (
        <Figure value={priv.value} unit={priv.suffix ?? '%'} offset asOf={priv.asOf} sources={[priv.source]}>
          of registered apps are <b>private</b>: secrets stay off the public record, and they run only on hardened nodes
        </Figure>
      ) : null}
    </div>
  );
}
