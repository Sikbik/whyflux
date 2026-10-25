import { HexBullet } from '@/ui';
import { laneDomId } from './format';
import { STATUS, type Sim } from './sim/engine';
import { useLaneVersion } from './useSim';
import styles from './TakeItDown.module.css';

const NAMES = ['Traditional', 'Flux'] as const;
const FULL = ['Traditional hosting', 'Flux'] as const;

function Cell({ sim, lane, reduced }: { sim: Sim; lane: number; reduced: boolean }) {
  useLaneVersion(sim, lane);
  const status = sim.lanes[lane]!.status;
  const word = status === STATUS.DOWN ? 'Down' : status === STATUS.FAILING ? 'Failing over' : 'Serving';
  const jump = () =>
    document.getElementById(laneDomId(lane))?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  return (
    <button
      type="button"
      className={styles.stripCell}
      data-status={status === STATUS.DOWN ? 'down' : status === STATUS.FAILING ? 'failing' : 'serving'}
      onClick={jump}
      aria-label={`${FULL[lane]}: ${word.toLowerCase()}, jump to it`}
    >
      <span className={styles.stripName}>
        <HexBullet size={7} />
        {NAMES[lane]}
      </span>
      <span className={styles.stripWord}>{word}</span>
    </button>
  );
}

/**
 * Phones only: the two lanes are stacked, so the verdict would scroll out of sight. This strip
 * sticks under the nav while the stage is on screen and keeps both statuses together; a tap
 * jumps to the lane.
 */
export function LaneStrip({ sim, reduced }: { sim: Sim; reduced: boolean }) {
  return (
    <div className={styles.strip} role="group" aria-label="Where each app stands">
      {[0, 1].map((lane) => (
        <Cell key={lane} sim={sim} lane={lane} reduced={reduced} />
      ))}
    </div>
  );
}
