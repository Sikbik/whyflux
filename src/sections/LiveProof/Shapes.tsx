import { type CSSProperties, useRef } from 'react';
import { fluxStats, nodeTiers } from '@/data/flux';
import { formatPercent } from '@/lib/format';
import {
  countryCounts,
  countryFlag,
  countryName,
  type FluxLiveSnapshot,
  formatInt,
  liveStatValue,
  TIER_IDS,
  tierShares,
} from '@/lib/live';
import { CountUp, HexGauge, Reveal, Sources, useInView, useIsPhone } from '@/ui';
import styles from './Shapes.module.css';

const stat = (id: string) => fluxStats.find((s) => s.id === id);
const tierName = (id: string) => nodeTiers.find((t) => t.id === id)?.name ?? id;

/**
 * Beat C: the shape of the network, set on the page. Three tiers as one bar of solid colour with the
 * names inside it, the countries the nodes are in, and two shares worth knowing. No panels: three
 * short headings and what they head.
 */
export function Shapes({ live }: { live: FluxLiveSnapshot }) {
  const root = useRef<HTMLDivElement>(null);
  const seen = useInView(root, { once: true, threshold: 0.15 });
  const phone = useIsPhone();

  const shares = tierShares(live);
  const tierTotal = live.tiers.cumulus + live.tiers.nimbus + live.tiers.stratus;
  const tierSummary = TIER_IDS.map((id) => `${tierName(id)} ${formatPercent(shares[id] * 100)}`).join(', ');

  const countries = countryCounts(live, phone ? 6 : 8);
  const top = countries[0]?.nodes ?? 1;

  const redundancy = liveStatValue('redundancy', live) ?? stat('redundancy')?.value;
  const arcane =
    live.arcaneNodes !== undefined && live.totalNodes > 0
      ? Math.round((live.arcaneNodes / live.totalNodes) * 100)
      : stat('arcane')?.value;
  const shareSources = [stat('redundancy')?.source, stat('arcane')?.source].filter((s) => s !== undefined);

  return (
    <div ref={root} className={styles.shapes} data-seen={seen ? 'true' : 'false'}>
      {tierTotal > 0 ? (
        <Reveal from="up" className={styles.tiers}>
          <div className={styles.head}>
            <h3 className={styles.title}>Nodes by tier</h3>
            {stat('nodes')?.source ? <Sources items={[stat('nodes')!.source]} label="Source" /> : null}
          </div>
          <div className={styles.bar} role="img" aria-label={`Share of nodes by tier: ${tierSummary}`}>
            {TIER_IDS.map((id) => (
              <div key={id} className={styles.seg} data-tier={id} style={{ '--share': shares[id] } as CSSProperties}>
                <span className={styles.segName}>{tierName(id)}</span>
                <span className={styles.segCount}>{formatInt(live.tiers[id])}</span>
                <span className={styles.segShare}>{formatPercent(shares[id] * 100)}</span>
              </div>
            ))}
          </div>
        </Reveal>
      ) : null}

      <div className={styles.pair}>
        <Reveal from="up" delay={90} className={styles.countries}>
          <div className={styles.head}>
            <h3 className={styles.title}>Where the nodes are</h3>
            {stat('countries')?.source ? <Sources items={[stat('countries')!.source]} label="Source" /> : null}
          </div>
          {countries.length > 0 ? (
            <ol className={styles.rows}>
              {countries.map((c, i) => (
                <li key={c.code} className={styles.row} style={{ '--w': c.nodes / top, '--d': `${i * 60}ms` } as CSSProperties}>
                  <span className={styles.flag} aria-hidden="true">
                    {countryFlag(c.code)}
                  </span>
                  <span className={styles.name}>{countryName(c.code)}</span>
                  <span className={styles.track} aria-hidden="true">
                    <i />
                  </span>
                  <span className={styles.count}>{formatInt(c.nodes)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.empty}>Country counts arrive with the next refresh</p>
          )}
        </Reveal>

        <Reveal from="up" delay={160} className={styles.shares}>
          <div className={styles.head}>
            <h3 className={styles.title}>Two shares worth knowing</h3>
            {shareSources.length > 0 ? <Sources items={shareSources} label="Sources" /> : null}
          </div>
          <div className={styles.gauges}>
            {redundancy !== undefined ? (
              <div className={styles.gauge}>
                <HexGauge value={redundancy / 100} size={phone ? 128 : 168} aria-label={`${redundancy}% of running apps have two or more live copies`}>
                  <span className={styles.gaugeNum}>
                    <CountUp value={redundancy} suffix="%" />
                  </span>
                </HexGauge>
                <p className={styles.gaugeText}>of running apps have two or more live copies</p>
              </div>
            ) : null}
            {arcane !== undefined ? (
              <div className={styles.gauge}>
                <HexGauge value={arcane / 100} size={phone ? 128 : 168} aria-label={`${arcane}% of nodes run ArcaneOS`}>
                  <span className={styles.gaugeNum}>
                    <CountUp value={arcane} suffix="%" />
                  </span>
                </HexGauge>
                <p className={styles.gaugeText}>of nodes run ArcaneOS</p>
              </div>
            ) : null}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
