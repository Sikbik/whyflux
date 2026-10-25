/**
 * The state of the headline's current: the pool of arcs, how charged each letter is, how much power
 * each line has, and a small queue of scripted events. It knows nothing of the canvas (paint.ts draws
 * it) and nothing of the script (director.ts tells it what to do), so it can be stepped at a fixed
 * rate and replayed exactly from a seed.
 */
import { mulberry32 } from '@/lib/rng';
import { Arc, CRAWL, LEADER, LEAP, type Rand, TETHER, roll } from './arcs';
import type { BuiltHeadline, Gap, Glyph } from './glyphs';

/** How long a letter stays white-hot after a strike, in seconds (the e-folding time). */
const CHARGE_TAU = 0.16;
const POOL = 40;

interface Timed {
  at: number;
  fn: () => void;
}

export interface CrawlOptions {
  speed?: number;
  length?: number;
  life?: number;
  gain?: number;
  delay?: number;
  /** Rides a counter (the inside of an e, p, g) instead of the outside. */
  inner?: boolean;
}

export interface BoltOptions {
  life?: number;
  gain?: number;
  delay?: number;
  lead?: number;
  fork?: number;
  rough?: number;
  seg?: number;
  width?: number;
  /** Outward normal at the far end (the direction its spokes fan out from). */
  nx?: number;
  ny?: number;
  feet?: boolean;
}

export class Scene {
  readonly h: BuiltHeadline;
  readonly rand: Rand;
  readonly arcs: Arc[] = [];
  /** Per letter: white-hot charge, 0 to 1. */
  readonly charge: Float32Array;
  /** Per line: brightness (0 is a dead line, 1 fully lit) and whether it is drawn at all. */
  readonly power: Float32Array;
  readonly shown: Uint8Array;
  /** A short jolt of the whole headline, in pixels, that dies away at once. */
  shake = 0;
  time = 0;
  /** Something changed that needs painting. The renderer clears it. */
  dirty = true;
  /** Something is still in motion (an arc, a charge, a jolt, a pointer to follow): the loop must keep stepping. */
  moving = true;
  /** Bounds of all the ink. */
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  /** Font size of the loud line, the unit most distances are measured in. */
  readonly unit: number;
  /** Core width of a bolt in pixels. */
  readonly bolt: number;
  /** Canvas size in pixels. */
  readonly width: number;
  readonly height: number;
  /** The highest a long bolt may start: clear of the page's header, which the canvas runs under. */
  readonly sky: number;
  /** How far from the ink the pointer still draws current. */
  readonly reach: number;

  private timed: Timed[] = [];
  /** Pointer position in canvas pixels, and whether it is near enough to draw to. */
  private px = 0;
  private py = 0;
  private near = false;
  /** The letter the pointer is over, or -1. */
  private over = -1;
  /** When the pointer last moved: a resting pointer gets calmer arcs. */
  private moved = 0;
  private readonly tethers: [Arc | null, Arc | null, Arc | null] = [null, null, null];
  /** The nearest points to the pointer, as x, y, nx, ny quads (scratch for `driveTethers`). */
  private readonly pair = new Float32Array(12);

  constructor(h: BuiltHeadline, seed: number, width: number, height: number, sky = 0) {
    this.h = h;
    this.width = width;
    this.height = height;
    this.rand = mulberry32(seed);
    this.charge = new Float32Array(h.glyphs.length);
    this.power = new Float32Array(h.lines.length).fill(1);
    this.shown = new Uint8Array(h.lines.length).fill(1);
    for (let i = 0; i < POOL; i++) this.arcs.push(new Arc());
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const g of h.glyphs) {
      x0 = Math.min(x0, g.x0);
      y0 = Math.min(y0, g.y0);
      x1 = Math.max(x1, g.x1);
      y1 = Math.max(y1, g.y1);
    }
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
    this.unit = h.lines[h.lines.length - 1]!.spec.size;
    this.bolt = Math.min(2.1, Math.max(1.15, 0.85 * (0.9 + this.unit / 110)));
    this.sky = Math.max(0, Math.min(sky, y0 - 8));
    this.reach = Math.min(170, Math.max(95, this.unit * 0.95));
  }

  /** Scene time of the next scheduled event, or Infinity. */
  get nextTimed(): number {
    return this.timed.length ? this.timed[0]!.at : Infinity;
  }

  /** Lets the clock run on through a lull in which nothing was moving (no arc, no charge, no random draw). */
  catchUp(time: number): void {
    if (time > this.time) this.time = time;
  }

  /** Runs `fn` after `delay` seconds of scene time. */
  later(delay: number, fn: () => void): void {
    const at = this.time + delay;
    let i = this.timed.length;
    while (i > 0 && this.timed[i - 1]!.at > at) i--;
    this.timed.splice(i, 0, { at, fn });
  }

  /** Advances the scene by `dt` seconds. */
  step(dt: number): void {
    this.time += dt;
    while (this.timed.length && this.timed[0]!.at <= this.time) {
      this.timed.shift()!.fn();
      this.dirty = true;
    }

    let moving = this.near;
    const decay = Math.exp(-dt / CHARGE_TAU);
    for (let i = 0; i < this.charge.length; i++) {
      const c = this.charge[i]!;
      if (c > 0) {
        // Below the first of the painter's sixteen levels a letter is its resting colour: let it rest.
        this.charge[i] = c < 0.03 ? 0 : c * decay;
        this.dirty = true;
        moving = true;
      }
    }
    if (this.shake > 0) {
      this.shake = this.shake < 0.05 ? 0 : this.shake * Math.exp(-dt / 0.045);
      this.dirty = true;
      moving = true;
    }

    this.driveTethers();

    for (const arc of this.arcs) {
      if (!arc.live) continue;
      this.dirty = true;
      moving = true;
      if (arc.delay > 0) {
        arc.delay -= dt;
        arc.alpha = 0;
        continue;
      }
      arc.age += dt;
      if (arc.age >= arc.life) {
        arc.live = false;
        arc.alpha = 0;
        continue;
      }
      arc.roll -= dt;
      if (arc.roll <= 0 || arc.n === 0) {
        arc.roll += arc.every * (0.75 + this.rand() * 0.5);
        arc.flick = 0.55 + this.rand() * 0.45;
        roll(arc, dt, this.rand);
      } else if (arc.kind === CRAWL) {
        // A crawler's head keeps moving between re-rolls.
        arc.head += (arc.dir * arc.speed * dt) / (arc.loop?.step ?? 3);
      }
      // Quick attack, a hold, then a fade over the back half of its life.
      const u = arc.age / arc.life;
      const attack = Math.min(1, arc.age / 0.014);
      const fade = u < 0.45 ? 1 : 1 - ((u - 0.45) / 0.55) ** 1.4;
      arc.alpha = attack * fade * arc.flick * arc.gain;
      if (arc.kind === LEADER) arc.reveal = Math.min(1, arc.age / arc.lead);
    }
    this.moving = moving;
  }

  // ---- letters --------------------------------------------------------------------------------

  /** Lights a letter white-hot (at least this much). */
  flash(glyph: Glyph | number, amount: number): void {
    const id = typeof glyph === 'number' ? glyph : glyph.id;
    if (amount > this.charge[id]!) this.charge[id] = amount;
    this.dirty = true;
    this.moving = true;
  }

  /** Lights up every letter of a line within `radius` of a point, the nearest first. */
  ripple(x: number, y: number, radius: number, amount: number, seconds: number, line = -1): void {
    for (const g of this.h.glyphs) {
      if (line >= 0 && g.line !== line) continue;
      const d = Math.hypot((g.x0 + g.x1) / 2 - x, (g.y0 + g.y1) / 2 - y);
      if (d > radius) continue;
      const k = d / radius;
      const delay = k * seconds;
      const v = amount * (1 - k * 0.35);
      if (delay < 0.004) this.flash(g, v);
      else this.later(delay, () => this.flash(g, v));
    }
  }

  // ---- arcs -----------------------------------------------------------------------------------

  private acquire(): Arc | null {
    for (const a of this.arcs) if (!a.live) return a;
    return null;
  }

  private start(arc: Arc, kind: Arc['kind'], life: number, gain: number, delay: number): Arc {
    arc.live = true;
    arc.kind = kind;
    arc.age = 0;
    arc.life = life;
    arc.gain = gain;
    arc.delay = delay;
    arc.alpha = 0;
    arc.flick = 1;
    arc.roll = 0;
    arc.reveal = 1;
    arc.width = this.bolt;
    arc.n = 0;
    arc.nSub = 0;
    arc.lift = 0;
    // Every bolt keeps to the canvas, below the header. (A tether runs on to a pointer that may be anywhere.)
    arc.minX = 0;
    arc.maxX = this.width;
    arc.minY = this.sky;
    arc.maxY = this.height;
    arc.confine = kind !== TETHER;
    this.moving = true;
    return arc;
  }

  /** A bolt that rides the outline of a letter. */
  crawl(g: Glyph, o: CrawlOptions = {}): Arc | null {
    const arc = this.acquire();
    if (!arc) return null;
    const rand = this.rand;
    // A counter too small for the sheath around a bolt would only glow as a blob: those are left alone.
    let pick = g.loops.filter((l) => l.hole === !!o.inner && (!l.hole || l.length > this.unit * 0.9));
    if (!pick.length) pick = g.loops.filter((l) => !l.hole);
    const loop = pick[Math.floor(rand() * pick.length)];
    if (!loop) return null;
    this.start(arc, CRAWL, o.life ?? 0.26 + rand() * 0.26, o.gain ?? 1, o.delay ?? 0);
    arc.loop = loop;
    arc.head = rand() * loop.count;
    arc.dir = rand() < 0.5 ? -1 : 1;
    arc.speed = o.speed ?? 650 + rand() * 850;
    arc.length = o.length ?? 90 + rand() * 150;
    arc.amp = 1.6 + this.unit / 90;
    arc.spur = 0.8;
    arc.every = 0.03;
    this.flash(g, 0.12 * (o.gain ?? 1));
    return arc;
  }

  /** A jagged bolt across the gap between two letters. */
  leap(gap: Gap, o: BoltOptions = {}): Arc | null {
    const arc = this.acquire();
    if (!arc) return null;
    this.start(arc, LEAP, o.life ?? 0.13 + this.rand() * 0.14, o.gain ?? 1, o.delay ?? 0);
    arc.ax = gap.ax;
    arc.ay = gap.ay;
    arc.bx = gap.bx;
    arc.by = gap.by;
    arc.anx = gap.anx;
    arc.any = gap.any;
    arc.bnx = gap.bnx;
    arc.bny = gap.bny;
    arc.rough = o.rough ?? 0.24;
    arc.seg = o.seg ?? 6;
    arc.fork = o.fork ?? 0.5;
    arc.feet = o.feet ?? true;
    arc.every = 0.036;
    if (o.width) arc.width = o.width;
    const a = this.h.glyphs[gap.a]!;
    const b = this.h.glyphs[gap.b]!;
    const light = () => {
      this.flash(a, 0.5 * (o.gain ?? 1));
      this.flash(b, 0.5 * (o.gain ?? 1));
    };
    if (o.delay) this.later(o.delay, light);
    else light();
    return arc;
  }

  /** A spark that hops over the tops of two letters, from the crown of one to the crown of the next. */
  hop(a: Glyph, b: Glyph, o: BoltOptions = {}): Arc | null {
    const arc = this.acquire();
    if (!arc) return null;
    this.start(arc, LEAP, o.life ?? 0.1 + this.rand() * 0.07, o.gain ?? 1, o.delay ?? 0);
    arc.ax = a.top[0]!;
    arc.ay = a.top[1]!;
    arc.bx = b.top[0]!;
    arc.by = b.top[1]!;
    arc.anx = a.top[2]!;
    arc.any = a.top[3]!;
    arc.bnx = b.top[2]!;
    arc.bny = b.top[3]!;
    arc.rough = o.rough ?? 0.2;
    arc.seg = o.seg ?? 6;
    arc.fork = o.fork ?? 0.35;
    arc.feet = o.feet ?? true;
    arc.every = 0.034;
    arc.lift = this.unit * (0.1 + this.rand() * 0.07);
    if (o.width) arc.width = o.width;
    const light = () => {
      this.flash(a, 0.4 * (o.gain ?? 1));
      this.flash(b, 0.4 * (o.gain ?? 1));
    };
    if (o.delay) this.later(o.delay, light);
    else light();
    return arc;
  }

  /**
   * A long bolt that grows from A to B, then strikes. It stays on the canvas and clear of the page's
   * header: both ends are brought inside, and so is every kink and fork along the way.
   */
  leader(ax: number, ay: number, bx: number, by: number, o: BoltOptions = {}): Arc | null {
    const arc = this.acquire();
    if (!arc) return null;
    this.start(arc, LEADER, o.life ?? 0.34, o.gain ?? 1, o.delay ?? 0);
    const edge = 3;
    arc.minX = edge;
    arc.maxX = this.width - edge;
    arc.minY = this.sky;
    arc.maxY = this.height - edge;
    arc.ax = Math.min(arc.maxX, Math.max(arc.minX, ax));
    arc.ay = Math.min(arc.maxY, Math.max(arc.minY, ay));
    arc.bx = Math.min(arc.maxX, Math.max(arc.minX, bx));
    arc.by = Math.min(arc.maxY, Math.max(arc.minY, by));
    arc.bnx = o.nx ?? 0;
    arc.bny = o.ny ?? -1;
    arc.rough = o.rough ?? 0.22;
    arc.seg = o.seg ?? 8;
    arc.fork = o.fork ?? 1;
    arc.lead = o.lead ?? 0.1;
    arc.feet = o.feet ?? true;
    arc.every = 0.03;
    arc.reveal = 0;
    if (o.width) arc.width = o.width;
    return arc;
  }

  // ---- the pointer ----------------------------------------------------------------------------

  /** Where the pointer is, in canvas pixels, or null when it has left. */
  pointer(x: number | null, y = 0): void {
    if (x === null) {
      this.near = false;
      return;
    }
    if (x !== this.px || y !== this.py) this.moved = this.time;
    this.px = x;
    this.py = y;
    this.near = this.reaches(x, y);
  }

  /** Whether a point is close enough to the ink for the pointer to draw current from it. */
  reaches(x: number, y: number): boolean {
    const r = this.reach;
    return x >= this.x0 - r && x <= this.x1 + r && y >= this.y0 - r && y <= this.y1 + r;
  }

  /** The letter whose ink covers a point, or -1 (the outlines, counted even-odd, so counters are open). */
  private inkAt(x: number, y: number): number {
    for (const g of this.h.glyphs) {
      if (x < g.x0 || x > g.x1 || y < g.y0 || y > g.y1) continue;
      let inside = false;
      for (const loop of g.loops) {
        const p = loop.xy;
        for (let i = 0, j = loop.count - 1; i < loop.count; j = i++) {
          const yi = p[i * 2 + 1]!;
          const yj = p[j * 2 + 1]!;
          if (yi > y !== yj > y && x < ((p[j * 2]! - p[i * 2]!) * (y - yi)) / (yj - yi) + p[i * 2]!) inside = !inside;
        }
      }
      if (inside) return g.id;
    }
    return -1;
  }

  /**
   * Up to three points on the letters near (x, y), nearest first, each at least `apart` pixels from
   * the ones before it, as x, y, nx, ny quads in `out`. Returns how many were found.
   */
  private nearest(x: number, y: number, reach: number, apart: number, out: Float32Array): number {
    let found = 0;
    for (let k = 0; k < 3; k++) {
      let best = reach * reach;
      let from: Float32Array | null = null;
      let at = 0;
      for (const g of this.h.glyphs) {
        if (x < g.x0 - reach || x > g.x1 + reach || y < g.y0 - reach || y > g.y1 + reach) continue;
        const t = g.terminals;
        scan: for (let i = 0; i < t.length; i += 4) {
          const d = (t[i]! - x) ** 2 + (t[i + 1]! - y) ** 2;
          if (d >= best) continue;
          for (let j = 0; j < found; j++) {
            if ((t[i]! - out[j * 4]!) ** 2 + (t[i + 1]! - out[j * 4 + 1]!) ** 2 < apart * apart) continue scan;
          }
          best = d;
          from = t;
          at = i;
        }
      }
      if (!from) break;
      for (let q = 0; q < 4; q++) out[found * 4 + q] = from[at + q]!;
      found++;
    }
    return found;
  }

  /** While the pointer is near the letters, plasma-ball arcs reach from their edges to it. */
  private driveTethers(): void {
    const reach = this.reach;
    if (!this.near) {
      this.tethers[0] = this.tethers[1] = this.tethers[2] = null;
      this.over = -1;
      return;
    }
    // A pointer that has come to rest gets calmer arcs, like a finger left on a plasma ball.
    const calm = this.time - this.moved > 1.2 ? 0.3 : 1;
    // On a letter itself there is nothing to reach for: the letter lights and crackles along its edge.
    const over = this.inkAt(this.px, this.py);
    if (over !== this.over) {
      this.over = over;
      if (over >= 0) this.flash(over, 0.45);
    }
    if (over >= 0) {
      this.tethers[0] = this.tethers[1] = this.tethers[2] = null;
      if (this.rand() < 0.2 * calm * calm + 0.02) {
        const r = this.rand;
        this.crawl(this.h.glyphs[over]!, { life: 0.1 + r() * 0.14, length: 35 + r() * 60, gain: 0.85, speed: 420 + r() * 520 });
      }
      return;
    }
    const found = this.nearest(this.px, this.py, reach, 34, this.pair);
    if (!found) return;
    for (let k = 0; k < found; k++) {
      const x = this.pair[k * 4]!;
      const y = this.pair[k * 4 + 1]!;
      const d = Math.hypot(x - this.px, y - this.py);
      const closeness = 1 - Math.min(1, d / reach);
      let arc = this.tethers[k];
      // A live filament follows the pointer; a free slot is re-struck now and then, more often the
      // closer the pointer is: it crackles.
      if (arc && arc.live && arc.kind === TETHER && arc.age < arc.life - 0.01) {
        this.aim(arc, x, y, this.pair[k * 4 + 2]!, this.pair[k * 4 + 3]!);
        continue;
      }
      if (this.rand() > (0.2 + closeness * 0.6 - k * 0.14) * calm) continue;
      const free = this.acquire();
      if (!free) continue;
      arc = this.start(free, TETHER, 0.07 + this.rand() * 0.13, (0.55 + closeness * 0.45) * (k === 0 ? 1 : 0.8), 0);
      arc.rough = 0.27;
      arc.seg = 6;
      arc.fork = 0.4;
      arc.every = 0.03;
      arc.feet = true;
      this.aim(arc, x, y, this.pair[k * 4 + 2]!, this.pair[k * 4 + 3]!);
      // A pooled arc belongs to one slot: if another slot still points at this one, it has let go of it.
      for (let j = 0; j < 3; j++) if (this.tethers[j] === arc) this.tethers[j] = null;
      this.tethers[k] = arc;
      // The letter it leaves lights up, more the closer the pointer.
      this.flash(this.glyphAt(x, y), (0.3 * closeness + 0.12) * calm);
    }
  }

  /** Points a tether from a letter's edge at the pointer, stopping a few pixels short so the cursor stays visible. */
  private aim(arc: Arc, x: number, y: number, nx: number, ny: number): void {
    const dx = this.px - x;
    const dy = this.py - y;
    const m = Math.hypot(dx, dy) || 1;
    const stop = Math.min(m * 0.5, 7);
    arc.ax = x;
    arc.ay = y;
    arc.bx = this.px - (dx / m) * stop;
    arc.by = this.py - (dy / m) * stop;
    arc.anx = nx;
    arc.any = ny;
  }

  private glyphAt(x: number, y: number): number {
    let best = 0;
    let bd = Infinity;
    for (const g of this.h.glyphs) {
      const d = Math.hypot((g.x0 + g.x1) / 2 - x, (g.y0 + g.y1) / 2 - y);
      if (d < bd) {
        bd = d;
        best = g.id;
      }
    }
    return best;
  }
}
