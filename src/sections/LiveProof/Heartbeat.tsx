import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { milestones } from '@/data/flux';
import { clamp } from '@/lib/math';
import { yearsSince } from '@/lib/format';
import { CHAIN, estimateHeight, type FluxLiveSnapshot, formatInt } from '@/lib/live';
import { CountUp, Reveal, Sources, useIsoLayoutEffect, useReducedMotion } from '@/ui';
import { Pulse } from './Pulse';
import type { BlockPulse } from './useBlockPulse';
import styles from './Heartbeat.module.css';

// A pointy-top hexagon in a 100 x 100 box: the same shape HexGauge draws, so the two read as a family.
const HEX = 'M50 3 L90.7 26.5 L90.7 73.5 L50 97 L9.3 73.5 L9.3 26.5 Z';
const PERIOD_MS = CHAIN.blockSeconds * 1000;

// The tape shows each block by its full height, so it holds as many as fit with room around the numbers.
const TAPE_MIN = 3;
const TAPE_MAX = 8;

/** Blocks the tape can carry across `room` px when each cell is `cell` px wide: the gap widens with the room. */
function blocksThatFit(room: number, cell: number): number {
  const gap = clamp(room * 0.1, 32, 88);
  return clamp(Math.floor((room - cell) / (cell + gap)) + 1, TAPE_MIN, TAPE_MAX);
}

export interface HeartbeatProps {
  live: FluxLiveSnapshot;
  pulse: BlockPulse;
  /** True while the heartbeat is near the viewport and the tab is visible. */
  active: boolean;
}

/**
 * Beat B: the heartbeat. The chain height, a hexagon that fills over one block time and resets
 * when a block arrives, and a tape of the latest blocks, each set down by its full height so the
 * newest reads the same as the number above it. Blocks really are watched arriving (the
 * height is polled while this is on screen); until one is seen the cycle is the 30 second cadence
 * and says so, and without any answer the height is the live layer's estimate, called one.
 */
export function Heartbeat({ live, pulse, active }: HeartbeatProps) {
  const reduced = useReducedMotion();
  const fill = useRef<SVGPathElement>(null);
  const secs = useRef<HTMLSpanElement>(null);
  const tapeWrap = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(TAPE_MIN);
  const [settled, setSettled] = useState(false);

  const height = pulse.height ?? estimateHeight(live) ?? live.blockHeight;
  const watching = pulse.height !== undefined && !pulse.offline;
  const isLive = watching || live.status === 'live';

  // The cycle: from the moment a block was seen arriving, or from the cadence when none has been.
  const anchor = useRef<{ at: number; real: boolean }>({ at: 0, real: false });
  useEffect(() => {
    const t0 = Date.parse(live.fetchedAt);
    anchor.current = pulse.observed && pulse.arrivedAt ? { at: pulse.arrivedAt, real: true } : { at: Number.isFinite(t0) ? t0 : 0, real: false };
  }, [live.fetchedAt, pulse.observed, pulse.arrivedAt]);

  useEffect(() => {
    if (!active) return;
    const write = () => {
      const { at, real } = anchor.current;
      const age = Date.now() - at;
      // A real anchor older than two cycles means we lost the thread: fall back to the cadence.
      const phase = real && age < PERIOD_MS * 2.2 ? age : ((age % PERIOD_MS) + PERIOD_MS) % PERIOD_MS;
      fill.current?.style.setProperty('stroke-dasharray', `${(clamp(phase / PERIOD_MS, 0, 1) * 100).toFixed(2)} 100`);
      if (secs.current) secs.current.textContent = String(Math.floor(phase / 1000));
    };
    write();
    if (reduced) {
      const id = window.setInterval(write, 1000);
      return () => window.clearInterval(id);
    }
    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (now - last < 66) return;
      last = now;
      write();
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, reduced]);

  // A new block: ring the hexagon once.
  const [rings, setRings] = useState(0);
  const prev = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (pulse.height === undefined) return;
    if (prev.current !== undefined && pulse.height > prev.current) setRings((n) => n + 1);
    prev.current = pulse.height;
  }, [pulse.height]);

  const real = pulse.observed && pulse.arrivedAt !== undefined;
  // The milestone that names the block where Proof of Node took over (found by the block, not typed).
  const chain = milestones.find((m) => m.body.includes(formatInt(CHAIN.ponActivationHeight)));
  const genesis = milestones[0];
  const years = genesis ? Math.floor(yearsSince(genesis.date)) : undefined;
  const hasTape = height !== undefined;

  // How many blocks the tape holds: measured from the room it has and the width of a number, before paint.
  // It stays put while it finds its size (nothing slides until it has been shown once).
  useIsoLayoutEffect(() => {
    const el = tapeWrap.current;
    if (!el || !hasTape) return;
    const measure = () => setFit(blocksThatFit(el.clientWidth, el.querySelector<HTMLElement>('li')?.offsetWidth ?? 0));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const shown = requestAnimationFrame(() => setSettled(true));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(shown);
    };
  }, [hasTape]);

  // One block past what shows: it is the oldest one leaving, sliding off the left edge as it fades.
  const blocks = height === undefined ? [] : Array.from({ length: fit + 1 }, (_, i) => height - i);

  return (
    <Reveal from="up" className={styles.root}>
      <div className={styles.grid}>
        <div className={styles.copy}>
          <p className={styles.label}>
            {isLive ? <Pulse /> : null}
            <span>Blocks on the chain</span>
            {!isLive ? <span className={styles.est}>estimated</span> : <span className="sr-only">, live</span>}
          </p>
          <div className={styles.height}>
            <CountUp value={height} duration={1200} />
          </div>
          <p className={styles.sentence}>
            {years !== undefined ? <b>{years} years on chain</b> : null}
            {years !== undefined ? ', and today a' : 'Today a'} new block about every {CHAIN.blockSeconds} seconds
            {chain ? ', made by the same nodes that host apps' : ''}
            {chain ? (
              <>
                {' '}
                <Sources items={chain.sources} label="Source" />
              </>
            ) : null}
          </p>
        </div>

        <div className={styles.gauge}>
          <div className={styles.dial}>
            <svg className={styles.svg} viewBox="0 0 100 100" aria-hidden="true">
              <path className={styles.track} d={HEX} pathLength={100} />
              <path ref={fill} className={styles.fill} d={HEX} pathLength={100} strokeDasharray="0 100" />
              {rings > 0 ? <path key={rings} className={styles.ring} d={HEX} pathLength={100} /> : null}
            </svg>
            <p className={styles.center}>
              <span ref={secs}>–</span>
              <span className={styles.sUnit}>s</span>
            </p>
          </div>
          <p className={styles.caption}>{real ? 'since the last block' : 'since the last block, estimated'}</p>
        </div>
      </div>

      <div ref={tapeWrap} className={styles.tapeWrap}>
        {blocks.length > 0 ? (
          <ol
            className={styles.tape}
            aria-label="The latest blocks, newest first"
            data-settled={settled ? 'true' : undefined}
            style={{ '--n': fit, '--chars': formatInt(height).length } as CSSProperties}
          >
            {blocks.map((h, i) => {
              const leaving = i === fit;
              return (
                <li
                  key={h}
                  className={styles.block}
                  data-latest={i === 0 ? 'true' : undefined}
                  data-leaving={leaving ? 'true' : undefined}
                  aria-hidden={leaving ? 'true' : undefined}
                  style={{ '--i': i } as CSSProperties}
                >
                  {leaving ? null : <span className="sr-only">Block {formatInt(h)}</span>}
                  <svg className={styles.node} viewBox="0 0 100 100" aria-hidden="true">
                    <path d={HEX} />
                  </svg>
                  <span className={styles.num} aria-hidden="true">
                    {formatInt(h)}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : null}
      </div>
    </Reveal>
  );
}
