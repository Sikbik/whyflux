/**
 * The stage's geometry: pure functions, no React. The app sits at the center of concentric pointy-top
 * hexagons, one per layer. All numbers are in the stage's own coordinate space (the SVG viewBox), so the
 * picture scales as one piece. Angles are screen angles: 0 is right, 90 is down, 180 (left) is where the
 * operator is.
 */
import type { Verdict } from '@/data/types';

export type Pt = readonly [number, number];

/** The stage's box: the viewBox, where the app sits and where the operator's beams start. */
export interface StageBox {
  w: number;
  h: number;
  /** The app's center. */
  cx: number;
  cy: number;
  /** Where the operator's beams start. */
  ox: number;
  oy: number;
}

/** Wide screens: a long runway between the operator and the rings, so a beam has room to fly. */
export const STAGE_WIDE: StageBox = { w: 680, h: 540, cx: 400, cy: 270, ox: 40, oy: 270 };
/** Phones: the same picture with the operator pulled in, so the rings keep their size. */
export const STAGE_COMPACT: StageBox = { w: 560, h: 540, cx: 300, cy: 270, ox: 44, oy: 270 };

/** The innermost ring clears the crystal; the outermost stops short of the stage's edge. */
export const R_INNER = 164;
export const R_OUTER = 252;
const MAX_STEP = 30;

/** The crystal art box in stage units. The crystal itself sits in the middle 40 percent of it. */
export const CRYSTAL_BOX = 420;
/** Where the crystal's visual center sits inside its art box (it is a little below the middle). */
export const CRYSTAL_CENTER: Pt = [0.5, 0.532];

const RAD = Math.PI / 180;
const SQRT3_2 = Math.sqrt(3) / 2;

/** Radius of ring `index` (0 is the outermost) among `count` rings. */
export function ringRadius(index: number, count: number): number {
  if (count <= 1) return R_INNER;
  const step = Math.min(MAX_STEP, (R_OUTER - R_INNER) / (count - 1));
  return R_INNER + (count - 1 - index) * step;
}

/** The six vertices of a pointy-top hexagon, clockwise from the top. */
function hexVertices(cx: number, cy: number, r: number): Pt[] {
  return [-90, -30, 30, 90, 150, 210].map((d): Pt => [cx + r * Math.cos(d * RAD), cy + r * Math.sin(d * RAD)]);
}

const n2 = (v: number) => Math.round(v * 100) / 100;

export function hexPath(cx: number, cy: number, r: number): string {
  const v = hexVertices(cx, cy, r);
  return `M${v.map(([x, y]) => `${n2(x)} ${n2(y)}`).join('L')}Z`;
}

/** The radius of a pointy-top hexagon's boundary, at a screen angle. */
export function hexRadiusAt(r: number, deg: number): number {
  const apothem = r * SQRT3_2;
  const d = ((deg % 60) + 60) % 60;
  const off = d > 30 ? d - 60 : d; // distance from the nearest edge normal, -30..30
  return apothem / Math.cos(off * RAD);
}

/** A point on a ring at a screen angle. */
export function hexPoint(cx: number, cy: number, r: number, deg: number): Pt {
  const rr = hexRadiusAt(r, deg);
  return [cx + rr * Math.cos(deg * RAD), cy + rr * Math.sin(deg * RAD)];
}

/** The circumradius of the hexagon centered on (cx, cy) that passes through p. */
export function hexR(cx: number, cy: number, p: Pt): number {
  const x = p[0] - cx;
  const y = p[1] - cy;
  return Math.max(Math.abs(x), Math.abs(x * 0.5 + y * SQRT3_2), Math.abs(x * 0.5 - y * SQRT3_2)) / SQRT3_2;
}

const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Where the segment a to b first reaches a ring of circumradius r (or b, if it never does). */
export function crossing(cx: number, cy: number, a: Pt, b: Pt, r: number): Pt {
  const steps = 96;
  let prev = a;
  for (let i = 1; i <= steps; i += 1) {
    const p = lerp(a, b, i / steps);
    if (hexR(cx, cy, p) <= r) {
      // Refine inside the last step.
      let lo = prev;
      let hi = p;
      for (let k = 0; k < 8; k += 1) {
        const mid = lerp(lo, hi, 0.5);
        if (hexR(cx, cy, mid) <= r) hi = mid;
        else lo = mid;
      }
      return hi;
    }
    prev = p;
  }
  return b;
}

/* ---- dashes: how a ring is drawn on one kind of node ----------------------------------------------------- */

export interface Dash {
  array: string;
  offset: number;
}

/** A gap this long is cut out of a ring that only limits an attempt. */
const GAP_PX = 46;

/**
 * Closed: one unbroken line. Gapped: a line with a gap facing the operator. Open: short dashes, a fence
 * with nothing holding it shut. All three are two-number dash lists, so a ring can animate between them.
 */
export function dashFor(verdict: Verdict, r: number): Dash {
  const perimeter = 6 * r;
  if (verdict === 'yes') return { array: '5 8', offset: 0 };
  if (verdict === 'partial') return { array: `${perimeter - GAP_PX} ${GAP_PX}`, offset: 1.5 * r - GAP_PX / 2 };
  return { array: `${perimeter} 0`, offset: 0 };
}

/* ---- the attempts' paths ---------------------------------------------------------------------------------------- */

/** Where, around the left of a ring, successive attempts strike: spread so their marks never stack. */
const SPREAD = [0, -22, 16, -34, 28, -10, 34, -28, 8, -16, 22, -6, 30] as const;

export const strikeAngle = (order: number): number => 180 + (SPREAD[order % SPREAD.length] ?? 0);

/** Where on the crystal an attempt that gets in lands. */
const TARGETS: readonly Pt[] = [
  [-8, -10],
  [14, 12],
  [-16, 26],
  [10, -32],
  [-2, 2],
  [-8, 42],
];

export interface BeamPlan {
  from: Pt;
  /** Where the beam stops. */
  to: Pt;
  /** Where it meets its ring, if it is aimed at one. */
  hit: Pt | null;
  /** Whether the beam gets past the ring (a partial) or the whole stack (a yes). */
  reach: 'stops' | 'half' | 'through';
}

/**
 * The path of one attempt. A `no` stops on its ring. A `partial` pierces it and dies about halfway to
 * the crystal. A `yes` crosses every ring and ends on the crystal.
 */
export function planBeam(box: StageBox, verdict: Verdict, ringIndex: number | null, ringCount: number, order: number): BeamPlan {
  const { cx, cy, ox, oy } = box;
  const from: Pt = [ox, oy];
  const idx = ringIndex ?? 0;
  const r = ringCount > 0 ? ringRadius(idx, ringCount) : R_INNER;

  if (verdict === 'yes') {
    const t = TARGETS[order % TARGETS.length] ?? [0, 0];
    const to: Pt = [cx + t[0], cy + t[1]];
    const hit = ringIndex === null || ringCount === 0 ? null : crossing(cx, cy, from, to, r);
    return { from, to, hit, reach: 'through' };
  }

  const hit = hexPoint(cx, cy, r, strikeAngle(order));
  if (verdict === 'partial') {
    const dx = hit[0] - from[0];
    const dy = hit[1] - from[1];
    const len = Math.hypot(dx, dy) || 1;
    const run = Math.max(24, (r - 90) * 0.55);
    const to: Pt = [hit[0] + (dx / len) * run, hit[1] + (dy / len) * run];
    return { from, to, hit, reach: 'half' };
  }
  return { from, to: hit, hit, reach: 'stops' };
}

/* ---- cracks ------------------------------------------------------------------------------------------------------- */

/** Jagged fractures across the crystal, as offsets from its center. The nth attempt that gets in opens the nth. */
export const CRACKS: readonly (readonly Pt[])[] = [
  [[-26, -104], [-10, -74], [-24, -48], [-2, -22], [-16, 8], [4, 34]],
  [[44, -78], [26, -52], [38, -26], [16, -2], [30, 24]],
  [[-58, 14], [-34, 28], [-46, 52], [-20, 66], [-30, 92]],
  [[22, 46], [4, 64], [20, 84], [0, 104]],
  [[-8, -112], [8, -88], [-4, -66]],
  [[58, -6], [36, 8], [48, 32], [30, 50]],
];

export function crackPath(box: StageBox, points: readonly Pt[]): string {
  return `M${points.map(([x, y]) => `${n2(box.cx + x)} ${n2(box.cy + y)}`).join('L')}`;
}

export const linePath = (a: Pt, b: Pt): string => `M${n2(a[0])} ${n2(a[1])}L${n2(b[0])} ${n2(b[1])}`;

/** A point in stage units as percentages of the stage box, for HTML laid over the SVG. */
export function pct(box: StageBox, p: Pt): { left: string; top: string } {
  return { left: `${(p[0] / box.w) * 100}%`, top: `${(p[1] / box.h) * 100}%` };
}
