import { SkipForward } from 'lucide-react';
import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import type { NodeTierId, Source } from '@/data/types';
import { formatInt } from '@/lib/format';
import { CHAIN, type FluxLiveSnapshot, type PayoutCycle, payoutCycle } from '@/lib/live';
import { ArtPlate, Button, CountUp, HexBullet, Reveal, Sources, useActive, useInView, useReducedMotion } from '@/ui';
import styles from './Earn.module.css';
import {
  amountText,
  approxFlux,
  type ParallelLine,
  parallelAssetsLine,
  payoutRotationSources,
  proofOfNode,
  TIER_IDS,
  tierName,
  turnPay,
  turnParts,
  uniqueSources,
} from './model';
import beat from './Operators.module.css';
import { BeatHead } from './parts';

/** Places in each sketched line. The real lines are thousands long: the sketch only has to show the rule. */
const SLOTS = 12;
/** A block pays the front of the line first, and a beat later everyone steps up and the paid node goes to the back. */
const PAY_TO_MOVE_MS = 520;

/**
 * How a node gets paid, in one picture. Each tier is a line of nodes and every block pays the one at
 * the front, then sends it to the back, so everyone takes a turn. A hexagon draws itself round the node
 * over one block time (the block timer); each lap closes with one payout per tier. The line is a sketch
 * of the rule, and the numbers beside it are the real ones, from `payoutCycle` in the live layer: how
 * long a turn takes to come round (the live count of nodes in the tier x the block time) and what a
 * turn pays, with the parallel-asset match counted in (a Stratus turn is 9 FLUX plus 9 across ten
 * chains: 18 in all). Underneath, one line on parallel assets, worked out from `parallelAssets`.
 */
export function Earn({ live }: { live: FluxLiveSnapshot }) {
  const parallel = parallelAssetsLine();
  const sources = uniqueSources(proofOfNode()?.sources, payoutRotationSources(), parallel?.sources);

  return (
    <div className={beat.beat} role="group" aria-labelledby="ops-earn-title">
      <div className={beat.head}>
        <BeatHead id="ops-earn-title">
          Every node gets its <b>turn</b>
        </BeatHead>
        <Reveal as="p" delay={120} className={beat.beatLede}>
          Every {CHAIN.blockSeconds} seconds, one node in every tier gets paid, then goes to the back of the line
        </Reveal>
      </div>

      <Reveal>
        <PayStage live={live} sources={sources} parallel={parallel} />
      </Reveal>
    </div>
  );
}

interface PayStageProps {
  live: FluxLiveSnapshot;
  sources: Source[];
  parallel: ParallelLine | undefined;
}

function PayStage({ live, sources, parallel }: PayStageProps) {
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const active = useActive(root);
  const seen = useInView(root, { once: true, rootMargin: '0px 0px -25% 0px' });
  const running = seen && active && !reduced;

  /** Blocks paid so far: each one sends a "+amount" up off the front of every line. */
  const [blocks, setBlocks] = useState(0);
  /** Places every line has moved up. After each, the node that was paid sits at the back. */
  const [shift, setShift] = useState(0);
  const [cycle, setCycle] = useState(0);
  const timers = useRef<number[]>([]);

  const pulse = useCallback(() => {
    setBlocks((n) => n + 1);
    const id = window.setTimeout(
      () => {
        setShift((n) => n + 1);
        timers.current = timers.current.filter((t) => t !== id);
      },
      reduced ? 0 : PAY_TO_MOVE_MS,
    );
    timers.current.push(id);
  }, [reduced]);

  useEffect(
    () => () => {
      for (const t of timers.current) window.clearTimeout(t);
    },
    [],
  );

  // One reading of the cycle, shared by the lanes and the line under them. It is taken afresh on every
  // render (a block lands every 30 s), so when the reward drops, or parallel assets stop, the page follows.
  const cycles = TIER_IDS.map((id) => payoutCycle(id, live));
  const stopped = cycles.some((c) => c?.parallel === null);

  // The first block lands as the stage comes into view, so the picture does not open on a wait.
  const opened = useRef(false);
  useEffect(() => {
    if (!running || opened.current) return;
    opened.current = true;
    pulse();
  }, [running, pulse]);

  // "Next block" skips the wait, and starts the timer over so the two stay together.
  const nextBlock = useCallback(() => {
    setCycle((c) => c + 1);
    pulse();
  }, [pulse]);

  return (
    <div ref={root} className={styles.stage}>
      <div className={styles.machine}>
        <div className={styles.art}>
          {/* The art is cropped on a phone; the timer shares its box, so it always sits on the node. */}
          <div className={styles.scaled}>
            {/* The node is a picture of "a node": it carries no data, so it is hidden from assistive tech. */}
            <ArtPlate src="node-hero" mode="flow" alt="" />
            <Timer key={cycle} running={running} animated={!reduced} beats={blocks} onBlock={pulse} />
          </div>
        </div>
        {/* Under reduced motion nothing moves, so there is nothing for the button to skip to. */}
        {reduced ? null : (
          <Button variant="ghost" size="sm" icon={<SkipForward size={15} strokeWidth={1.75} aria-hidden="true" />} onClick={nextBlock}>
            Next block
          </Button>
        )}
      </div>

      <div className={styles.right}>
        <ol className={styles.lanes} aria-label="How long a node in each tier waits for its turn, and what a turn pays">
          {TIER_IDS.map((id, i) => (
            <Lane key={id} tier={id} index={i} live={live} cycle={cycles[i]} blocks={blocks} shift={shift} />
          ))}
        </ol>

        <div className={styles.foot}>
          {parallel && !stopped ? (
            <p className={styles.parallel}>
              <span className={styles.parallelMark} aria-hidden="true">
                <HexBullet size={8} />
              </span>
              <span>
                Today, every payout{' '}
                {parallel.matched ? (
                  <>
                    is <b>matched in full</b>
                  </>
                ) : (
                  <>
                    also earns <b>{parallel.totalShare}% more</b>
                  </>
                )}{' '}
                across <b>{parallel.chains}</b>
                {parallel.claimedIn ? `, claimed in ${parallel.claimedIn}` : null}
              </span>
            </p>
          ) : null}
          <Sources items={sources} title="Where this comes from (parallel-asset amounts are before Fusion claim fees; the lines are drawn short, the real ones are thousands of nodes long)" />
        </div>
      </div>
    </div>
  );
}

interface TimerProps {
  running: boolean;
  /** False under reduced motion: the timer just stays closed. */
  animated: boolean;
  /** Blocks so far: each one lights the outline for a moment. */
  beats: number;
  onBlock: () => void;
}

// A pointy-top hexagon inscribed in a 100 x 100 box, from the top vertex, clockwise.
const HEX = 'M50 3 L90.7 26.5 L90.7 73.5 L50 97 L9.3 73.5 L9.3 26.5 Z';

/** The block timer: a hexagon round the node that draws itself over one block time. Each lap is a block. */
function Timer({ running, animated, beats, onBlock }: TimerProps) {
  return (
    <svg
      className={styles.ring}
      viewBox="0 0 100 100"
      aria-hidden="true"
      data-animated={animated || undefined}
      data-running={running || undefined}
      style={{ '--block': `${CHAIN.blockSeconds}s` } as CSSProperties}
    >
      {/* A new key restarts the outline's flash: one crisp line going white and back. */}
      <path key={beats} d={HEX} className={styles.ringTrack} data-beat={beats > 0 || undefined} pathLength={100} />
      <path d={HEX} className={styles.ringFill} pathLength={100} onAnimationIteration={onBlock} />
    </svg>
  );
}

interface LaneProps {
  tier: NodeTierId;
  index: number;
  live: FluxLiveSnapshot;
  cycle: PayoutCycle | undefined;
  blocks: number;
  shift: number;
}

function Lane({ tier, index, live, cycle, blocks, shift }: LaneProps) {
  const wait = cycle ? turnParts(cycle.secondsBetween) : undefined;
  const pay = cycle ? turnPay(cycle) : undefined;
  const count = live.totalNodes > 0 ? live.tiers[tier] : undefined;

  return (
    <li className={styles.lane} data-tier={tier} style={{ '--lane': index } as CSSProperties}>
      <div className={styles.laneHead}>
        <p className={styles.name}>{tierName(tier)}</p>
        {count != null ? <p className={styles.count}>{formatInt(count)} nodes in line</p> : null}
      </div>

      <Line shift={shift} blocks={blocks} amount={pay?.total} />

      <div className={styles.turn}>
        {wait ? (
          <>
            <p className={styles.turnLead}>Your node is paid about every</p>
            <p className={styles.turnValue}>
              <CountUp value={wait.value} decimals={wait.decimals} duration={1400} />
              <span className={styles.turnUnit}>{wait.unit}</span>
            </p>
          </>
        ) : null}
      </div>

      {/* What a turn pays: the whole of it up front, and how it adds up in a quieter line under it. */}
      {pay ? (
        <div className={styles.pay}>
          <p className={styles.payHead}>
            <b className={styles.payFigure}>{amountText(pay.total)}</b>{' '}
            <span className={styles.payUnit}>FLUX a turn</span>
          </p>
          {pay.split ? (
            <p className={styles.paySplit}>
              <span className={styles.sum}>
                {amountText(pay.split.base)} FLUX + {amountText(pay.split.parallel)}
              </span>{' '}
              across {pay.split.chains}
            </p>
          ) : null}
          <p className={styles.payDay}>about {approxFlux(pay.perDay)} FLUX a day</p>
        </div>
      ) : null}
    </li>
  );
}

/**
 * One tier's line, sketched: the node at the front is lit and paid; a beat later it drops under the
 * row, slides to the back and everyone else steps up one. Each node keeps its own element, so the
 * move is a transition of its place and nothing is redrawn. A hairline underneath is the way back.
 */
function Line({ shift, blocks, amount }: { shift: number; blocks: number; amount: number | undefined }) {
  return (
    <div className={styles.lineBox} aria-hidden="true">
      <div className={styles.line} style={{ '--m': SLOTS } as CSSProperties}>
        <span className={styles.track} />
        {Array.from({ length: SLOTS }, (_, node) => {
          const place = (((node - shift) % SLOTS) + SLOTS) % SLOTS;
          return (
            <span key={node} className={styles.slot} data-front={place === 0 || undefined} style={{ '--i': place } as CSSProperties}>
              <i className={styles.hex} data-back={(shift > 0 && place === SLOTS - 1) || undefined} />
            </span>
          );
        })}
        {blocks > 0 && amount != null ? (
          <b key={blocks} className={styles.pop}>
            +{amountText(amount)}
          </b>
        ) : null}
      </div>
    </div>
  );
}
