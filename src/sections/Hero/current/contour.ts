/**
 * Outlines of letters, traced from a rasterised glyph with marching squares.
 *
 * The headline's current has to run along the edges of the real letterforms in whatever face and
 * size the page picked, without a font parser: so a glyph is drawn once into an offscreen canvas,
 * its alpha is contoured (with sub-pixel interpolation, so a straight stem is straight), and the
 * closed loops that come out are resampled to an even spacing. Each point carries a unit normal
 * pointing out of the ink, which is what the arcs ride on.
 *
 * Pure arithmetic over typed arrays: no DOM, so it can be exercised on its own.
 */

/** One closed outline of a piece of ink, resampled to an even spacing. */
export interface Loop {
  /** Points as x0, y0, x1, y1, ... */
  xy: Float32Array;
  /** Unit normals as nx0, ny0, ..., pointing out of the ink. */
  nm: Float32Array;
  /** Number of points. */
  count: number;
  /** Distance between neighbouring points. */
  step: number;
  /** Perimeter. */
  length: number;
  /** The outline of a counter (the inside of an e, p or g): ink is outside it. */
  hole: boolean;
}

/** Alpha at or above this counts as ink. */
const EDGE = 127.5;

/**
 * Traces every outline in an alpha raster.
 *
 * @param alpha  `w * h` alpha values. The border must be empty so every outline closes.
 * @param step   spacing of the returned points, in raster pixels
 * @returns loops in sample space: a pixel `(ix, iy)` is sampled at `(ix, iy)`, so add 0.5 to both
 *          coordinates to land on the pixel's centre in canvas space
 */
export function traceLoops(alpha: Uint8Array, w: number, h: number, step: number): Loop[] {
  const edges = 2 * w * h;
  // Every edge crossing is shared by two cells, so it has exactly two neighbours along an outline.
  const nb0 = new Int32Array(edges).fill(-1);
  const nb1 = new Int32Array(edges).fill(-1);
  const join = (p: number, q: number) => {
    if (nb0[p]! < 0) nb0[p] = q;
    else nb1[p] = q;
    if (nb0[q]! < 0) nb0[q] = p;
    else nb1[q] = p;
  };

  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const i = y * w + x;
      const tl = alpha[i]! >= EDGE;
      const tr = alpha[i + 1]! >= EDGE;
      const br = alpha[i + w + 1]! >= EDGE;
      const bl = alpha[i + w]! >= EDGE;
      const code = (tl ? 8 : 0) | (tr ? 4 : 0) | (br ? 2 : 0) | (bl ? 1 : 0);
      if (code === 0 || code === 15) continue;
      // Edge ids: a horizontal edge hangs off its left sample, a vertical edge off its top sample.
      const top = 2 * i;
      const left = 2 * i + 1;
      const right = 2 * (i + 1) + 1;
      const bottom = 2 * (i + w);
      switch (code) {
        case 1:
        case 14:
          join(left, bottom);
          break;
        case 2:
        case 13:
          join(bottom, right);
          break;
        case 3:
        case 12:
          join(left, right);
          break;
        case 4:
        case 11:
          join(top, right);
          break;
        case 6:
        case 9:
          join(top, bottom);
          break;
        case 7:
        case 8:
          join(top, left);
          break;
        default: {
          // Saddles (5 and 10): the average decides whether the two inked corners are one piece.
          const joined = (alpha[i]! + alpha[i + 1]! + alpha[i + w + 1]! + alpha[i + w]!) / 4 >= EDGE;
          if ((code === 5) === joined) {
            join(top, left);
            join(bottom, right);
          } else {
            join(top, right);
            join(left, bottom);
          }
        }
      }
    }
  }

  /** Position of an edge crossing, interpolated from the two alphas it sits between. */
  const crossing = (id: number, out: number[]) => {
    const k = id >> 1;
    const x = k % w;
    const y = (k - x) / w;
    const a0 = alpha[k]!;
    if (id & 1) {
      const a1 = alpha[k + w]!;
      out.push(x, y + (EDGE - a0) / (a1 - a0));
    } else {
      const a1 = alpha[k + 1]!;
      out.push(x + (EDGE - a0) / (a1 - a0), y);
    }
  };

  const seen = new Uint8Array(edges);
  const loops: Loop[] = [];
  for (let start = 0; start < edges; start++) {
    if (nb0[start]! < 0 || seen[start]) continue;
    const raw: number[] = [];
    let prev = -1;
    let cur = start;
    do {
      seen[cur] = 1;
      crossing(cur, raw);
      const next: number = nb0[cur] !== prev ? nb0[cur]! : nb1[cur]!;
      prev = cur;
      cur = next;
    } while (cur >= 0 && cur !== start && !seen[cur]);
    if (raw.length < 16) continue; // a speck
    const loop = resample(raw, step);
    if (loop) {
      orient(loop, alpha, w, h);
      loops.push(loop);
    }
  }
  return loops;
}

/** Smooths a closed polyline lightly (the pixel grid leaves a faint stair) and spaces it evenly. */
function resample(raw: number[], step: number): Loop | null {
  let n = raw.length / 2;
  let a = raw;
  // Two passes of a [1 2 1] average round the stair without moving a stem by more than a hair.
  for (let pass = 0; pass < 2; pass++) {
    const b = new Array<number>(a.length);
    for (let i = 0; i < n; i++) {
      const p = ((i + n - 1) % n) * 2;
      const q = ((i + 1) % n) * 2;
      b[i * 2] = (a[p]! + 2 * a[i * 2]! + a[q]!) / 4;
      b[i * 2 + 1] = (a[p + 1]! + 2 * a[i * 2 + 1]! + a[q + 1]!) / 4;
    }
    a = b;
  }
  // Cumulative length around the loop.
  const cum = new Float32Array(n + 1);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    cum[i + 1] = cum[i]! + Math.hypot(a[j * 2]! - a[i * 2]!, a[j * 2 + 1]! - a[i * 2 + 1]!);
  }
  const length = cum[n]!;
  const count = Math.max(8, Math.round(length / step));
  if (length < step * 4) return null;
  const xy = new Float32Array(count * 2);
  let seg = 0;
  for (let k = 0; k < count; k++) {
    const s = (k * length) / count;
    while (seg < n - 1 && cum[seg + 1]! < s) seg++;
    const span = cum[seg + 1]! - cum[seg]!;
    const t = span > 1e-6 ? (s - cum[seg]!) / span : 0;
    const j = (seg + 1) % n;
    xy[k * 2] = a[seg * 2]! + (a[j * 2]! - a[seg * 2]!) * t;
    xy[k * 2 + 1] = a[seg * 2 + 1]! + (a[j * 2 + 1]! - a[seg * 2 + 1]!) * t;
  }
  n = count;
  return { xy, nm: new Float32Array(count * 2), count, step: length / count, length, hole: false };
}

/** Fills in the normals so they point out of the ink, and says whether the loop is a counter. */
function orient(loop: Loop, alpha: Uint8Array, w: number, h: number): void {
  const { xy, nm, count } = loop;
  for (let i = 0; i < count; i++) {
    const p = ((i + count - 1) % count) * 2;
    const q = ((i + 1) % count) * 2;
    let tx = xy[q]! - xy[p]!;
    let ty = xy[q + 1]! - xy[p + 1]!;
    const m = Math.hypot(tx, ty) || 1;
    tx /= m;
    ty /= m;
    nm[i * 2] = ty;
    nm[i * 2 + 1] = -tx;
  }
  // One side of the line is ink and the other is not. Probe a handful of points a couple of pixels
  // to the side the normals point at and flip them all if that side is the ink.
  let inked = 0;
  const probes = Math.min(count, 9);
  for (let k = 0; k < probes; k++) {
    const i = Math.floor((k * count) / probes);
    const x = Math.round(xy[i * 2]! + nm[i * 2]! * 2.5);
    const y = Math.round(xy[i * 2 + 1]! + nm[i * 2 + 1]! * 2.5);
    if (x >= 0 && y >= 0 && x < w && y < h && alpha[y * w + x]! >= EDGE) inked++;
  }
  if (inked * 2 > probes) {
    for (let i = 0; i < count * 2; i++) nm[i] = -nm[i]!;
  }
  // The outward normal of a counter points into the loop's own interior.
  const i = 0;
  loop.hole = inside(loop, xy[i]! + nm[i]! * 1.5, xy[i + 1]! + nm[i + 1]! * 1.5);
}

/** Even-odd point-in-polygon against one loop. */
function inside(loop: Loop, px: number, py: number): boolean {
  const { xy, count } = loop;
  let hit = false;
  for (let i = 0, j = count - 1; i < count; j = i++) {
    const xi = xy[i * 2]!;
    const yi = xy[i * 2 + 1]!;
    const xj = xy[j * 2]!;
    const yj = xy[j * 2 + 1]!;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
