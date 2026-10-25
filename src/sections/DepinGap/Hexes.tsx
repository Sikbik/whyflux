import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import { mulberry32 } from '@/lib/rng';
import styles from './TwoQuestions.module.css';

/**
 * The machines. One hexagon is one machine your app runs on, and it is the only thing in the picture
 * that is drawn: a ring that is always there and a fill that says "your app runs here". Everything is
 * decorative (`aria-hidden`): the words next to it carry the answer.
 */

/** A pointy-top hexagon in a 24 x 28 box, with room for the stroke. */
const HEX_PATH = 'M12 1.4 L22.3 7.2 V20.8 L12 26.6 L1.7 20.8 V7.2 Z';

export function Hex({ lit, className }: { lit: boolean; className?: string }) {
  return (
    <svg className={cn(styles.hex, className)} data-lit={lit || undefined} viewBox="0 0 24 28" aria-hidden="true" focusable="false">
      <path className={styles.hexFill} d={HEX_PATH} />
      <path className={styles.hexRing} d={HEX_PATH} />
    </svg>
  );
}

/** A few machines in a row: the picture of "one" or "several". */
export function Strip({ count, lit }: { count: number; lit: boolean }) {
  return (
    <span className={styles.strip} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <Hex key={i} lit={lit} />
      ))}
    </span>
  );
}

/* ---- the field ----------------------------------------------------------------------------------------- */

/**
 * Flux's answer is a field of a hundred machines, the most one app can ask for (`features.replicas`:
 * "1 to 100"). It is an illustration of "as many as you choose": 8 rows that alternate 13 and 12
 * hexagons, so the edge zig-zags like a honeycomb and the count is exactly 100. Each machine is a
 * pointy-top hexagon of radius `R` set in a pitch of 1, so there is a gap between them: independent
 * machines, not one block.
 */
const ROW_COUNTS = [13, 12, 13, 12, 13, 12, 13, 12] as const;
const PITCH_X = Math.sqrt(3);
const PITCH_Y = 1.5;
const R = 0.82;
/** The machines come on in this many steps, in an order that looks like the network waking up. */
const WAVES = 10;

const num = (n: number): string => String(Math.round(n * 100) / 100);

function hexPath(cx: number, cy: number): string {
  const dx = (PITCH_X / 2) * R;
  const pts: [number, number][] = [
    [cx, cy - R],
    [cx + dx, cy - R / 2],
    [cx + dx, cy + R / 2],
    [cx, cy + R],
    [cx - dx, cy + R / 2],
    [cx - dx, cy - R / 2],
  ];
  return `${pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${num(x)} ${num(y)}`).join('')}Z`;
}

const FIELD = (() => {
  const centres: { x: number; y: number }[] = [];
  ROW_COUNTS.forEach((count, j) => {
    const inset = count === 13 ? 0.5 : 1;
    for (let i = 0; i < count; i++) centres.push({ x: (i + inset) * PITCH_X, y: 1 + j * PITCH_Y });
  });

  // Deal the machines into waves: shuffled once, so every visit draws the same field.
  const rand = mulberry32(0x5eed);
  const order = centres.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const k = Math.floor(rand() * (i + 1));
    [order[i], order[k]] = [order[k] as number, order[i] as number];
  }
  const waves: string[] = Array.from({ length: WAVES }, () => '');
  order.forEach((cell, rank) => {
    const c = centres[cell] as { x: number; y: number };
    waves[rank % WAVES] += hexPath(c.x, c.y);
  });

  const width = 13 * PITCH_X;
  const height = 2 + (ROW_COUNTS.length - 1) * PITCH_Y;
  return {
    box: `0 0 ${num(width)} ${num(height)}`,
    ring: centres.map((c) => hexPath(c.x, c.y)).join(''),
    waves,
  };
})();

export function Field() {
  return (
    <svg className={styles.field} viewBox={FIELD.box} aria-hidden="true" focusable="false">
      <path className={styles.fieldRing} d={FIELD.ring} />
      {FIELD.waves.map((d, w) => (
        <path key={w} className={styles.fieldFill} d={d} style={{ '--w': w } as CSSProperties} />
      ))}
    </svg>
  );
}
