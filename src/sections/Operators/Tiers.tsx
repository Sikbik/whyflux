import { RotateCcw, ScanLine } from 'lucide-react';
import { type CSSProperties, useCallback, useState } from 'react';
import { nodeTiers } from '@/data/flux';
import type { NodeTier } from '@/data/types';
import { ArtPlate, Button, CountUp, Reveal, Sources } from '@/ui';
import { BROWSER_SOURCES, concentrationStat, deviceCaption, kindShare, readThreads, roughShare, threadsOf, uniqueSources } from './model';
import beat from './Operators.module.css';
import { BeatHead } from './parts';
import styles from './Tiers.module.css';

/**
 * Three sizes of node, and whether yours could be one. The emblems do the talking: one prism, two,
 * three and a spire, all standing on one floor. Each tier wears its colour in its name only. Under
 * each, a hexagon per thread it asks for; "Check this device" lights the ones this browser has.
 * Threads are all a browser can read, so that is all it says (the node's benchmark reads the rest).
 */
export function Tiers() {
  const [threads, setThreads] = useState<number | undefined>(undefined);
  const [checked, setChecked] = useState(false);
  const [lit, setLit] = useState(false);
  const home = kindShare('isp');
  const sources = uniqueSources(
    nodeTiers.flatMap((t) => t.sources),
    [concentrationStat('datacenter-share')?.source],
    BROWSER_SOURCES,
  );

  const check = useCallback(() => {
    setThreads(readThreads());
    setChecked(true);
    setLit(false);
    // Two frames: the unlit rows paint first, so the lighting has something to run from.
    requestAnimationFrame(() => requestAnimationFrame(() => setLit(true)));
  }, []);

  return (
    <div className={beat.beat} role="group" aria-labelledby="ops-tiers-title">
      <BeatHead id="ops-tiers-title">
        Three sizes of <b>node</b>, one open door
      </BeatHead>

      <ul className={styles.row} role="list">
        {nodeTiers.map((tier, i) => (
          <Tier key={tier.id} tier={tier} index={i} threads={threads} lit={lit} />
        ))}
      </ul>

      <Reveal className={styles.check}>
        {home != null ? (
          <p className={styles.community}>
            <b>{roughShare(home)}</b> of the nodes run on home and business internet
          </p>
        ) : (
          <span />
        )}
        <div className={styles.action}>
          <div className={styles.controls}>
            <Button
              variant="secondary"
              size="lg"
              icon={checked ? <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" /> : <ScanLine size={18} strokeWidth={1.75} aria-hidden="true" />}
              onClick={check}
            >
              {checked ? 'Check again' : 'Check this device'}
            </Button>
            <Sources items={sources} />
          </div>
          <p className={styles.result} aria-live="polite">
            {checked ? deviceCaption(threads, nodeTiers) : ''}
          </p>
          <p className={styles.then}>{checked ? 'Disk and connection are read by the node benchmark' : ''}</p>
        </div>
      </Reveal>
    </div>
  );
}

interface TierProps {
  tier: NodeTier;
  index: number;
  threads: number | undefined;
  lit: boolean;
}

function Tier({ tier, index, threads, lit }: TierProps) {
  const need = threadsOf(tier);
  const on = lit && threads != null ? Math.min(threads, need) : 0;

  return (
    <li className={styles.col} data-tier={tier.id} style={{ '--col': index } as CSSProperties}>
      <div className={styles.stage}>
        <div className={styles.emblem}>
          <Reveal scale delay={index * 110}>
            {/* The emblem carries no data of its own: the name beside it says what it is. */}
            <ArtPlate src={`emblem-${tier.id}`} mode="flow" alt="" />
          </Reveal>
        </div>
      </div>

      <Reveal delay={150 + index * 110} className={styles.text}>
        <h4 className={styles.name}>{tier.name}</h4>
        <p className={styles.collateral}>
          <CountUp value={tier.collateral} duration={1400} className={styles.collateralValue} />
          <span className={styles.unit}>FLUX collateral</span>
        </p>
        <p className={styles.spec}>
          <span>{need} threads</span>
          <span>{tier.ramGb} GB RAM</span>
          <span>{tier.ssdGb} GB SSD</span>
        </p>
        <div className={styles.hexes} aria-hidden="true">
          {Array.from({ length: need }, (_, i) => (
            <span key={i} className={styles.hex} data-on={i < on ? 'true' : undefined} style={{ '--i': i } as CSSProperties} />
          ))}
        </div>
      </Reveal>
    </li>
  );
}
