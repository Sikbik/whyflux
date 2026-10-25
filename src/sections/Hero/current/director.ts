/**
 * The script. "Pull the plug" is a live circuit that crackles, then loses power (the lights stutter,
 * the sparks die). Then three conduits converge on the middle of the headline, pulse harder three
 * times like a capacitor charging, and strike: "It keeps running" surges on and stays alive.
 *
 * After that the headline is quiet most of the time: a small spark about once a second, a real arc
 * every second or two, a surge now and then (or on a tap), never constant noise.
 */
import type { Gap, Glyph } from './glyphs';
import type { Scene } from './scene';

interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  mid: number;
}

/** A line's power over time: [seconds after the start, power] steps (-1 hides the line). */
type Steps = ReadonlyArray<readonly [number, number]>;

const TAU = Math.PI * 2;
/** The entrance plays at this fraction of its written length, so the strike lands as the lede arrives. */
const TEMPO = 0.88;

export class Director {
  /** True once the entrance has played (or was skipped). */
  done = false;

  private readonly box: Box[] = [];
  private readonly loud: number[] = [];
  private readonly same: Gap[][] = [];
  private readonly cross: Gap[][] = [];
  private readonly byLine: Glyph[][] = [];
  /** Lines that have a line below them to hop to. */
  private readonly hops: number[] = [];
  private readonly core: { x: number; y: number };
  private sparkAt = Infinity;
  private ambientAt = Infinity;
  private surgeAt = Infinity;

  constructor(private readonly s: Scene) {
    const { lines, glyphs, gaps } = s.h;
    lines.forEach((line, i) => {
      const gs = line.glyphs;
      const x0 = Math.min(...gs.map((g) => g.x0));
      const x1 = Math.max(...gs.map((g) => g.x1));
      const y0 = Math.min(...gs.map((g) => g.y0));
      const y1 = Math.max(...gs.map((g) => g.y1));
      // The middle of the x-height band: where the eye reads a line, not the box of its ink.
      const mid = line.spec.baseline - line.spec.size * 0.26;
      this.box.push({ x0, x1, y0, y1, mid });
      this.byLine.push(gs);
      this.same.push([]);
      this.cross.push([]);
      if (i > 0) this.loud.push(i);
    });
    for (const g of gaps) {
      const la = glyphs[g.a]!.line;
      (g.cross ? this.cross : this.same)[la]!.push(g);
    }
    this.cross.forEach((list, i) => {
      if (list.length) this.hops.push(i);
    });
    // The point the conduits meet at: the middle of the gap between the first two lines.
    const a = this.box[0]!;
    const b = this.box[1]!;
    this.core = { x: (s.x0 + s.x1) / 2, y: (a.y1 + b.y0) / 2 };
  }

  // ---- the entrance ---------------------------------------------------------------------------

  start(): void {
    const s = this.s;
    const later = (t: number, fn: () => void) => s.later(t * TEMPO, fn);
    s.shown.fill(0);
    s.power.fill(1);
    this.done = false;

    // 1. The quiet line comes on with the stutter of a live circuit, and crackles.
    this.steps(TEMPO, [0], [[0.05, 0.8], [0.11, -1], [0.17, 1]]);
    for (const t of [0.17, 0.24, 0.31, 0.38, 0.45, 0.52]) {
      later(t, () => {
        this.crawlOn(0, { gain: 0.95, length: 90 + s.rand() * 110, life: 0.16 + s.rand() * 0.14 });
        if (s.rand() < 0.6) this.crawlOn(0, { gain: 0.8, length: 50 + s.rand() * 60 });
      });
    }
    for (const t of [0.22, 0.33, 0.41, 0.5]) later(t, () => this.leapOn(this.same[0]!, { gain: 0.9 }));

    // 2. The plug is pulled: everything on the line flashes, current rushes to its end and is thrown off.
    later(0.58, () => this.pull());
    this.steps(TEMPO, [0], [[0.68, 0.12], [0.77, 0.5], [0.86, 0.06], [0.96, 0]]);

    // 3. The payoff line is there but dead: it stutters in unlit, and one or two sparks try to catch.
    this.steps(TEMPO, this.loud, [[0.8, 0.3], [0.86, 0]]);
    for (const t of [1.0, 1.1]) {
      later(t, () => this.crawlOn(this.loud[0]!, { gain: 0.5, length: 35, life: 0.12 }));
    }

    // 4. Three conduits converge on the middle and pulse harder each time, then strike.
    later(1.18, () => this.pulse(0.35));
    later(1.27, () => this.pulse(0.6));
    later(1.36, () => this.pulse(1));
    later(1.44, () => this.strike());
    later(2.0, () => this.finish());
  }

  /** The finished state, at once (a rebuild after a resize, or reduced motion). */
  settle(): void {
    const s = this.s;
    s.shown.fill(1);
    s.power.fill(1);
    s.charge.fill(0);
    this.finish();
  }

  private finish(): void {
    const s = this.s;
    this.done = true;
    s.shown.fill(1);
    s.power.fill(1);
    this.sparkAt = s.time + 0.5;
    this.ambientAt = s.time + 0.7 + s.rand() * 0.8;
    this.surgeAt = s.time + 6 + s.rand() * 3;
  }

  /** Scene time of the next ambient event: while nothing is moving the loop can sleep until then. */
  nextAt(): number {
    return this.done ? Math.min(this.sparkAt, this.ambientAt, this.surgeAt) : Infinity;
  }

  /** Called every step: the ambient life of the headline. */
  update(): void {
    if (!this.done) return;
    const s = this.s;
    if (s.time >= this.sparkAt) {
      this.spark();
      this.sparkAt = s.time + 0.5 + s.rand() * 0.8;
    }
    if (s.time >= this.ambientAt) {
      this.ambient();
      this.ambientAt = s.time + 1.1 + s.rand() * 1.4;
    }
    if (s.time >= this.surgeAt) {
      this.surge();
      this.surgeAt = s.time + 9 + s.rand() * 6;
    }
  }

  // ---- beats ----------------------------------------------------------------------------------

  /** The plug comes out: a flash along the line, current racing to its end, a bolt thrown off it. */
  private pull(): void {
    const s = this.s;
    const box = this.box[0]!;
    for (const g of this.byLine[0]!) s.flash(g, 1);
    const gaps = [...this.same[0]!].sort((p, q) => p.ax - q.ax);
    gaps.forEach((g, k) => s.leap(g, { delay: 0.012 + k * 0.02, life: 0.12, gain: 1, fork: 0.3 }));
    const y = s.h.lines[0]!.spec.baseline;
    s.leader(box.x1 - 6, y - s.unit * 0.1, Math.min(s.width - 6, box.x1 + s.unit * 0.9), y - s.unit * 0.42, {
      lead: 0.07,
      life: 0.3,
      fork: 1.2,
      nx: 1,
      ny: 0,
    });
    s.shake = 2.4;
  }

  /** One pulse of the capacitor: three conduits, each reaching the middle a little harder. */
  private pulse(gain: number): void {
    const s = this.s;
    const { x, y } = this.core;
    const reach = (s.x1 - s.x0) * 0.5;
    // Upper left, straight above, upper right: a Y that points at the middle of the headline, its arms
    // starting just under the page's header.
    const top = s.sky + 3;
    const arms: ReadonlyArray<readonly [number, number]> = [
      [x - reach * (0.95 + s.rand() * 0.08), top + s.rand() * 10],
      [x + (s.rand() - 0.5) * s.unit * 0.5, top],
      [x + reach * (0.95 + s.rand() * 0.08), top + s.rand() * 10],
    ];
    for (const [ax, ay] of arms) {
      s.leader(ax, ay, x + (s.rand() - 0.5) * 6, y + (s.rand() - 0.5) * 6, {
        lead: 0.075,
        life: 0.21 + gain * 0.05,
        gain,
        fork: gain,
        rough: 0.2,
        width: s.bolt * (0.75 + gain * 0.35),
        feet: gain > 0.9,
      });
    }
    s.ripple(x, y, (s.x1 - s.x0) * 0.22, gain * 0.5, 0.1);
  }

  /** The strike: the payoff line lights from the middle outwards, current runs through it, the quiet line comes back. */
  private strike(): void {
    const s = this.s;
    const { x, y } = this.core;
    for (const li of this.loud) {
      s.shown[li] = 1;
      s.power[li] = 1;
    }
    s.shake = 2.8;
    // The crack: every letter of the payoff catches at once, then the ripple takes them to white-hot.
    for (const g of s.h.glyphs) if (g.line > 0) s.flash(g, 0.45);
    const span = (s.x1 - s.x0) * 0.62;
    for (const li of this.loud) s.ripple(x, y, span * 1.3, 1, 0.3, li);
    // Current runs through every gap of the payoff line, outwards from the middle.
    const gaps: Gap[] = [];
    for (const li of this.loud) gaps.push(...this.same[li]!);
    gaps.sort((p, q) => Math.abs((p.ax + p.bx) / 2 - x) - Math.abs((q.ax + q.bx) / 2 - x));
    gaps.forEach((g, k) => s.leap(g, { delay: 0.01 + k * 0.014, life: 0.15, gain: 1, fork: 0.4 }));
    for (let k = 0; k < 7; k++) {
      s.later(0.02 + k * 0.03, () => this.crawlOn(this.pickLoud(), { gain: 1, length: 80 + s.rand() * 120 }));
    }
    // The quiet line is restored by the surge: a stutter, then steady.
    this.steps(1, [0], [[0.06, 0.55], [0.14, 1]]);
    for (let k = 0; k < 3; k++) s.later(0.06 + k * 0.05, () => this.leapOn(this.cross[0]!, { gain: 0.9 }));
  }

  // ---- ambient --------------------------------------------------------------------------------

  /** A tiny flicker along an edge: the headline's idle crackle. */
  private spark(): void {
    const s = this.s;
    const line = s.rand() < 0.82 ? this.pickLoud() : 0;
    this.crawlOn(line, { gain: 0.55 + s.rand() * 0.35, length: 30 + s.rand() * 50, life: 0.07 + s.rand() * 0.1, speed: 300 + s.rand() * 500 });
  }

  /** A real arc: a crawl along a letter, a leap across a gap, a hop to the other line, or a run along the line. */
  private ambient(): void {
    const s = this.s;
    const r = s.rand();
    if (r < 0.3) {
      const line = s.rand() < 0.8 ? this.pickLoud() : 0;
      this.crawlOn(line, {});
      if (s.rand() < 0.4) s.later(0.05, () => this.crawlOn(line, {}));
    } else if (r < 0.5) {
      const line = s.rand() < 0.75 ? this.pickLoud() : 0;
      this.leapOn(this.same[line]!, {});
      if (s.rand() < 0.35) s.later(0.07, () => this.leapOn(this.same[line]!, {}));
    } else if (r < 0.7) {
      this.hopOn(s.rand() < 0.8 ? this.pickLoud() : 0);
      if (s.rand() < 0.5) s.later(0.06, () => this.hopOn(this.pickLoud()));
    } else if (r < 0.85) {
      const from = this.hops[Math.floor(s.rand() * this.hops.length)] ?? 0;
      this.leapOn(this.cross[from]!, { gain: 0.95 });
      if (s.rand() < 0.5) s.later(0.06, () => this.leapOn(this.cross[from]!, { gain: 0.8 }));
    } else {
      this.run(this.pickLoud());
    }
  }

  /** One hop over a letter or two. */
  private hopOn(line: number): void {
    const s = this.s;
    const gs = this.byLine[line]!;
    const i = Math.floor(s.rand() * (gs.length - 1));
    const a = gs[i];
    const b = gs[i + 1 + (s.rand() < 0.3 ? 1 : 0)] ?? gs[i + 1];
    if (a && b) s.hop(a, b, { gain: 1 });
  }

  /** Current runs along a line, hopping over the tops of the letters one after another like a fuse. */
  private run(line: number): void {
    const s = this.s;
    const gs = this.byLine[line]!;
    if (gs.length < 3) return;
    const dir = s.rand() < 0.5 ? 1 : -1;
    const count = Math.min(gs.length - 1, 5 + Math.floor(s.rand() * 5));
    const first = dir > 0 ? 0 : gs.length - 1;
    for (let k = 0; k < count; k++) {
      const a = gs[first + dir * k];
      const b = gs[first + dir * (k + 1)];
      if (!a || !b) break;
      s.hop(a, b, { delay: k * 0.05, life: 0.1 + s.rand() * 0.05, gain: 0.95 });
    }
  }

  /**
   * A surge: three conduits converge on a point of the payoff line and strike, the letters around it
   * flash in a ripple, and the line crackles. Also what a tap does.
   */
  surge(x?: number, y?: number): void {
    const s = this.s;
    const box = this.box[this.pickLoud()]!;
    const tx = x ?? box.x0 + (box.x1 - box.x0) * (0.15 + s.rand() * 0.7);
    const ty = y ?? box.mid;
    const reach = Math.max(s.unit * (1.5 + s.rand() * 0.7), s.width * 0.24);
    const lean = (s.rand() - 0.5) * 0.6;
    for (let k = 0; k < 3; k++) {
      const a = -Math.PI / 2 + lean + (k - 1) * (TAU / 6.4);
      // A strike near a side edge sends its arms in from the other side rather than off the screen.
      let ax = tx + Math.cos(a) * reach;
      if (ax < 12 || ax > s.width - 12) ax = tx - Math.cos(a) * reach;
      s.leader(ax, ty + Math.sin(a) * reach, tx, ty, {
        lead: 0.075,
        life: 0.32,
        fork: 1,
        rough: 0.2,
        width: s.bolt * 1.15,
        feet: k === 1,
      });
    }
    s.later(0.085, () => {
      s.shake = 2;
      s.ripple(tx, ty, s.unit * 3.2, 1, 0.22);
      const near = s.h.gaps
        .filter((g) => !g.cross && Math.hypot((g.ax + g.bx) / 2 - tx, (g.ay + g.by) / 2 - ty) < s.unit * 3.2)
        .sort((p, q) => Math.hypot((p.ax + p.bx) / 2 - tx, (p.ay + p.by) / 2 - ty) - Math.hypot((q.ax + q.bx) / 2 - tx, (q.ay + q.by) / 2 - ty));
      let last = -1;
      let n = 0;
      for (const g of near) {
        if (g.a === last) continue;
        last = g.a;
        s.leap(g, { delay: n * 0.016, life: 0.14, gain: 1, fork: 0.35 });
        if (++n >= 10) break;
      }
      for (let k = 0; k < 5; k++) {
        s.later(0.02 + k * 0.035, () => this.crawlOn(this.pickLoud(), { gain: 1, length: 70 + s.rand() * 110 }));
      }
    });
  }

  // ---- reduced motion -------------------------------------------------------------------------

  /** One still frame: finished type, and a few arcs held in place (two links between the lines, one hop). */
  still(): void {
    const s = this.s;
    this.settle();
    // Arcs that live "forever": rolled once, never again.
    const hold = (arc: ReturnType<Scene['leap']>) => {
      if (!arc) return;
      arc.life = 1e9;
      arc.every = 1e9;
      arc.gain = 0.85;
    };
    // The links nearest a third and two thirds of the way along the line.
    const links = [...(this.cross[this.hops[0] ?? 0] ?? [])].sort((p, q) => p.ax - q.ax);
    if (links.length) {
      const x0 = links[0]!.ax;
      const x1 = links[links.length - 1]!.ax;
      for (const at of [0.3, 0.72]) {
        const want = x0 + (x1 - x0) * at;
        let best = links[0]!;
        for (const g of links) if (Math.abs(g.ax - want) < Math.abs(best.ax - want)) best = g;
        hold(s.leap(best, { life: 1e9 }));
      }
    }
    const gs = this.byLine[this.loud[0] ?? 0] ?? [];
    const i = Math.floor(gs.length * 0.4);
    const a = gs[i];
    const b = gs[i + 1];
    if (a && b) hold(s.hop(a, b, { life: 1e9 }));
    // The type is uniform: the arcs stay, the flash they cause does not.
    s.charge.fill(0);
  }

  // ---- helpers --------------------------------------------------------------------------------

  private steps(tempo: number, lines: readonly number[], steps: Steps): void {
    const s = this.s;
    for (const [t, p] of steps) {
      s.later(t * tempo, () => {
        for (const li of lines) {
          if (p < 0) {
            s.shown[li] = 0;
          } else {
            s.shown[li] = 1;
            s.power[li] = p;
          }
        }
      });
    }
  }

  /** A random line of the payoff (the first line is the quiet one). */
  private pickLoud(): number {
    return this.loud[Math.floor(this.s.rand() * this.loud.length)]!;
  }

  private crawlOn(line: number, o: Parameters<Scene['crawl']>[1]): ReturnType<Scene['crawl']> {
    const gs = this.byLine[line]!;
    if (!gs.length) return null;
    const s = this.s;
    const g = gs[Math.floor(s.rand() * gs.length)]!;
    return s.crawl(g, { inner: s.rand() < 0.18, ...o });
  }

  private leapOn(gaps: readonly Gap[], o: Parameters<Scene['leap']>[1]): void {
    if (!gaps.length) return;
    const s = this.s;
    s.leap(gaps[Math.floor(s.rand() * gaps.length)]!, o);
  }
}
