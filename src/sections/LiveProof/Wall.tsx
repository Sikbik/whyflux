import { fluxStats } from '@/data/flux';
import type { Source } from '@/data/types';
import { formatDate } from '@/lib/format';
import { formatStorageTb, type FluxLiveSnapshot, liveStatValue } from '@/lib/live';
import { CountUp, Reveal, Sources } from '@/ui';
import { freshnessOf } from './freshness';
import { Pulse } from './Pulse';
import styles from './Wall.module.css';

interface Cell {
  id: string;
  label: string;
  value: number | undefined;
  /** A small unit set after the number (TB, PB, M). */
  unit?: string;
  decimals?: number;
  caption: string;
  source?: Source;
  /** The first three are the loud ones. */
  size: 'big' | 'small';
}

const stat = (id: string) => fluxStats.find((s) => s.id === id);

/** The eight numbers, each read live when the live layer has it and from the sourced snapshot when not. */
function cells(live: FluxLiveSnapshot): Cell[] {
  const read = (id: string) => liveStatValue(id, live) ?? stat(id)?.value;
  const storage = live.totalSsdTb !== undefined ? formatStorageTb(live.totalSsdTb) : undefined;
  const storageStat = stat('storage');
  const base: Omit<Cell, 'source'>[] = [
    { id: 'nodes', label: 'Nodes online', value: read('nodes'), caption: 'Confirmed on chain', size: 'big' },
    { id: 'countries', label: 'Countries', value: read('countries'), caption: 'By the IP location of each node', size: 'big' },
    { id: 'apps', label: 'Apps running now', value: read('apps'), caption: 'Distinct apps with a live copy', size: 'big' },
    { id: 'operators', label: 'Operator identities', value: read('operators'), caption: 'Flux IDs that run nodes', size: 'small' },
    { id: 'cores', label: 'CPU cores', value: read('cores'), caption: 'Logical cores on reachable nodes', size: 'small' },
    { id: 'ram', label: 'RAM', value: read('ram'), unit: 'TB', caption: 'Benchmarked memory', size: 'small' },
    {
      id: 'storage',
      label: 'SSD storage',
      value: storage ? storage.value : storageStat?.value,
      unit: storage ? storage.unit : 'PB',
      decimals: storage ? (storage.unit === 'PB' ? 2 : storage.value >= 100 ? 0 : 1) : 2,
      caption: 'Benchmarked SSD and NVMe',
      size: 'small',
    },
    { id: 'collateral', label: 'FLUX locked as collateral', value: read('collateral'), unit: 'M', decimals: 1, caption: 'Locked to run nodes', size: 'small' },
  ];
  return base.map((c) => ({ ...c, source: stat(c.id)?.source }));
}

/**
 * Beat A: the proof wall. Eight numbers set straight on the page, the first three monumental. A
 * pulse beside a label means that number is read live from the network; a number without one comes
 * from the sourced snapshot (per number, not per page: running apps and operator identities are
 * snapshot-only even while the node count is counting live), and one quiet sentence under the wall
 * says so. Where each number comes from is one tap away, in one list.
 */
export function Wall({ live }: { live: FluxLiveSnapshot }) {
  const list = cells(live);
  const fresh = new Map(list.map((c) => [c.id, freshnessOf(c.id, live).status] as const));
  const anyLive = list.some((c) => fresh.get(c.id) === 'live');
  const anySnapshot = list.some((c) => fresh.get(c.id) === 'snapshot');
  const snapshotAt = anySnapshot ? (live.snapshotAt ?? live.fetchedAt) : undefined;
  const sources = [...new Map(list.flatMap((c) => (c.source ? [c.source] : [])).map((s) => [s.url, s] as const)).values()];

  return (
    <Reveal from="up" className={styles.wall}>
      <dl className={styles.grid} aria-label="The network right now">
        {list.map((c) => {
          const status = fresh.get(c.id);
          return (
            <div key={c.id} className={styles.stat} data-size={c.size}>
              <dt className={styles.label}>
                {status === 'live' ? <Pulse /> : null}
                <span>{c.label}</span>
                <span className="sr-only">{status === 'live' ? ', live' : status === 'snapshot' ? ', from a snapshot' : ''}</span>
              </dt>
              <dd className={styles.value}>
                <CountUp value={c.value} decimals={c.decimals} duration={c.size === 'big' ? 2000 : 1600} />
                {c.unit ? <span className={styles.unit}>{c.unit}</span> : null}
              </dd>
              <dd className={styles.caption}>{c.caption}</dd>
            </div>
          );
        })}
      </dl>
      <p className={styles.note}>
        {snapshotAt
          ? anyLive
            ? `A pulse means live from the network, the rest come from a snapshot taken ${formatDate(snapshotAt)}`
            : `Figures from a snapshot taken ${formatDate(snapshotAt)}, live ones pulse once the network answers`
          : anyLive
            ? 'A pulse means live from the network'
            : null}
        {snapshotAt || anyLive ? <span className={styles.dot}> · </span> : null}
        <Sources items={sources} label="Sources" />
      </p>
    </Reveal>
  );
}
