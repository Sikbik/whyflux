/**
 * Chapter 05, the canvas of one lane. `FieldRenderer` owns a Canvas 2D context and draws the lane
 * from the simulation's state every frame: the hex-dot land, the hosts, the copies, the request
 * dots, and the effects that make a strike land (a shockwave, shards, a flicker to dark, a little
 * shake). It reads the sim, never writes to it, and allocates nothing in the frame loop: effects
 * live in fixed pools of typed arrays.
 *
 * Under reduced motion it draws the settled state only: no flicker, shake, dots, shards or loops.
 */
import { isLand } from '@/lib/globe/landmask';
import { FX, FX_CAP, type LaneState, MAX_BLAST, MAX_SLOTS, OUTCOME, type Sim, SLOT, STATUS } from '../sim/engine';
import { INSTALL_SIM_S, MINUTES_PER_SIM_S, type Weapon } from '../sim/model';
import { type Domain, type Layout, layoutLane } from './layout';

/* ---- palette --------------------------------------------------------------------------------- */

interface Palette {
  accent: string;
  hot: string;
  deep: string;
  alarm: string;
  alarmHot: string;
  warn: string;
  ok: string;
  text: string;
  muted: string;
  ink: string;
  ink2: string;
  dead: string;
  mono: string;
}

function rgbVar(cs: CSSStyleDeclaration, name: string, fallback: string): string {
  const parts = cs.getPropertyValue(name).trim().split(/\s+/).map(Number);
  return parts.length === 3 && parts.every(Number.isFinite) ? `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})` : fallback;
}

/** Reads the colour roles the lane wears (steel in the cold lanes, Flux blue in the Flux lane). */
function readPalette(el: Element): Palette {
  const cs = getComputedStyle(el);
  return {
    accent: rgbVar(cs, '--accent-rgb', 'rgb(79, 122, 212)'),
    hot: rgbVar(cs, '--accent-hot-rgb', 'rgb(174, 198, 255)'),
    deep: rgbVar(cs, '--accent-deep-rgb', 'rgb(43, 97, 209)'),
    alarm: rgbVar(cs, '--status-crit-rgb', 'rgb(255, 84, 112)'),
    alarmHot: 'rgb(255, 163, 178)',
    warn: rgbVar(cs, '--status-warn-rgb', 'rgb(255, 154, 61)'),
    ok: rgbVar(cs, '--status-ok-rgb', 'rgb(63, 220, 149)'),
    text: '#ffffff',
    muted: cs.getPropertyValue('--text-3').trim() || '#a5adbd',
    ink: rgbVar(cs, '--ink-0-rgb', 'rgb(6, 9, 15)'),
    ink2: '#11141b',
    dead: '#14080c',
    mono: cs.getPropertyValue('--font-mono').trim() || 'ui-monospace, monospace',
  };
}

/* ---- small helpers --------------------------------------------------------------------------- */

const HX = [0, 0.866, 0.866, 0, -0.866, -0.866] as const;
const HY = [-1, -0.5, 0.5, 1, 0.5, -0.5] as const;

/** A pointy-top hexagon sub-path (the caller begins and strokes or fills). */
function hex(ctx: CanvasRenderingContext2D | Path2D, x: number, y: number, r: number): void {
  ctx.moveTo(x + HX[0] * r, y + HY[0] * r);
  for (let i = 1; i < 6; i++) ctx.lineTo(x + HX[i]! * r, y + HY[i]! * r);
  ctx.closePath();
}

/** Two small triangles, the fast-forward mark, centred on y (the caller fills). */
function fastForward(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y - 3.2);
  ctx.lineTo(x + 4, y);
  ctx.lineTo(x, y + 3.2);
  ctx.closePath();
  ctx.moveTo(x + 4.6, y - 3.2);
  ctx.lineTo(x + 8.6, y);
  ctx.lineTo(x + 4.6, y + 3.2);
  ctx.closePath();
  ctx.fill();
}

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t: number): number => 1 - (1 - t) * (1 - t) * (1 - t);
const easeInOut = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/* effect kinds */
const K_ALARM = 0;
const K_HOT = 1;
const K_ACCENT = 2;
const K_WARN = 3;
const K_OK = 4;

/** What the sped-up clock stands for, said once in the corner of a field that is rebuilding. */
const SPEED_TEXT = `1 s = ${MINUTES_PER_SIM_S} min`;

const DASH_REGION: number[] = [3, 4];
const DASH_WARM: number[] = [2, 3];
const NO_DASH: number[] = [];
const SIGNS = [-1, 1] as const;

const RINGS = 56;
const SHARDS = 150;
const DOTS = 110;
const WIPES = 14;
const FLOATERS = 10;

/** How long the stepped flicker to dark lasts, and how fast it steps (DESIGN.md "Blackout"). */
const FLICKER_S = 0.62;
const FLICKER_STEP_S = 0.095;

interface FieldOptions {
  canvas: HTMLCanvasElement;
  /** Where the colour roles are read: an element that wears the lane's mood. */
  paletteSource: Element;
  sim: Sim;
  lane: number;
  domain: Domain;
}

interface Floater {
  x: number;
  y: number;
  t0: number;
  text: string;
  kind: number;
}

export class FieldRenderer {
  readonly lane: number;
  private readonly sim: Sim;
  private readonly L: LaneState;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly paletteSource: Element;
  private readonly domain: Domain;
  private pal: Palette;

  private w = 0;
  private h = 0;
  private dpr = 1;
  private layout: Layout | null = null;
  private land: HTMLCanvasElement | null = null;
  /** The same land in full white: a strike lights it for an instant. */
  private landHot: HTMLCanvasElement | null = null;
  private landFor = '';

  /** Which sim run this renderer last saw (a reset clears the effects). */
  private run = -1;
  private cursor = 0;
  private introT0 = -1;

  /* effects */
  private readonly flick: Float64Array;
  private readonly slotKind: Uint8Array;
  private readonly ringX = new Float32Array(RINGS);
  private readonly ringY = new Float32Array(RINGS);
  private readonly ringR0 = new Float32Array(RINGS);
  private readonly ringR1 = new Float32Array(RINGS);
  private readonly ringT0 = new Float64Array(RINGS);
  private readonly ringDur = new Float32Array(RINGS);
  private readonly ringKind = new Uint8Array(RINGS);
  private readonly ringW = new Float32Array(RINGS);
  private ringN = 0;

  private readonly shX = new Float32Array(SHARDS);
  private readonly shY = new Float32Array(SHARDS);
  private readonly shVX = new Float32Array(SHARDS);
  private readonly shVY = new Float32Array(SHARDS);
  private readonly shT0 = new Float64Array(SHARDS);
  private readonly shLife = new Float32Array(SHARDS);
  private readonly shSize = new Float32Array(SHARDS);
  private shN = 0;

  private readonly dotAX = new Float32Array(DOTS);
  private readonly dotAY = new Float32Array(DOTS);
  private readonly dotBX = new Float32Array(DOTS);
  private readonly dotBY = new Float32Array(DOTS);
  private readonly dotCX = new Float32Array(DOTS);
  private readonly dotCY = new Float32Array(DOTS);
  private readonly dotT0 = new Float64Array(DOTS);
  private readonly dotDur = new Float32Array(DOTS);
  private readonly dotKind = new Uint8Array(DOTS);
  /** The host the dot flies on to after this leg (a retried request), or -1. */
  private readonly dotChain = new Int16Array(DOTS);
  /** The host this leg ends at (for the landing burst), or -1. */
  private readonly dotEnd = new Int16Array(DOTS);
  private dotN = 0;

  private readonly wipeHost = new Int16Array(WIPES);
  private readonly wipeT0 = new Float64Array(WIPES);
  private wipeN = 0;

  private floaters: Floater[] = [];

  /** The rebuild countdown beside each lost copy: the text is rebuilt only when its minute changes. */
  private readonly cdMin = new Int16Array(MAX_SLOTS).fill(-1);
  private readonly cdText: string[] = Array.from({ length: MAX_SLOTS }, () => '');
  private readonly cdW = new Float32Array(MAX_SLOTS);
  /** Where this frame's labels went, so the next one can keep clear of them. */
  private readonly cdPX = new Float32Array(4);
  private readonly cdPY = new Float32Array(4);

  private flash = 0;
  private flashT0 = 0;
  private shake = 0;
  private shakeT0 = 0;

  /* hover */
  private preview = new Int16Array(MAX_BLAST);
  private previewN = 0;
  /** What the preview was last computed for (numbers, so checking it each frame allocates nothing). */
  private pvHost = -1;
  private pvWeapon = 0;
  private pvStrikes = -1;
  private pvRun = -1;
  private pvVersion = -1;
  private labelDesc = '';
  private labelTail = '';
  /** The plate's text, fitted to the field; rebuilt when the preview or the field size changes. */
  private labelText = '';
  private labelDirty = true;
  private misses: { x: number; y: number; t0: number }[] = [];

  /** False while the canvas is offscreen: the loop skips the draw and the renderer forgets what it missed. */
  visible = true;

  constructor(opts: FieldOptions) {
    this.lane = opts.lane;
    this.sim = opts.sim;
    this.L = opts.sim.lanes[opts.lane]!;
    this.canvas = opts.canvas;
    this.paletteSource = opts.paletteSource;
    this.domain = opts.domain;
    const ctx = opts.canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.ctx = ctx;
    this.pal = readPalette(opts.paletteSource);
    this.flick = new Float64Array(this.L.n).fill(-1);
    this.slotKind = new Uint8Array(this.L.n);
    this.cursor = opts.sim.fx.seq;
  }

  /* ---- sizing --------------------------------------------------------------------------------- */

  resize(cssW: number, cssH: number, dpr: number): void {
    if (cssW < 8 || cssH < 8) return;
    this.w = cssW;
    this.h = cssH;
    this.dpr = dpr;
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.pal = readPalette(this.paletteSource);
    this.layout = layoutLane(this.L.world, this.domain, cssW, cssH);
    this.labelDirty = true;
    this.buildLand();
  }

  get ready(): boolean {
    return this.layout !== null;
  }

  /** Re-reads the colours (the motion or theme changed). */
  refreshPalette(): void {
    this.pal = readPalette(this.paletteSource);
    this.buildLand();
  }

  private buildLand(): void {
    const lay = this.layout;
    if (!lay) return;
    const key = `${this.w}x${this.h}@${this.dpr}`;
    if (this.land && this.landHot && this.landFor === key) return;
    this.landFor = key;
    // The land is a field of tiny hexagons: where the dots go is worked out once, then painted twice
    // (quiet for the everyday picture, white for the flare a strike throws across it).
    const dots = new Path2D();
    const pitch = Math.max(3.5, Math.min(5.2, this.w / 92));
    const rowH = pitch * 0.866;
    let row = 0;
    for (let y = lay.mapY; y < lay.mapY + lay.mapH; y += rowH, row++) {
      const lat = this.domain.latTop - (y - lay.mapY) / lay.scaleY;
      for (let x = lay.mapX + (row % 2 ? pitch / 2 : 0); x < lay.mapX + lay.mapW; x += pitch) {
        const lon = this.domain.lonLeft + (x - lay.mapX) / lay.scale;
        if (isLand(lat, lon)) hex(dots, x, y, pitch * 0.34);
      }
    }
    const paint = (into: HTMLCanvasElement | null, color: string, alpha: number): HTMLCanvasElement | null => {
      const c = into ?? document.createElement('canvas');
      c.width = Math.round(this.w * this.dpr);
      c.height = Math.round(this.h * this.dpr);
      const g = c.getContext('2d');
      if (!g) return null;
      g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      g.clearRect(0, 0, this.w, this.h);
      g.fillStyle = color;
      g.globalAlpha = alpha;
      g.fill(dots);
      return c;
    };
    // The Flux lane's land is a little brighter than the steel of the other two: it is the one that is alive.
    this.land = paint(this.land, this.pal.accent, this.L.kind === 'flux' ? 0.5 : 0.32);
    this.landHot = paint(this.landHot, this.pal.text, 1);
  }

  /* ---- picking ---------------------------------------------------------------------------------- */

  /** The nearest host to a point, preferring one that is still up. -1 when nothing is within `maxDist`. */
  hostAt(px: number, py: number, maxDist: number): number {
    const lay = this.layout;
    if (!lay) return -1;
    let best = -1;
    let bestD = maxDist * maxDist;
    let bestDead = -1;
    let bestDeadD = maxDist * maxDist;
    for (let h = 0; h < this.L.n; h++) {
      const dx = lay.x[h]! - px;
      const dy = lay.y[h]! - py;
      const d = dx * dx + dy * dy;
      if (this.L.alive[h]) {
        if (d < bestD) {
          bestD = d;
          best = h;
        }
      } else if (d < bestDeadD) {
        bestDeadD = d;
        bestDead = h;
      }
    }
    return best >= 0 ? best : bestDead;
  }

  /** The nearest living host in a direction from `from`, for arrow keys. `from` < 0 starts at the first copy. */
  neighbor(from: number, dir: 'left' | 'right' | 'up' | 'down'): number {
    const lay = this.layout;
    const L = this.L;
    if (!lay) return from;
    if (from < 0 || from >= L.n) {
      for (let s = 0; s < L.nSlots; s++) {
        const h = L.slotHost[s]!;
        if (h >= 0 && L.alive[h]) return h;
      }
      for (let h = 0; h < L.n; h++) if (L.alive[h]) return h;
      return -1;
    }
    const fx = lay.x[from]!;
    const fy = lay.y[from]!;
    let best = from;
    let bestScore = Infinity;
    for (let h = 0; h < L.n; h++) {
      if (h === from || !L.alive[h]) continue;
      const dx = lay.x[h]! - fx;
      const dy = lay.y[h]! - fy;
      const along = dir === 'right' ? dx : dir === 'left' ? -dx : dir === 'down' ? dy : -dy;
      if (along < 2) continue;
      const across = dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx);
      const score = along + across * 1.6;
      if (score < bestScore) {
        bestScore = score;
        best = h;
      }
    }
    return best;
  }

  /** The position of a host in CSS px, for overlays. */
  position(h: number): { x: number; y: number } | null {
    const lay = this.layout;
    if (!lay || h < 0 || h >= this.L.n) return null;
    return { x: lay.x[h]!, y: lay.y[h]! };
  }

  /** A click that found nothing: a small ring where it landed. */
  miss(x: number, y: number, now: number): void {
    if (this.misses.length > 4) this.misses.shift();
    this.misses.push({ x, y, t0: now });
  }

  /* ---- effects ---------------------------------------------------------------------------------- */

  private addRing(x: number, y: number, r0: number, r1: number, t0: number, dur: number, kind: number, width: number): void {
    const i = this.ringN < RINGS ? this.ringN++ : 0;
    this.ringX[i] = x;
    this.ringY[i] = y;
    this.ringR0[i] = r0;
    this.ringR1[i] = r1;
    this.ringT0[i] = t0;
    this.ringDur[i] = dur;
    this.ringKind[i] = kind;
    this.ringW[i] = width;
  }

  private addShard(x: number, y: number, vx: number, vy: number, t0: number, life: number, size: number): void {
    const i = this.shN < SHARDS ? this.shN++ : 0;
    this.shX[i] = x;
    this.shY[i] = y;
    this.shVX[i] = vx;
    this.shVY[i] = vy;
    this.shT0[i] = t0;
    this.shLife[i] = life;
    this.shSize[i] = size;
  }

  private addDot(ax: number, ay: number, bx: number, by: number, t0: number, dur: number, kind: number, chain: number, end: number): void {
    if (this.dotN >= DOTS) return;
    const i = this.dotN++;
    this.dotAX[i] = ax;
    this.dotAY[i] = ay;
    this.dotBX[i] = bx;
    this.dotBY[i] = by;
    // The path bows a little: it leaves the sender sideways and falls onto the target.
    this.dotCX[i] = ax + (bx - ax) * 0.5;
    this.dotCY[i] = ay + (by - ay) * 0.12;
    this.dotT0[i] = t0;
    this.dotDur[i] = dur;
    this.dotKind[i] = kind;
    this.dotChain[i] = chain;
    this.dotEnd[i] = end;
  }

  private addFloater(x: number, y: number, t0: number, text: string, kind: number): void {
    if (this.floaters.length >= FLOATERS) this.floaters.shift();
    this.floaters.push({ x, y, t0, text, kind });
  }

  private clearEffects(): void {
    this.ringN = 0;
    this.shN = 0;
    this.dotN = 0;
    this.wipeN = 0;
    this.floaters.length = 0;
    this.misses.length = 0;
    this.flick.fill(-1);
    this.flash = 0;
    this.shake = 0;
  }

  /** Skips whatever happened while the canvas was not being drawn. */
  skip(): void {
    this.cursor = this.sim.fx.seq;
  }

  private drain(now: number): void {
    const ring = this.sim.fx;
    const lay = this.layout;
    if (!lay) return;
    let c = this.cursor;
    if (ring.seq - c > FX_CAP) c = ring.seq - FX_CAP;
    for (; c < ring.seq; c++) {
      const i = c % FX_CAP;
      if (ring.lane[i] !== this.lane) continue;
      const kind = ring.kind[i]!;
      if (kind === FX.REQUEST) {
        this.onRequest(now, ring.a[i]!, ring.b[i]!, ring.c[i]!);
      } else if (kind === FX.STRIKE) {
        this.onStrike(now, i);
      } else if (kind === FX.CLAIM) {
        const h = ring.a[i]!;
        if (h >= 0) this.addRing(lay.x[h]!, lay.y[h]!, 3, lay.r * 3.2, now, 0.9, K_WARN, 1.4);
      } else if (kind === FX.UP) {
        const h = ring.a[i]!;
        if (h >= 0) {
          this.addRing(lay.x[h]!, lay.y[h]!, 3, lay.r * 4.2, now + 0.35, 1.3, K_ACCENT, 1.8);
          if (this.wipeN < WIPES) {
            this.wipeHost[this.wipeN] = h;
            this.wipeT0[this.wipeN] = now;
            this.wipeN++;
          }
        }
      } else if (kind === FX.REVIVE) {
        this.addRing(lay.w / 2, lay.h / 2, 10, Math.min(lay.w, lay.h) * 0.47, now, 1.1, K_ACCENT, 2);
      }
    }
    this.cursor = ring.seq;
  }

  private onRequest(now: number, outcome: number, first: number, last: number): void {
    const lay = this.layout!;
    const gx = lay.gx;
    const gy = lay.gy + 5;
    if (outcome === OUTCOME.SERVED) {
      if (last >= 0) this.addDot(gx, gy, lay.x[last]!, lay.y[last]!, now, 0.55, K_HOT, -1, last);
    } else if (outcome === OUTCOME.RETRIED) {
      if (first >= 0 && last >= 0) this.addDot(gx, gy, lay.x[first]!, lay.y[first]!, now, 0.4, K_WARN, last, first);
    } else if (first >= 0) {
      this.addDot(gx, gy, lay.x[first]!, lay.y[first]!, now, 0.45, K_ALARM, -1, first);
    } else {
      // Nothing to send it to: it dies on the way.
      this.addDot(gx, gy, gx, gy + 34, now, 0.4, K_ALARM, -1, -1);
    }
  }

  private onStrike(now: number, i: number): void {
    const ring = this.sim.fx;
    const lay = this.layout!;
    const center = ring.a[i]!;
    const weapon = ring.b[i]! as Weapon;
    const k = ring.count[i]!;
    const cx = lay.x[center]!;
    const cy = lay.y[center]!;
    let maxD = 0;
    for (let j = 0; j < k; j++) {
      const h = ring.hosts[i * MAX_BLAST + j]!;
      this.flick[h] = now;
      const hx = lay.x[h]!;
      const hy = lay.y[h]!;
      maxD = Math.max(maxD, Math.hypot(hx - cx, hy - cy));
      // Shards: a few small hexagons thrown outward.
      const n = k > 12 ? 2 : 5;
      for (let s = 0; s < n; s++) {
        const a = ((h * 7 + s * 53 + this.sim.strikes * 13) % 360) * (Math.PI / 180);
        const sp = 30 + ((h * 31 + s * 17) % 50);
        this.addShard(hx, hy, Math.cos(a) * sp, Math.sin(a) * sp, now, 0.55 + ((s * 7) % 5) * 0.08, 1.4 + (s % 3) * 0.7);
      }
    }
    const reach = maxD + 22 + weapon * 7;
    this.addRing(cx, cy, 5, reach, now, 0.5 + weapon * 0.08, K_ALARM, 2.2);
    this.addRing(cx, cy, 3, reach * 0.62, now, 0.34, K_HOT, 1.6);
    if (weapon >= 3) this.addRing(cx, cy, 8, reach * 1.35, now + 0.08, 0.8, K_ALARM, 1.2);
    this.flash = [0.1, 0.16, 0.24, 0.32][weapon - 1]!;
    this.flashT0 = now;
    this.shake = [2.2, 3.4, 5, 6.5][weapon - 1]!;
    this.shakeT0 = now;
    this.addFloater(cx, cy - lay.r - 3, now, `−${k}`, K_ALARM);
  }

  /* ---- the frame -------------------------------------------------------------------------------- */

  draw(now: number, reduced: boolean): void {
    const lay = this.layout;
    if (!lay) return;
    const ctx = this.ctx;
    const sim = this.sim;
    const L = this.L;
    const pal = this.pal;

    if (sim.run !== this.run) {
      // A new run: forget the old effects. The first one plays the entrance; a reset just pulses.
      const first = this.run < 0;
      this.run = sim.run;
      this.clearEffects();
      this.cursor = sim.fx.seq;
      if (first) this.introT0 = now;
      else if (!reduced) this.addRing(lay.w / 2, lay.h / 2, 8, Math.min(lay.w, lay.h) * 0.47, now, 0.9, K_ACCENT, 1.6);
    }
    if (this.introT0 < 0) this.introT0 = now;
    if (reduced) this.cursor = sim.fx.seq;
    else this.drain(now);

    const T = sim.t;
    const r = lay.r;

    // Shake: a short decaying jitter, never under reduced motion.
    let ox = 0;
    let oy = 0;
    if (!reduced && this.shake > 0) {
      const age = now - this.shakeT0;
      const amp = this.shake * Math.exp(-age / 0.12);
      if (amp < 0.15) this.shake = 0;
      else {
        ox = Math.sin(now * 91) * amp;
        oy = Math.cos(now * 77) * amp;
      }
    }
    ctx.setTransform(this.dpr, 0, 0, this.dpr, ox * this.dpr, oy * this.dpr);
    ctx.clearRect(-12, -12, this.w + 24, this.h + 24);

    // Land, and the flare a strike throws across it: the same dots, white, for an instant.
    if (this.land) {
      ctx.globalAlpha = 1;
      ctx.drawImage(this.land, 0, 0, this.w, this.h);
      if (!reduced && this.flash > 0 && this.landHot) {
        const a = this.flash * 3.2 * Math.exp(-(now - this.flashT0) / 0.1);
        if (a < 0.02) this.flash = 0;
        else {
          ctx.globalAlpha = a > 1 ? 1 : a;
          ctx.drawImage(this.landHot, 0, 0, this.w, this.h);
          ctx.globalAlpha = 1;
        }
      }
    }

    // What each host is doing for the app.
    this.slotKind.fill(0);
    for (let s = 0; s < L.nSlots; s++) {
      const h = L.slotHost[s]!;
      if (h >= 0) this.slotKind[h] = L.slotState[s]!;
    }

    // Regions and sites: quiet outlines that group things.
    ctx.lineWidth = 1;
    if (lay.regions.length) {
      ctx.strokeStyle = pal.muted;
      ctx.globalAlpha = 0.28;
      ctx.setLineDash(DASH_REGION);
      for (const reg of lay.regions) {
        ctx.beginPath();
        ctx.arc(reg.cx, reg.cy, reg.rad, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash(NO_DASH);
    }
    ctx.strokeStyle = pal.text;
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    for (const site of lay.sites) {
      if (site.hosts.length < 2) continue;
      ctx.moveTo(site.cx + site.rad, site.cy);
      ctx.arc(site.cx, site.cy, site.rad, 0, Math.PI * 2);
    }
    ctx.stroke();

    // Country labels, quiet.
    if (lay.labels.length) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = pal.muted;
      ctx.font = `500 9px ${pal.mono}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const l of lay.labels) ctx.fillText(l.code, l.x, l.y);
    }

    // The links from the gateway to every copy that serves.
    ctx.lineWidth = 1;
    ctx.strokeStyle = pal.accent;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    for (let s = 0; s < L.nSlots; s++) {
      const h = L.slotHost[s]!;
      if (h < 0 || L.slotState[s] !== SLOT.UP) continue;
      const hx = lay.x[h]!;
      const hy = lay.y[h]!;
      ctx.moveTo(lay.gx, lay.gy + 5);
      ctx.quadraticCurveTo(lay.gx + (hx - lay.gx) * 0.5, lay.gy + 5 + (hy - lay.gy - 5) * 0.12, hx, hy);
    }
    ctx.stroke();

    // The blast preview sits under the hosts.
    this.updatePreview();
    const pulse = reduced ? 0.8 : 0.65 + 0.35 * Math.sin(now * 7);
    if (this.previewN > 0) {
      ctx.strokeStyle = pal.alarm;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      for (let i = 0; i < this.previewN; i++) {
        const h = this.preview[i]!;
        hex(ctx, lay.x[h]!, lay.y[h]!, r + 3.2);
      }
      ctx.stroke();
    }

    // Hosts.
    const introLen = 1.15;
    const intro = reduced ? 1 : clamp01((now - this.introT0) / (introLen + 0.9));
    for (let h = 0; h < L.n; h++) {
      const x = lay.x[h]!;
      const y = lay.y[h]!;
      let k = 1;
      if (intro < 1) {
        const delay = (Math.hypot(x - lay.gx, y - lay.gy) / Math.max(120, lay.w)) * 0.9;
        k = easeOut(clamp01((now - this.introT0 - delay) / 0.5));
        if (k <= 0) continue;
      }
      this.drawHost(ctx, h, x, y, r * k, now, T, reduced, pal);
    }
    this.drawCountdowns(ctx, lay, pal, T);

    // Before the first strike the copies invite one: a slow corner-bracket pulse on every host that runs the app.
    if (sim.strikes === 0 && intro >= 1 && !(sim.hover.lane === this.lane && sim.hover.host >= 0)) this.drawInvite(ctx, now, reduced, lay, pal);

    // Request dots.
    if (!reduced) this.drawDots(ctx, now, lay, pal);

    // Heal wipes: a bright line draws itself from the gateway to a copy that just came back.
    if (!reduced && this.wipeN > 0) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = pal.hot;
      for (let i = 0; i < this.wipeN; i++) {
        const u = (now - this.wipeT0[i]!) / 0.55;
        if (u >= 1.25) {
          this.wipeN--;
          this.wipeHost[i] = this.wipeHost[this.wipeN]!;
          this.wipeT0[i] = this.wipeT0[this.wipeN]!;
          i--;
          continue;
        }
        const h = this.wipeHost[i]!;
        const hx = lay.x[h]!;
        const hy = lay.y[h]!;
        const p = clamp01(u);
        const sx = lay.gx;
        const sy = lay.gy + 5;
        const mx = sx + (hx - sx) * 0.5;
        const my = sy + (hy - sy) * 0.12;
        // The curve up to p: split the quadratic.
        const ax = sx + (mx - sx) * p;
        const ay = sy + (my - sy) * p;
        const bx = mx + (hx - mx) * p;
        const by = my + (hy - my) * p;
        const qx = ax + (bx - ax) * p;
        const qy = ay + (by - ay) * p;
        ctx.globalAlpha = 1 - clamp01((u - 1) / 0.25);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(ax, ay, qx, qy);
        ctx.stroke();
      }
    }

    // Shards.
    if (!reduced && this.shN > 0) {
      ctx.fillStyle = pal.alarmHot;
      for (let i = 0; i < this.shN; i++) {
        const age = now - this.shT0[i]!;
        const life = this.shLife[i]!;
        if (age >= life) {
          this.shN--;
          this.copyShard(this.shN, i);
          i--;
          continue;
        }
        const u = age / life;
        const drag = 1 - u * 0.7;
        const x = this.shX[i]! + this.shVX[i]! * age * drag;
        const y = this.shY[i]! + this.shVY[i]! * age * drag + 14 * age * age;
        ctx.globalAlpha = (1 - u) * 0.9;
        ctx.beginPath();
        hex(ctx, x, y, this.shSize[i]! * (1 - u * 0.4));
        ctx.fill();
      }
    }

    // Rings.
    if (!reduced && this.ringN > 0) {
      for (let i = 0; i < this.ringN; i++) {
        const u = (now - this.ringT0[i]!) / this.ringDur[i]!;
        if (u >= 1) {
          this.ringN--;
          this.copyRing(this.ringN, i);
          i--;
          continue;
        }
        if (u < 0) continue;
        const e = easeOut(u);
        const k = this.ringKind[i]!;
        ctx.strokeStyle = k === K_ALARM ? pal.alarm : k === K_HOT ? pal.text : k === K_WARN ? pal.warn : k === K_OK ? pal.ok : pal.hot;
        ctx.lineWidth = Math.max(0.4, this.ringW[i]! * (1 - u * 0.7));
        ctx.globalAlpha = (1 - u) * (k === K_HOT ? 0.9 : 0.75);
        ctx.beginPath();
        ctx.arc(this.ringX[i]!, this.ringY[i]!, this.ringR0[i]! + (this.ringR1[i]! - this.ringR0[i]!) * e, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Floating numbers.
    if (!reduced && this.floaters.length) {
      ctx.font = `600 11px ${pal.mono}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = this.floaters.length - 1; i >= 0; i--) {
        const f = this.floaters[i]!;
        const u = (now - f.t0) / 1.0;
        if (u >= 1) {
          this.floaters.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = 1 - u * u;
        ctx.fillStyle = f.kind === K_ALARM ? pal.alarmHot : pal.text;
        ctx.fillText(f.text, f.x, f.y - easeOut(u) * 16);
      }
    }

    // Misses.
    if (this.misses.length) {
      ctx.strokeStyle = pal.muted;
      ctx.lineWidth = 1;
      for (let i = this.misses.length - 1; i >= 0; i--) {
        const m = this.misses[i]!;
        const u = (now - m.t0) / 0.45;
        if (u >= 1 || reduced) {
          this.misses.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = (1 - u) * 0.7;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 3 + 9 * easeOut(u), 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // The gateway.
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = L.status === STATUS.DOWN ? pal.alarm : pal.hot;
    ctx.fillStyle = pal.ink;
    ctx.beginPath();
    hex(ctx, lay.gx, lay.gy, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = L.status === STATUS.DOWN ? pal.alarm : pal.hot;
    ctx.beginPath();
    ctx.arc(lay.gx, lay.gy, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Hover: reticle and label.
    this.drawHover(ctx, now, reduced, lay, pal);

    ctx.globalAlpha = 1;
  }

  /** Moves the last live entry into slot `into` (the pools are unordered). */
  private copyRing(last: number, into: number): void {
    this.ringX[into] = this.ringX[last]!;
    this.ringY[into] = this.ringY[last]!;
    this.ringR0[into] = this.ringR0[last]!;
    this.ringR1[into] = this.ringR1[last]!;
    this.ringT0[into] = this.ringT0[last]!;
    this.ringDur[into] = this.ringDur[last]!;
    this.ringKind[into] = this.ringKind[last]!;
    this.ringW[into] = this.ringW[last]!;
  }

  /** Moves the last live entry into slot `into` (the pools are unordered). */
  private copyShard(last: number, into: number): void {
    this.shX[into] = this.shX[last]!;
    this.shY[into] = this.shY[last]!;
    this.shVX[into] = this.shVX[last]!;
    this.shVY[into] = this.shVY[last]!;
    this.shT0[into] = this.shT0[last]!;
    this.shLife[into] = this.shLife[last]!;
    this.shSize[into] = this.shSize[last]!;
  }

  /** Moves the last live entry into slot `into` (the pools are unordered). */
  private copyDot(last: number, into: number): void {
    this.dotAX[into] = this.dotAX[last]!;
    this.dotAY[into] = this.dotAY[last]!;
    this.dotBX[into] = this.dotBX[last]!;
    this.dotBY[into] = this.dotBY[last]!;
    this.dotCX[into] = this.dotCX[last]!;
    this.dotCY[into] = this.dotCY[last]!;
    this.dotT0[into] = this.dotT0[last]!;
    this.dotDur[into] = this.dotDur[last]!;
    this.dotKind[into] = this.dotKind[last]!;
    this.dotChain[into] = this.dotChain[last]!;
    this.dotEnd[into] = this.dotEnd[last]!;
  }


  /* ---- hosts ------------------------------------------------------------------------------------ */

  private drawHost(
    ctx: CanvasRenderingContext2D,
    h: number,
    x: number,
    y: number,
    r: number,
    now: number,
    T: number,
    reduced: boolean,
    pal: Palette,
  ): void {
    const L = this.L;
    const alive = L.alive[h] === 1;
    const kind = this.slotKind[h]!;
    let flicker = false;
    if (!reduced && this.flick[h]! >= 0) {
      const age = now - this.flick[h]!;
      if (age < FLICKER_S) flicker = Math.floor(age / FLICKER_STEP_S) % 2 === 0;
      else this.flick[h] = -1;
    }

    if (!alive) {
      // Offline: dark fill, an alarm outline, a small cross. The stepped flicker is the Blackout.
      ctx.globalAlpha = 1;
      ctx.fillStyle = flicker ? pal.alarm : pal.dead;
      ctx.strokeStyle = pal.alarm;
      ctx.lineWidth = flicker ? 1.8 : 1.1;
      ctx.beginPath();
      hex(ctx, x, y, r);
      ctx.fill();
      ctx.globalAlpha = flicker ? 1 : 0.55;
      ctx.stroke();
      ctx.globalAlpha = flicker ? 0.9 : 0.5;
      ctx.beginPath();
      const c = r * 0.36;
      ctx.moveTo(x - c, y - c);
      ctx.lineTo(x + c, y + c);
      ctx.moveTo(x + c, y - c);
      ctx.lineTo(x - c, y + c);
      ctx.strokeStyle = flicker ? pal.ink : pal.alarm;
      ctx.lineWidth = 1;
      ctx.stroke();

      if (kind === SLOT.WAIT || kind === SLOT.UNDETECTED) {
        // A rebuild is pending: an amber ring fills as the replacement is claimed.
        const s = this.slotOf(h);
        if (s >= 0) {
          const from = L.slotFail[s]!;
          const to = L.slotClaim[s]!;
          const p = clamp01((T - from) / Math.max(0.5, to - from));
          ctx.strokeStyle = pal.warn;
          ctx.lineWidth = 1.8;
          ctx.globalAlpha = 0.28;
          ctx.beginPath();
          ctx.arc(x, y, r + 4.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 0.95;
          ctx.beginPath();
          ctx.arc(x, y, r + 4.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
          ctx.stroke();
        }
      } else if (kind === SLOT.OWNER) {
        // Nothing will fix this by itself: a slow amber pulse asks for a hand.
        ctx.strokeStyle = pal.warn;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = reduced ? 0.8 : 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(now * 4));
        ctx.beginPath();
        ctx.arc(x, y, r + 4.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      return;
    }

    if (kind === SLOT.UP) {
      // A copy that serves: filled, white-hot rim, and a ring that breathes.
      ctx.globalAlpha = 1;
      ctx.fillStyle = pal.accent;
      ctx.strokeStyle = pal.text;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      hex(ctx, x, y, r);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 1;
      ctx.globalAlpha = reduced ? 0.4 : 0.22 + 0.2 * (0.5 + 0.5 * Math.sin(now * 2.6 + h * 1.7));
      ctx.beginPath();
      ctx.arc(x, y, r + 5.5, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    if (kind === SLOT.INSTALL || kind === SLOT.WARM) {
      const s = this.slotOf(h);
      const p = s >= 0 ? clamp01((T - L.slotT0[s]!) / Math.max(0.2, L.slotT[s]! - L.slotT0[s]!)) : 0;
      ctx.fillStyle = pal.accent;
      ctx.strokeStyle = pal.hot;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = kind === SLOT.WARM ? 0.55 : 0.2 + 0.2 * p;
      ctx.beginPath();
      hex(ctx, x, y, r);
      ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.stroke();
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      if (kind === SLOT.INSTALL) {
        ctx.globalAlpha = 0.28;
        ctx.arc(x, y, r + 4.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x, y, r + 4.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
      } else {
        ctx.setLineDash(DASH_WARM);
        ctx.globalAlpha = 0.9;
        ctx.arc(x, y, r + 4.5, 0, Math.PI * 2);
      }
      ctx.stroke();
      ctx.setLineDash(NO_DASH);
      return;
    }

    // An idle host.
    ctx.globalAlpha = 1;
    ctx.fillStyle = pal.ink2;
    ctx.strokeStyle = pal.text;
    ctx.lineWidth = 1;
    ctx.beginPath();
    hex(ctx, x, y, r);
    ctx.fill();
    ctx.globalAlpha = 0.22;
    ctx.stroke();
  }

  /**
   * Flux only. Beside a copy that is being rebuilt, the real minutes left until it is back, counting
   * down at the sped-up rate with a small fast-forward mark: the whole rebuild plays in seconds and
   * this is how the lane says what it stands for.
   */
  private drawCountdowns(ctx: CanvasRenderingContext2D, lay: Layout, pal: Palette, T: number): void {
    const L = this.L;
    if (L.kind !== 'flux') return;
    let setup = false;
    let placed = 0;
    for (let s = 0; s < L.nSlots && placed < 4; s++) {
      const st = L.slotState[s]!;
      let sec: number;
      if (st === SLOT.UNDETECTED) sec = L.slotClaim[s]! - T + INSTALL_SIM_S;
      else if (st === SLOT.WAIT) sec = L.slotT[s]! - T + INSTALL_SIM_S;
      else if (st === SLOT.INSTALL) sec = L.slotT[s]! - T;
      else continue;
      const h = L.slotHost[s]!;
      if (h < 0) continue;
      if (!setup) {
        setup = true;
        ctx.font = `600 10.5px ${pal.mono}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3.5;
        ctx.globalAlpha = 1;
      }
      const min = Math.max(1, Math.ceil(sec * MINUTES_PER_SIM_S));
      if (this.cdMin[s] !== min) {
        this.cdMin[s] = min;
        this.cdText[s] = min >= 90 ? `${(min / 60).toFixed(1)} h` : `${min} min`;
        this.cdW[s] = ctx.measureText(this.cdText[s]!).width;
      }
      const text = this.cdText[s]!;
      const total = 11 + this.cdW[s]!;
      const x = lay.x[h]!;
      let px = x + lay.r + 6;
      if (px + total > this.w - 3) px = x - lay.r - 6 - total;
      let py = Math.min(this.h - 8, Math.max(9, lay.y[h]! + lay.r + 4));
      // A crowded cluster: slide a label down until it is clear of the ones already placed, or leave it out.
      let nudges = 0;
      for (let k = 0; k < placed && nudges <= 3; k++) {
        if (Math.abs(px - this.cdPX[k]!) < total + 4 && Math.abs(py - this.cdPY[k]!) < 12) {
          py += 12;
          nudges++;
          k = -1;
        }
      }
      if (nudges > 3 || py > this.h - 6) continue;
      this.cdPX[placed] = px;
      this.cdPY[placed] = py;
      placed++;
      ctx.fillStyle = pal.warn;
      fastForward(ctx, px, py);
      ctx.strokeStyle = pal.ink;
      ctx.strokeText(text, px + 11, py + 0.5);
      ctx.fillStyle = pal.warn;
      ctx.fillText(text, px + 11, py + 0.5);
    }
    if (placed > 0) {
      fastForward(ctx, 6, this.h - 12);
      ctx.strokeStyle = pal.ink;
      ctx.strokeText(SPEED_TEXT, 17, this.h - 11.5);
      ctx.fillText(SPEED_TEXT, 17, this.h - 11.5);
    }
  }

  private slotOf(host: number): number {
    const L = this.L;
    for (let s = 0; s < L.nSlots; s++) if (L.slotHost[s] === host) return s;
    return -1;
  }

  /* ---- dots ------------------------------------------------------------------------------------- */

  private drawDots(ctx: CanvasRenderingContext2D, now: number, lay: Layout, pal: Palette): void {
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    for (let i = 0; i < this.dotN; i++) {
      const u = (now - this.dotT0[i]!) / this.dotDur[i]!;
      if (u >= 1) {
        // Landed: a small burst, and a retried request flies on from the dead copy to a live one.
        const kind = this.dotKind[i]!;
        const end = this.dotEnd[i]!;
        const chain = this.dotChain[i]!;
        const bx = this.dotBX[i]!;
        const by = this.dotBY[i]!;
        if (kind === K_HOT) this.addRing(bx, by, 2, lay.r * 1.5, now, 0.3, K_ACCENT, 1);
        else if (kind === K_WARN) this.addRing(bx, by, 2, lay.r * 1.9, now, 0.35, K_WARN, 1.4);
        else this.addRing(bx, by, 2, lay.r * 2.1, now, 0.4, K_ALARM, 1.6);
        if (chain >= 0 && end >= 0) {
          this.addDot(bx, by, lay.x[chain]!, lay.y[chain]!, now, 0.4, K_WARN, -1, chain);
          // addDot appends: the finished one is replaced below, the new leg stays at the end.
        }
        this.dotN--;
        this.copyDot(this.dotN, i);
        i--;
        continue;
      }
      const e = easeInOut(u);
      const t0 = Math.max(0, e - 0.2);
      const ax = this.dotAX[i]!;
      const ay = this.dotAY[i]!;
      const cx = this.dotCX[i]!;
      const cy = this.dotCY[i]!;
      const bx = this.dotBX[i]!;
      const by = this.dotBY[i]!;
      const k = this.dotKind[i]!;
      const x1 = (1 - e) * (1 - e) * ax + 2 * (1 - e) * e * cx + e * e * bx;
      const y1 = (1 - e) * (1 - e) * ay + 2 * (1 - e) * e * cy + e * e * by;
      const x0 = (1 - t0) * (1 - t0) * ax + 2 * (1 - t0) * t0 * cx + t0 * t0 * bx;
      const y0 = (1 - t0) * (1 - t0) * ay + 2 * (1 - t0) * t0 * cy + t0 * t0 * by;
      ctx.strokeStyle = k === K_ALARM ? pal.alarm : k === K_WARN ? pal.warn : pal.text;
      ctx.globalAlpha = k === K_HOT ? 0.7 : 0.95;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }

  /* ---- hover ------------------------------------------------------------------------------------ */

  private updatePreview(): void {
    const sim = this.sim;
    const hv = sim.hover;
    if (hv.lane !== this.lane || hv.host < 0) {
      this.previewN = 0;
      this.pvHost = -1;
      return;
    }
    if (
      hv.host === this.pvHost &&
      sim.weapon === this.pvWeapon &&
      sim.strikes === this.pvStrikes &&
      sim.run === this.pvRun &&
      this.L.uiVersion === this.pvVersion
    )
      return;
    this.pvHost = hv.host;
    this.pvWeapon = sim.weapon;
    this.pvStrikes = sim.strikes;
    this.pvRun = sim.run;
    this.pvVersion = this.L.uiVersion;
    this.labelDirty = true;
    const n = sim.blast(this.L, sim.weapon, hv.host, this.preview);
    // Only the hosts that are still up are worth outlining; count the ones that run the app.
    let k = 0;
    let copies = 0;
    for (let i = 0; i < n; i++) {
      const h = this.preview[i]!;
      if (!this.L.alive[h]) continue;
      this.preview[k++] = h;
      const st = this.slotKind[h];
      if (st === SLOT.UP || st === SLOT.UNDETECTED) copies++;
    }
    this.previewN = k;
    const noun = this.L.kind === 'flux' ? 'node' : 'machine';
    this.labelDesc = sim.describe(this.L, sim.weapon, hv.host);
    if (!this.L.alive[hv.host]) {
      this.labelTail = 'offline';
    } else {
      const count = k > 1 ? `${k} ${noun}s` : '';
      const mine =
        this.L.kind === 'flux' ? (copies === 0 ? 'no copy' : copies === 1 ? '1 copy' : `${copies} copies`) : copies === 0 ? 'no app' : 'the app';
      this.labelTail = count ? `${count} · ${mine}` : mine;
    }
  }

  private drawInvite(ctx: CanvasRenderingContext2D, now: number, reduced: boolean, lay: Layout, pal: Palette): void {
    const L = this.L;
    const arm = 3.6;
    const o = lay.r + 5;
    ctx.strokeStyle = pal.hot;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = reduced ? 0.5 : 0.2 + 0.42 * (0.5 + 0.5 * Math.sin(now * 2.4));
    ctx.beginPath();
    for (let s = 0; s < L.nSlots; s++) {
      if (L.slotState[s] !== SLOT.UP) continue;
      const h = L.slotHost[s]!;
      const x = lay.x[h]!;
      const y = lay.y[h]!;
      for (const sx of SIGNS) {
        for (const sy of SIGNS) {
          ctx.moveTo(x + sx * o, y + sy * (o - arm));
          ctx.lineTo(x + sx * o, y + sy * o);
          ctx.lineTo(x + sx * (o - arm), y + sy * o);
        }
      }
    }
    ctx.stroke();
  }

  private drawHover(ctx: CanvasRenderingContext2D, now: number, reduced: boolean, lay: Layout, pal: Palette): void {
    const hv = this.sim.hover;
    if (hv.lane !== this.lane || hv.host < 0 || hv.host >= this.L.n) return;
    const h = hv.host;
    const x = lay.x[h]!;
    const y = lay.y[h]!;
    const arm = 4.5;
    const o = lay.r + 5.5 + (reduced ? 0 : 1.2 * Math.sin(now * 8));
    ctx.globalAlpha = 1;
    ctx.strokeStyle = pal.text;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (const sx of SIGNS) {
      for (const sy of SIGNS) {
        ctx.moveTo(x + sx * o, y + sy * (o - arm));
        ctx.lineTo(x + sx * o, y + sy * o);
        ctx.lineTo(x + sx * (o - arm), y + sy * o);
      }
    }
    ctx.stroke();

    // The label, beside the host and kept inside the canvas.
    if (!this.labelDesc) return;
    ctx.font = `500 10.5px ${pal.mono}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    if (this.labelDirty) {
      this.labelDirty = false;
      const room = this.w - 8 - 14;
      let text = `${this.labelDesc} · ${this.labelTail}`;
      if (ctx.measureText(text).width > room) {
        // Too long for this field: keep the verdict, shorten the name.
        const tail = ` · ${this.labelTail}`;
        const tailW = ctx.measureText(tail).width;
        let name = this.labelDesc;
        while (name.length > 4 && ctx.measureText(name).width + tailW + 8 > room) name = name.slice(0, -1);
        text = `${name.trimEnd()}…${tail}`;
      }
      this.labelText = text;
    }
    // No plate: the words sit on the map with a dark outline, so they read on the dots.
    const text = this.labelText;
    const tw = ctx.measureText(text).width;
    let px = x + o + 8;
    if (px + tw > this.w - 4) px = x - o - 8 - tw;
    px = Math.max(4, px);
    const py = Math.min(this.h - 9, Math.max(9, y));
    ctx.globalAlpha = 1;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3.6;
    ctx.strokeStyle = pal.ink;
    ctx.strokeText(text, px, py + 0.5);
    ctx.fillStyle = pal.text;
    ctx.fillText(text, px, py + 0.5);
  }

  dispose(): void {
    this.land = null;
    this.landHot = null;
    this.layout = null;
  }
}
