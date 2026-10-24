/**
 * Geometry for the shape view's radar. Spoke 0 points straight up and the rest follow clockwise, one
 * per question, in group order, so the five groups sit together as sectors.
 */

export interface Pt {
  x: number;
  y: number;
}

const RAD = Math.PI / 180;

/** The screen position at `deg` degrees (0 = right, 90 = down) and distance `r` from the centre. */
export function polar(cx: number, cy: number, r: number, deg: number): Pt {
  return { x: cx + r * Math.cos(deg * RAD), y: cy + r * Math.sin(deg * RAD) };
}

/** The angle of spoke `i` of `n`, in degrees, with spoke 0 at the top. */
export const spokeAngle = (i: number, n: number): number => -90 + (360 / n) * i;

/** `points` attribute for a polygon from radii (px) around a centre. */
export function polygonPoints(cx: number, cy: number, radii: readonly number[]): string {
  const n = radii.length;
  return radii
    .map((r, i) => {
      const p = polar(cx, cy, r, spokeAngle(i, n));
      return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    })
    .join(' ');
}

/** An annular sector (a slice of a ring) from angle a0 to a1 (degrees, clockwise) between radii r0 and r1. */
export function sectorPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const large = a1 - a0 > 180 ? 1 : 0;
  const p0 = polar(cx, cy, r1, a0);
  const p1 = polar(cx, cy, r1, a1);
  const p2 = polar(cx, cy, r0, a1);
  const p3 = polar(cx, cy, r0, a0);
  return [
    `M${p0.x.toFixed(2)} ${p0.y.toFixed(2)}`,
    `A${r1} ${r1} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `L${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `A${r0} ${r0} 0 ${large} 0 ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

/** An open arc at radius r from a0 to a1; `reverse` runs it anticlockwise, so text on it reads upright along the bottom. */
export function arcPath(cx: number, cy: number, r: number, a0: number, a1: number, reverse = false): string {
  const large = a1 - a0 > 180 ? 1 : 0;
  const from = polar(cx, cy, r, reverse ? a1 : a0);
  const to = polar(cx, cy, r, reverse ? a0 : a1);
  return `M${from.x.toFixed(2)} ${from.y.toFixed(2)} A${r} ${r} 0 ${large} ${reverse ? 0 : 1} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
}

/** Greedy word wrap to at most `max` characters a line (a long single word stays whole). */
export function wrapLabel(text: string, max = 16): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && `${line} ${word}`.length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** The spoke whose direction is nearest to a point, by angle. */
export function nearestSpoke(cx: number, cy: number, x: number, y: number, n: number): number {
  let deg = (Math.atan2(y - cy, x - cx) * 180) / Math.PI + 90; // 0 at the top, clockwise
  deg = ((deg % 360) + 360) % 360;
  return Math.round(deg / (360 / n)) % n;
}
