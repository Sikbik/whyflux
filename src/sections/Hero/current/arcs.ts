/**
 * Arcs: the bolts. Each one is a bundle of polylines ("subpaths": the main channel, its forks,
 * the hot dots where it lands) written into a preallocated buffer, so the frame loop never
 * allocates. A bolt is re-rolled every couple of frames while it lives, which is what makes it
 * read as current and not as a drawing.
 *
 * Four shapes:
 *   crawl   rides a letter's outline, a hot head with a stepped tail and the odd spur
 *   leap    a jagged bolt across the gap between two letters, with forks and hot feet (given a
 *           `lift` it arches over instead: a hop from the crown of one letter to the next)
 *   leader  a long bolt that grows from one end, then strikes: the three conduits that converge
 *   tether  from a letter's edge to the pointer, re-rolled every step like a plasma ball
 */
import type { Loop } from './contour';

export const CRAWL = 0;
export const LEAP = 1;
export const LEADER = 2;
export const TETHER = 3;
type ArcKind = typeof CRAWL | typeof LEAP | typeof LEADER | typeof TETHER;

/** Points a single arc can hold, and subpaths (the main channel, forks, spokes, dots). */
const MAX_POINTS = 300;
const MAX_SUBS = 14;

export class Arc {
  live = false;
  kind: ArcKind = LEAP;
  /** Seconds since it began and how long it lives. */
  age = 0;
  life = 0.3;
  /** Peak brightness, 0 to 1, and core width in pixels. */
  gain = 1;
  width = 1.6;
  /** This frame's brightness (envelope times flicker) and the flicker held until the next re-roll. */
  alpha = 0;
  flick = 1;
  /** Seconds until the next re-roll, and the base interval between them. */
  roll = 0;
  every = 0.034;
  /** Fraction of the channel that has grown (leaders). */
  reveal = 1;
  /** The delay before it shows at all, so a scripted burst can be laid out in one go. */
  delay = 0;

  // Crawl: the loop it rides, the head's position in point indices, direction, speed in px/s.
  loop: Loop | null = null;
  head = 0;
  dir = 1;
  speed = 0;
  length = 120;
  amp = 2;
  /** Chance per re-roll that a crawl throws a spur. */
  spur = 0.5;

  // Leap, leader and tether: the two ends, how rough the channel is, how fine its steps are.
  ax = 0;
  ay = 0;
  bx = 0;
  by = 0;
  /** Outward normals at the two ends, for the spokes of the feet. */
  anx = 0;
  any = 0;
  bnx = 0;
  bny = 0;
  rough = 0.2;
  seg = 7;
  /** How many forks per ~120 px of channel. */
  fork = 0.6;
  /** Seconds a leader takes to grow. */
  lead = 0.1;
  /** Hot dots at the ends. */
  feet = true;
  /** Height the channel arches over a straight line from A to B (a hop over the top of a letter). */
  lift = 0;
  /** The box a bolt keeps to: the canvas, below the page's header. Shapes that wander (crawls, spurs) stop short of its edge. */
  minX = 0;
  maxX = 0;
  minY = 0;
  maxY = 0;
  /** When set, no point is ever written outside the box: a hard guarantee for the bolts that come from far away. */
  confine = false;

  readonly pts = new Float32Array(MAX_POINTS * 2);
  readonly subStart = new Uint16Array(MAX_SUBS + 1);
  readonly subWidth = new Float32Array(MAX_SUBS);
  readonly subAlpha = new Float32Array(MAX_SUBS);
  /** A subpath shows once `reveal` reaches this (0 for the main channel). */
  readonly subShow = new Float32Array(MAX_SUBS);
  /** Bare subpaths (the hot dots and spokes) get no sheath: a sheath on a dot is a bubble. */
  readonly subBare = new Uint8Array(MAX_SUBS);
  nSub = 0;
  n = 0;

  clear(): void {
    this.nSub = 0;
    this.n = 0;
  }

  begin(widthFactor: number, alphaFactor: number, show = 0, bare = false): void {
    if (this.nSub >= MAX_SUBS) return;
    this.subStart[this.nSub] = this.n;
    this.subWidth[this.nSub] = widthFactor;
    this.subAlpha[this.nSub] = alphaFactor;
    this.subShow[this.nSub] = show;
    this.subBare[this.nSub] = bare ? 1 : 0;
  }

  add(x: number, y: number): void {
    if (this.n >= MAX_POINTS || this.nSub >= MAX_SUBS) return;
    if (this.confine) {
      x = x < this.minX ? this.minX : x > this.maxX ? this.maxX : x;
      y = y < this.minY ? this.minY : y > this.maxY ? this.maxY : y;
    }
    this.pts[this.n * 2] = x;
    this.pts[this.n * 2 + 1] = y;
    this.n++;
  }

  end(): void {
    if (this.nSub >= MAX_SUBS) return;
    this.nSub++;
    this.subStart[this.nSub] = this.n;
  }
}

export type Rand = () => number;

const scratch = new Float32Array(2 * 257);

/**
 * A jagged line from A to B by midpoint displacement: every halving moves the midpoint sideways by
 * up to `rough` of that piece's length, so kinks come in every size, like real current.
 */
function jag(arc: Arc, ax: number, ay: number, bx: number, by: number, rough: number, seg: number, rand: Rand): void {
  const dist = Math.hypot(bx - ax, by - ay);
  if (dist < 1) {
    arc.add(ax, ay);
    arc.add(bx, by);
    return;
  }
  const depth = Math.min(7, Math.max(1, Math.ceil(Math.log2(dist / seg))));
  const n = 1 << depth;
  scratch[0] = ax;
  scratch[1] = ay;
  scratch[n * 2] = bx;
  scratch[n * 2 + 1] = by;
  for (let level = 0; level < depth; level++) {
    const span = n >> level;
    const half = span >> 1;
    for (let i = 0; i < n; i += span) {
      const j = i + span;
      const x0 = scratch[i * 2]!;
      const y0 = scratch[i * 2 + 1]!;
      const sx = scratch[j * 2]! - x0;
      const sy = scratch[j * 2 + 1]! - y0;
      const len = Math.hypot(sx, sy) || 1;
      // A triangular spread: mostly modest kinks, now and then a big one.
      const off = (rand() + rand() - 1) * len * rough;
      const m = (i + half) * 2;
      scratch[m] = x0 + sx / 2 - (sy / len) * off;
      scratch[m + 1] = y0 + sy / 2 + (sx / len) * off;
    }
  }
  for (let i = 0; i <= n; i++) arc.add(scratch[i * 2]!, scratch[i * 2 + 1]!);
}

/**
 * Forks off the main channel written between point indices `from` and `to`: thin, dimmer,
 * heading the same way as the flow at an acute angle. Long forks can fork once more.
 */
function forks(arc: Arc, from: number, to: number, show: number, rand: Rand): void {
  const count = to - from;
  if (count < 6 || arc.fork <= 0) return;
  const p = arc.pts;
  const length = Math.hypot(p[(to - 1) * 2]! - p[from * 2]!, p[(to - 1) * 2 + 1]! - p[from * 2 + 1]!);
  const wanted = Math.floor(arc.fork * (0.5 + rand()) * Math.min(5, Math.max(0.35, length / 120)) + rand() * 0.6);
  for (let f = 0; f < wanted; f++) {
    if (arc.nSub >= MAX_SUBS - 3 || arc.n > MAX_POINTS - 36) return;
    const i = from + 2 + Math.floor((0.1 + rand() * 0.8) * (count - 4));
    let dx = p[(i + 2) * 2]! - p[(i - 2) * 2]!;
    let dy = p[(i + 2) * 2 + 1]! - p[(i - 2) * 2 + 1]!;
    const m = Math.hypot(dx, dy) || 1;
    dx /= m;
    dy /= m;
    const turn = (0.35 + rand() * 0.6) * (rand() < 0.5 ? -1 : 1);
    const c = Math.cos(turn);
    const s = Math.sin(turn);
    const len = Math.min(190, Math.max(9, length * (0.06 + rand() * 0.17)));
    const sx = p[i * 2]!;
    const sy = p[i * 2 + 1]!;
    const ex = sx + (dx * c - dy * s) * len;
    const ey = sy + (dx * s + dy * c) * len;
    arc.begin(0.55, 0.75, show);
    jag(arc, sx, sy, ex, ey, 0.3, 6, rand);
    arc.end();
    // A long fork forks once more, thinner still.
    if (len > 55 && rand() < 0.55 && arc.nSub < MAX_SUBS - 1) {
      const turn2 = (0.4 + rand() * 0.5) * (rand() < 0.5 ? -1 : 1);
      const c2 = Math.cos(turn2);
      const s2 = Math.sin(turn2);
      const fx = (ex - sx) / len;
      const fy = (ey - sy) / len;
      const mx = sx + (ex - sx) * (0.4 + rand() * 0.3);
      const my = sy + (ey - sy) * (0.4 + rand() * 0.3);
      const l2 = len * (0.3 + rand() * 0.3);
      arc.begin(0.35, 0.5, show);
      jag(arc, mx, my, mx + (fx * c2 - fy * s2) * l2, my + (fx * s2 + fy * c2) * l2, 0.3, 5, rand);
      arc.end();
    }
  }
}

/** A hot point and a couple of short spokes where a bolt lands: crisp, no sheath. */
function foot(arc: Arc, x: number, y: number, nx: number, ny: number, show: number, rand: Rand): void {
  if (arc.nSub >= MAX_SUBS - 3) return;
  arc.begin(1.5, 1, show, true);
  arc.add(x, y);
  arc.add(x + 0.1, y);
  arc.end();
  const base = Math.atan2(ny, nx);
  const spokes = 2 + (rand() < 0.5 ? 1 : 0);
  for (let k = 0; k < spokes; k++) {
    const a = base + (rand() - 0.5) * 2.2;
    const len = 3 + rand() * 7;
    arc.begin(0.75, 0.9, show, true);
    arc.add(x, y);
    arc.add(x + Math.cos(a) * len * 0.5 + (rand() - 0.5) * 2, y + Math.sin(a) * len * 0.5 + (rand() - 0.5) * 2);
    arc.add(x + Math.cos(a) * len, y + Math.sin(a) * len);
    arc.end();
  }
}

/** How far from (x, y) in the direction (dx, dy) a bolt can go before it leaves its box. */
function room(arc: Arc, x: number, y: number, dx: number, dy: number): number {
  let t = Infinity;
  if (dx > 1e-3) t = Math.min(t, (arc.maxX - x) / dx);
  else if (dx < -1e-3) t = Math.min(t, (arc.minX - x) / dx);
  if (dy > 1e-3) t = Math.min(t, (arc.maxY - y) / dy);
  else if (dy < -1e-3) t = Math.min(t, (arc.minY - y) / dy);
  return Math.max(0, t);
}

/** Rolls the geometry again, for whichever shape the arc is. */
export function roll(arc: Arc, dt: number, rand: Rand): void {
  switch (arc.kind) {
    case CRAWL:
      arc.head += (arc.dir * arc.speed * dt) / (arc.loop?.step ?? 3);
      crawlPath(arc, rand);
      break;
    case LEAP:
      leapPath(arc, rand);
      break;
    case LEADER:
      // The channel is fixed once cut; only its brightness flickers.
      if (arc.n === 0) leaderPath(arc, rand);
      break;
    case TETHER:
      tetherPath(arc, rand);
      break;
  }
}

function crawlPath(arc: Arc, rand: Rand): void {
  const loop = arc.loop;
  if (!loop) return;
  const { xy, nm, count, step } = loop;
  arc.clear();
  const m = Math.min(90, Math.max(3, Math.floor(arc.length / step)));
  // Hot head, a dimmer middle, a dim tail: three flat steps, never a ramp.
  const c1 = Math.max(1, Math.round(m * 0.28));
  const c2 = Math.max(c1 + 1, Math.round(m * 0.62));
  // Up to three spurs, reaching off the surface from the hotter two thirds of the channel.
  const spurs = arc.spur > 0 && rand() < arc.spur ? 1 + (rand() < 0.55 ? 1 : 0) + (rand() < 0.25 ? 1 : 0) : 0;
  const at = [-1, -1, -1];
  for (let i = 0; i < spurs; i++) at[i] = Math.floor(rand() * c2);
  const sp = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  let px = 0;
  let py = 0;
  let hx = 0;
  let hy = 0;
  // The channel wanders near the edge rather than hugging it, smoothly along its length.
  let off = arc.amp * (0.5 + rand() * 0.9);
  arc.begin(1.15, 1);
  for (let k = 0; k <= m; k++) {
    if (k === c1 || k === c2) {
      arc.end();
      arc.begin(1, k === c1 ? 0.55 : 0.28);
      arc.add(px, py);
    }
    const f = arc.head - arc.dir * k;
    const i0 = Math.floor(f);
    const t = f - i0;
    const a = (((i0 % count) + count) % count) * 2;
    const b = ((((i0 + 1) % count) + count) % count) * 2;
    const x = xy[a]! + (xy[b]! - xy[a]!) * t;
    const y = xy[a + 1]! + (xy[b + 1]! - xy[a + 1]!) * t;
    const nx = nm[a]! + (nm[b]! - nm[a]!) * t;
    const ny = nm[a + 1]! + (nm[b + 1]! - nm[a + 1]!) * t;
    off = Math.min(arc.amp * 2.2, Math.max(arc.amp * 0.2, off + (rand() - 0.5) * arc.amp * 0.95));
    // The odd hop well clear of the surface, but never out of the box (a descender near the canvas floor).
    const lift = rand() < 0.045 ? arc.amp * (2.2 + rand() * 3) : 0;
    const d = Math.min(off + lift, Math.max(0.6, room(arc, x, y, nx, ny) - 5));
    px = x + nx * d + (rand() - 0.5) * 1.1;
    py = y + ny * d + (rand() - 0.5) * 1.1;
    arc.add(px, py);
    if (k === 0) {
      hx = px;
      hy = py;
    }
    for (let i = 0; i < spurs; i++) {
      if (at[i] === k) {
        sp[i * 3] = px;
        sp[i * 3 + 1] = py;
        sp[i * 3 + 2] = Math.atan2(ny, nx);
      }
    }
  }
  arc.end();
  for (let i = 0; i < spurs; i++) {
    const a = sp[i * 3 + 2]! + (rand() - 0.5) * 1.9;
    const sx = sp[i * 3]!;
    const sy = sp[i * 3 + 1]!;
    const len = Math.min(8 + rand() * (16 + arc.amp * 5), Math.max(4, room(arc, sx, sy, Math.cos(a), Math.sin(a)) - 5));
    arc.begin(0.62, 0.85);
    jag(arc, sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len, 0.34, 5, rand);
    arc.end();
  }
  // The head is hotter than the rest of the channel: a crisp point.
  arc.begin(1.5, 1, 0, true);
  arc.add(hx, hy);
  arc.add(hx + 0.1, hy);
  arc.end();
}

function leapPath(arc: Arc, rand: Rand): void {
  arc.clear();
  // The feet wander a little between re-rolls, as a real arc's roots do.
  const ax = arc.ax + (rand() - 0.5) * 3;
  const ay = arc.ay + (rand() - 0.5) * 3;
  const bx = arc.bx + (rand() - 0.5) * 3;
  const by = arc.by + (rand() - 0.5) * 3;
  arc.begin(1, 1);
  if (arc.lift > 0) {
    // A hop: up and over, through a point above the middle, as a free arc rises.
    const mx = (ax + bx) / 2 + (rand() - 0.5) * arc.lift * 0.9;
    const my = Math.min(ay, by) - arc.lift * (0.7 + rand() * 0.6);
    jag(arc, ax, ay, mx, my, arc.rough, arc.seg, rand);
    jag(arc, mx, my, bx, by, arc.rough, arc.seg, rand);
  } else {
    jag(arc, ax, ay, bx, by, arc.rough, arc.seg, rand);
  }
  arc.end();
  forks(arc, 0, arc.n, 0, rand);
  if (arc.feet) {
    foot(arc, ax, ay, arc.anx, arc.any, 0, rand);
    foot(arc, bx, by, arc.bnx, arc.bny, 0, rand);
  }
}

function leaderPath(arc: Arc, rand: Rand): void {
  arc.clear();
  arc.begin(1, 1);
  jag(arc, arc.ax, arc.ay, arc.bx, arc.by, arc.rough, arc.seg, rand);
  arc.end();
  // Forks and the landing light up with the strike, when the channel has fully grown.
  forks(arc, 0, arc.n, 1, rand);
  if (arc.feet) foot(arc, arc.bx, arc.by, arc.bnx, arc.bny, 1, rand);
}

function tetherPath(arc: Arc, rand: Rand): void {
  arc.clear();
  arc.begin(1, 1);
  jag(arc, arc.ax, arc.ay, arc.bx, arc.by, arc.rough, arc.seg, rand);
  arc.end();
  forks(arc, 0, arc.n, 0, rand);
  if (arc.feet) {
    foot(arc, arc.ax, arc.ay, arc.anx, arc.any, 0, rand);
    // And a hot point where it meets the pointer.
    foot(arc, arc.bx, arc.by, arc.ax - arc.bx, arc.ay - arc.by, 0, rand);
  }
}
