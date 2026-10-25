import { formatInt } from '@/lib/format';
import type { FluxLiveSnapshot } from '@/lib/live';
import { CountUp, Reveal, Sources, useIsPhone } from '@/ui';
import { HexCrowd } from './HexCrowd';
import { fluxStat, operatorCount, uniqueSources } from './model';
import styles from './Opening.module.css';

/**
 * The chapter's first picture: the number of operator identities, huge, beside a crowd that has one
 * hexagon for each. The words under it are the whole argument: these are the people, and the door is
 * open. No card, no caption bar.
 */
export function Opening({ live }: { live: FluxLiveSnapshot }) {
  const phone = useIsPhone();
  const operators = operatorCount(live);
  const sources = uniqueSources([fluxStat('operators')?.source]);

  return (
    <div className={styles.stage}>
      <Reveal className={styles.copy}>
        <p className={styles.number}>
          <CountUp value={operators} duration={1800} />
        </p>
        <p className={styles.what}>operator identities run nodes on Flux</p>
        <p className={styles.invite}>Anyone can be next</p>
        <Sources items={sources} className={styles.sources} />
      </Reveal>
      <HexCrowd
        count={operators ?? 0}
        center={phone ? [0.5, 0.5] : [0.56, 0.5]}
        label={operators != null ? `A crowd of ${formatInt(operators)} hexagons, one for each operator identity` : 'A crowd of hexagons, one for each operator identity'}
        className={styles.crowd}
      />
    </div>
  );
}
