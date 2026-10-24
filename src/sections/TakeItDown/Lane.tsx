import { RotateCcw } from 'lucide-react';
import { type ReactNode, useRef } from 'react';
import { HexBullet } from '@/ui';
import { clock, laneDomId, plural, realTime } from './format';
import { Field } from './Field';
import type { FieldRenderer } from './render/draw';
import type { Domain } from './render/layout';
import { type Sim, STATUS } from './sim/engine';
import { useLaneVersion } from './useSim';
import styles from './TakeItDown.module.css';

export interface LaneProps {
  sim: Sim;
  lane: number;
  domain: Domain;
  renderers: Set<FieldRenderer>;
  redraw: () => void;
  reduced: boolean;
  /** Called after a redeploy by hand (reduced motion moves the clock). */
  onRedeploy: (lane: number) => void;
  /** What sits under the narration: the hexagons and the lane's own lever. */
  children: ReactNode;
}

const TITLES = ['Traditional hosting', 'Flux'] as const;

/** The line a lane shows before anything has happened: what the app is standing on. */
function idleLine(L: Sim['lanes'][number]): string {
  if (L.kind === 'cloud') {
    return L.nSlots === 1 ? 'One server in one data center' : `${L.nSlots} servers in ${L.nSlots} data centers of one region`;
  }
  return `${L.nSlots} ${plural(L.nSlots, 'copy', 'copies')} on independent nodes`;
}

const TONES = ['info', 'work', 'ok', 'loss'] as const;

/**
 * One app on the stage, with no frame around it: its name and the word for how it is doing, the
 * failures it has taken, the map it lives on, one line of what just happened, and its own lever.
 * The lane wears the brand accent (Flux) or steel (traditional hosting) through `data-mood`.
 */
export function Lane({ sim, lane, domain, renderers, redraw, reduced, onRedeploy, children }: LaneProps) {
  const version = useLaneVersion(sim, lane);
  const L = sim.lanes[lane]!;
  const mood = useRef<HTMLDivElement>(null);
  const title = TITLES[lane] ?? 'App';
  const cold = L.kind !== 'flux';
  const down = L.status === STATUS.DOWN;
  const failing = L.status === STATUS.FAILING;
  void version;

  const fallen = L.fellAtFailures >= 0;
  const took = fallen ? L.fellAtFailures : L.failures;
  const struck = took > 0 || fallen;
  const word = down ? 'Down' : failing ? 'Failing over' : 'Serving';
  const held = L.status === STATUS.SERVING && !fallen && L.firstStrikeT >= 0 ? sim.t - L.firstStrikeT : 0;

  const line = L.log[0];
  const noun = plural(took, 'failure', 'failures');

  return (
    <div
      ref={mood}
      id={laneDomId(lane)}
      className={styles.lane}
      data-mood={cold ? 'cold' : undefined}
      data-lane={L.kind}
      data-status={down ? 'down' : failing ? 'failing' : 'serving'}
    >
      <header className={styles.head}>
        <h3 className={styles.name}>{title}</h3>
        <p className={styles.status}>
          <HexBullet size={8} pulse={!down && !failing} />
          <span className={styles.word}>{word}</span>
          {held >= 1 ? <span className={styles.held}>held for {clock(held)}</span> : null}
        </p>
        <p className={styles.score} data-on={struck || undefined} data-fell={fallen || undefined}>
          <span key={took} className={styles.num}>
            {took}
          </span>
          <span className={styles.unit}>{!struck ? 'failures' : fallen ? `${noun} to fall` : `${noun} so far`}</span>
        </p>
      </header>

      <div className={styles.view} data-down={down || undefined}>
        <Field sim={sim} lane={lane} domain={domain} renderers={renderers} moodRef={mood} reduced={reduced} redraw={redraw} label={title} />
        {down ? (
          <div className={styles.down}>
            <span className={styles.downClock}>{clock(sim.t - L.downSince)}</span>
            {L.kind === 'flux' && L.downReal > 30 ? <span className={styles.downReal}>about {realTime(L.downReal)} in real time</span> : null}
          </div>
        ) : null}
        {L.needsOwner && down ? (
          <div className={styles.redeploy}>
            <button type="button" className={styles.textButton} onClick={() => onRedeploy(lane)}>
              <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />
              Redeploy by hand
            </button>
          </div>
        ) : null}
      </div>

      <ol className={styles.line} role="log" aria-live="polite" aria-relevant="additions" aria-label={`${title}: what happened`}>
        {line ? (
          <li key={line.id} className={styles.lineItem} data-tone={TONES[line.tone] ?? 'info'}>
            <HexBullet size={7} />
            <span>{line.text}</span>
          </li>
        ) : (
          <li key="idle" className={styles.lineItem} data-tone="idle">
            <HexBullet size={7} outline />
            <span>{idleLine(L)}</span>
          </li>
        )}
      </ol>

      <div className={styles.deck}>{children}</div>
    </div>
  );
}
