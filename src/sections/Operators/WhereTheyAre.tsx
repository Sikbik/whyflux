import { useMemo } from 'react';
import { formatDate } from '@/lib/format';
import { countryCounts, type FluxLiveSnapshot } from '@/lib/live';
import { CountUp, Reveal, Sources } from '@/ui';
import { NodeMap } from './NodeMap';
import { concentrationStat, countryCount, fluxStat, networkCount, type TierFilter, uniqueSources } from './model';
import beat from './Operators.module.css';
import { BeatHead, LiveMark } from './parts';
import { TierToggle } from './TierToggle';
import styles from './WhereTheyAre.module.css';

export interface WhereTheyAreProps {
  live: FluxLiveSnapshot;
  tier: TierFilter;
  onTier: (tier: TierFilter) => void;
}

/**
 * The map. The headline is the breadth (countries, networks), the picture is every cluster of nodes
 * on a dotted world, and the only control is the tier filter. The positions are IP geolocation of
 * each node: that, and the date, live in the sources.
 */
export function WhereTheyAre({ live, tier, onTier }: WhereTheyAreProps) {
  const countries = countryCount(live);
  const networks = networkCount(live);
  const counts = useMemo(() => countryCounts(live), [live]);
  const sources = uniqueSources([fluxStat('countries')?.source, concentrationStat('distinct-asns')?.source]);
  const hasCounts = live.totalNodes > 0;

  return (
    <div className={beat.beat} role="group" aria-labelledby="ops-map-title">
      <BeatHead id="ops-map-title">
        Running in <b><CountUp value={countries} duration={1400} /></b> countries
        {networks != null ? (
          <>
            , on <b><CountUp value={networks} duration={1400} /></b> networks
          </>
        ) : null}
      </BeatHead>

      <Reveal className={styles.bar}>
        <TierToggle
          value={tier}
          onChange={onTier}
          counts={hasCounts ? { all: live.totalNodes, cumulus: live.tiers.cumulus, nimbus: live.tiers.nimbus, stratus: live.tiers.stratus } : undefined}
        />
        <span className={styles.meta}>
          <LiveMark live={live} />
          <Sources
            items={sources}
            title={live.snapshotAt ? `Placed by IP address, positions as of ${formatDate(live.snapshotAt)}` : 'Placed by the IP address each node answers from'}
          />
        </span>
      </Reveal>

      <Reveal className={styles.bleed}>
        <NodeMap points={live.points} counts={counts} tier={tier} />
      </Reveal>
    </div>
  );
}
