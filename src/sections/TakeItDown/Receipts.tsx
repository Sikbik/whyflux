import { ArrowUpRight } from 'lucide-react';
import { useMemo } from 'react';
import { features } from '@/data/flux';
import type { Source } from '@/data/types';
import { formatDate } from '@/lib/format';
import { Popover } from '@/ui';
import { approxMinutes } from './sim/engine';
import {
  CHECK_EVERY_S,
  CHECKS_TO_FALL,
  CLOUD,
  COPIES,
  FLUX_MAX_COPIES,
  FLUX_NODES,
  LOCATION_TTL_MIN,
  MINUTES_PER_SIM_S,
} from './sim/model';
import styles from './TakeItDown.module.css';

/** Every source behind the model, merged and deduplicated: Flux's own code and docs, and the live figure. */
function modelSources(extra: Source | undefined): Source[] {
  const all: Source[] = [];
  for (const id of ['self-healing', 'load-balancing', 'replicas', 'fault-domains']) {
    all.push(...(features.find((f) => f.id === id)?.sources ?? []));
  }
  if (extra) all.push(extra);
  const seen = new Map<string, Source>();
  for (const s of all) if (!seen.has(s.url)) seen.set(s.url, s);
  return [...seen.values()];
}

export interface ReceiptsProps {
  /** The live node positions were not available: the field shows a fixed set of countries. */
  illustrative: boolean;
  /** The provider sizes come from the live network. */
  orgs: boolean;
  /** The source of the "2+ copies" figure, to list with the rest. */
  statSource: Source | undefined;
}

/**
 * The details on demand: how the model counts time and where its numbers come from. One quiet
 * link under the stage opens it; nothing here is printed by default.
 */
export function Receipts({ illustrative, orgs, statSource }: ReceiptsProps) {
  const sources = useMemo(() => modelSources(statSource), [statSource]);
  return (
    <Popover trigger={<span>How this works</span>} label="How this works" placement="top" className={styles.receiptsTrigger} panelClassName={styles.receipts}>
      <ul className={styles.receiptsList} role="list">
        <li>
          Flux checks every copy every {CHECK_EVERY_S} s and stops sending traffic to one after {CHECKS_TO_FALL} failed checks, so traffic reroutes within
          seconds
        </li>
        <li>
          Lost copies are rebuilt automatically on other nodes: in minutes after a clean shutdown, within about {approxMinutes(LOCATION_TTL_MIN)} after a
          sudden loss; here the rebuild is sped up, 1 s is {MINUTES_PER_SIM_S} min
        </li>
        <li>An app on Flux can run up to {FLUX_MAX_COPIES} copies, the row here stops at {COPIES.max}</li>
        <li>Flux spreads copies across different providers by itself, for apps with replicated storage like this one</li>
        <li>
          {illustrative
            ? 'The live network was not available, so the nodes are a fixed set of countries'
            : orgs
              ? `${FLUX_NODES} nodes sampled from the live network: real countries and provider sizes, with the node to provider pairing drawn at random`
              : `${FLUX_NODES} nodes sampled from the live network: real countries, with the hosts drawn at random`}
        </li>
        <li>
          Traditional hosting here is one server in one data center of one region; spread over {CLOUD.zones} data centers it repairs itself inside the
          region, and when the whole region or company goes it waits for a redeploy by hand
        </li>
      </ul>
      <p className={styles.receiptsTitle}>Sources</p>
      <ul className={styles.receiptsSources} role="list">
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              <span>{s.label}</span>
              <ArrowUpRight size={13} strokeWidth={1.75} aria-hidden="true" />
              <span className="sr-only"> (Opens in a new tab)</span>
            </a>
            <span className={styles.receiptsDate}>accessed {formatDate(s.accessed)}</span>
          </li>
        ))}
      </ul>
    </Popover>
  );
}
