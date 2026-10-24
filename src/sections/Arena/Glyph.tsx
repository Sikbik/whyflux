import type { CSSProperties } from 'react';
import type { Verdict } from '@/data/types';
import { cn } from '@/lib/cn';
import styles from './Glyph.module.css';

/** A regular pointy-top hexagon in a 30 by 34.64 box, inset one unit so a 1.5 unit stroke is never clipped. */
const HEX = 'M15 1 L29.13 9.16 L29.13 25.48 L15 33.64 L0.87 25.48 L0.87 9.16 Z';
const RATIO = 34.64 / 30;

/**
 * How high (0 to 1, from the bottom) a pointy-top regular hexagon is filled when it holds `share` of
 * its area. The tips are narrow, so a fill that rises by equal heights would make 4 and 5 look alike;
 * rising by equal areas keeps every step of the score the same visible size.
 */
export function hexLevel(share: number): number {
  const x = Math.max(0, Math.min(1, share));
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  // Units of the circumradius R: the hexagon is 2R tall, its tips each hold a sixth of the area.
  const h = x < 1 / 6 ? Math.sqrt(1.5 * x) : x <= 5 / 6 ? 1.5 * x + 0.25 : 2 - Math.sqrt(1.5 * (1 - x));
  return h / 2;
}

export interface HexGlyphProps {
  /** 0 to 5: how full the hexagon is. */
  score: number;
  /**
   * The verdict is the outline: solid for yes, dashed for partial, dotted for no, a dash for not
   * applicable. So the answer reads without colour.
   */
  verdict: Verdict;
  /** Width in px; the height follows. */
  size?: number;
  /** Fill the hexagon in when an ancestor gains data-shown="true" (the matrix reveal). */
  animate?: boolean;
  className?: string;
}

/**
 * One cell of the comparison: a hexagon filled from the bottom to the score (flat colour, five
 * levels), outlined by the verdict. The fill takes `--gl-fill` and the outline `--gl-rim`, so a row,
 * a chip or a card re-colours it without a new component.
 */
export function HexGlyph({ score, verdict, size = 30, animate = false, className }: HexGlyphProps) {
  const lvl = verdict === 'na' ? 0 : hexLevel(score / 5);
  return (
    <svg
      className={cn(styles.glyph, className)}
      data-verdict={verdict}
      data-anim={animate || undefined}
      width={size}
      height={size * RATIO}
      viewBox="0 0 30 34.64"
      style={{ '--lvl': lvl } as CSSProperties}
      aria-hidden="true"
      focusable="false"
    >
      <path className={styles.well} d={HEX} />
      <path className={styles.fill} d={HEX} />
      {verdict === 'na' ? <path className={styles.dash} d="M10.5 17.3 H19.5" /> : null}
      <path className={styles.rim} d={HEX} pathLength={100} />
    </svg>
  );
}

export interface HexRingProps {
  /** Width in px; it should be a little larger than the glyph it surrounds. */
  size?: number;
  className?: string;
}

/** An outline hexagon centred on its (positioned) parent. Colour it with `--ring`. */
export function HexRing({ size = 38, className }: HexRingProps) {
  return (
    <svg
      className={cn(styles.ringSvg, className)}
      width={size}
      height={size * RATIO}
      viewBox="0 0 30 34.64"
      aria-hidden="true"
      focusable="false"
    >
      <path d={HEX} />
    </svg>
  );
}

export interface HexPipsProps {
  /** 0 to 5 pips lit. */
  score: number;
  count?: number;
  /** Width of one pip in px. */
  size?: number;
  /** `end`: the pips that light first sit at the end of the row (the left side of a versus row). */
  align?: 'start' | 'end';
  /** Light the pips with a stagger from the centre outward when an ancestor gains data-shown. */
  animate?: boolean;
  className?: string;
}

/** Five small hexagons lit to a score. The row is `aria-hidden`: the number beside it is the text. */
export function HexPips({ score, count = 5, size = 22, align = 'start', animate = false, className }: HexPipsProps) {
  const pips = Array.from({ length: count }, (_, j) => {
    const k = align === 'end' ? count - 1 - j : j; // distance from the centre of the matchup
    return { j, k, on: k < score };
  });
  return (
    <span className={cn(styles.pips, className)} data-anim={animate || undefined} aria-hidden="true">
      {pips.map((p) => (
        <svg
          key={p.j}
          className={styles.pip}
          data-on={p.on || undefined}
          width={size}
          height={size * RATIO}
          viewBox="0 0 30 34.64"
          style={{ '--k': p.k } as CSSProperties}
          focusable="false"
        >
          <path d={HEX} />
        </svg>
      ))}
    </span>
  );
}
