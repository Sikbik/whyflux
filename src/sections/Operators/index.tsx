import { useCallback } from 'react';
import { useFluxLive } from '@/lib/live';
import { useUrlParam } from '@/lib/urlState';
import { Section, SectionHeader } from '@/ui';
import { Closing } from './Closing';
import { Earn } from './Earn';
import { parseTier, type TierFilter } from './model';
import { Opening } from './Opening';
import styles from './Operators.module.css';
import { Tiers } from './Tiers';
import { WhereTheyAre } from './WhereTheyAre';

/**
 * The people who run the network, in five short beats: how many there are, the three sizes of node (and
 * whether your own machine could be one), where they all are, how a node gets paid, and the way in. The
 * tier filter on the map lives in the URL (`?tier=`) because it is the one state worth sharing.
 * Spec: docs/DESIGN.md (Restyle v2 and storyboard 06).
 */
export function Operators() {
  const live = useFluxLive();
  const [tierParam, setTierParam] = useUrlParam('tier');
  const tier: TierFilter = parseTier(tierParam);
  const setTier = useCallback((next: TierFilter) => setTierParam(next === 'all' ? null : next), [setTierParam]);

  return (
    <Section id="operators" label="The people who run the network" width="wide" className={styles.root}>
      <SectionHeader eyebrow="Community node operators" title="The network is *people*" />
      <div className={styles.beats}>
        <Opening live={live} />
        <Tiers />
        <WhereTheyAre live={live} tier={tier} onTier={setTier} />
        <Earn live={live} />
        <Closing />
      </div>
    </Section>
  );
}
