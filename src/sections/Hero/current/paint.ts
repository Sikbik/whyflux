/**
 * Paints a scene: the bolts, then the letters over them.
 *
 * A bolt is three crisp strokes of different widths drawn additively: a wide faint blue sheath, a
 * narrower pale-cyan layer, and a white-hot core. Stepped, not blurred, so the halo is a few hard
 * pixels around the stroke and nothing else glows. The letters are flat opaque colour (a line's
 * resting colour, mixed toward white-hot by how charged each letter is) and go on last, so current
 * runs behind the type: it can light a letter from its edges but never crosses a word.
 */
import { LEADER } from './arcs';
import type { Scene } from './scene';

type RGB = readonly [number, number, number];

export interface Palette {
  /** Resting colour of each line at no power and at full power. */
  dim: readonly [RGB, RGB];
  lit: readonly [RGB, RGB];
  /** The colour of a letter at full charge. */
  hot: RGB;
  /** The three layers of a bolt. */
  sheath: RGB;
  mid: RGB;
  core: RGB;
}

function parse(hex: string, fallback: RGB): RGB {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return fallback;
  let h = m[1]!;
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const n = Number.parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const mixRgb = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** The headline's colours, from the design tokens. */
export function readPalette(el: Element): Palette {
  const s = getComputedStyle(el);
  const tok = (name: string, fallback: RGB) => parse(s.getPropertyValue(name), fallback);
  const white = tok('--text-1', [255, 255, 255]);
  const steel = tok('--steel-700', [98, 110, 132]);
  const blue = tok('--accent', [79, 122, 212]);
  const black: RGB = [0, 0, 0];
  // A line with no power is colourless steel, still faintly there: the words never vanish, they lose
  // their light, and the payoff gains its colour back when the current does.
  return {
    dim: [mixRgb(steel, black, 0.15), mixRgb(steel, black, 0.15)],
    lit: [white, blue],
    hot: white,
    sheath: [48, 112, 255],
    mid: [128, 205, 255],
    core: [255, 255, 255],
  };
}

const LEVELS = 16;
/** Brightness curve of each layer (sheath, mid, core): the core falls off fastest. */
const EXPONENT = [0.7, 0.9, 1.4] as const;
const rgba = (c: RGB, a: number) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a.toFixed(3)})`;

export class Painter {
  private readonly fills = new Map<number, string>();
  private readonly sheath: string[];
  private readonly mid: string[];
  private readonly core: string[];

  constructor(private readonly pal: Palette) {
    const table = (c: RGB, max: number) => Array.from({ length: LEVELS + 1 }, (_, i) => rgba(c, (i / LEVELS) * max));
    this.sheath = table(pal.sheath, 0.3);
    this.mid = table(pal.mid, 0.6);
    this.core = table(pal.core, 1);
  }

  /** A letter's fill: its line's colour at this power, toward white-hot by its charge. */
  private fill(line: number, power: number, charge: number): string {
    const qp = Math.round(power * LEVELS);
    const qc = Math.round(charge * LEVELS);
    const key = (line * (LEVELS + 1) + qp) * (LEVELS + 1) + qc;
    let f = this.fills.get(key);
    if (!f) {
      const base = mixRgb(this.pal.dim[line === 0 ? 0 : 1], this.pal.lit[line === 0 ? 0 : 1], qp / LEVELS);
      const c = mixRgb(base, this.pal.hot, qc / LEVELS);
      f = `rgb(${Math.round(c[0])} ${Math.round(c[1])} ${Math.round(c[2])})`;
      this.fills.set(key, f);
    }
    return f;
  }

  paint(ctx: CanvasRenderingContext2D, scene: Scene, width: number, height: number): void {
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height);
    this.bolts(ctx, scene);
    this.letters(ctx, scene);
  }

  private letters(ctx: CanvasRenderingContext2D, scene: Scene): void {
    const { lines } = scene.h;
    // A jolt moves the whole headline a pixel or two, in a direction that changes as it dies.
    const sx = Math.sin(scene.time * 151) * scene.shake;
    const sy = Math.cos(scene.time * 197) * scene.shake * 0.6;
    for (let li = 0; li < lines.length; li++) {
      if (!scene.shown[li]) continue;
      const line = lines[li]!;
      ctx.font = line.font;
      // Only the first line is the quiet steel one; every other line is the Flux-blue payoff.
      const role = line.spec.tone;
      const power = scene.power[li]!;
      for (const g of line.glyphs) {
        ctx.fillStyle = this.fill(role, power, scene.charge[g.id]!);
        ctx.fillText(g.ch, g.x + sx, line.spec.baseline + sy);
      }
    }
  }

  private bolts(ctx: CanvasRenderingContext2D, scene: Scene): void {
    let any = false;
    for (const a of scene.arcs) {
      if (a.live && a.alpha >= 0.03) {
        any = true;
        break;
      }
    }
    if (!any) return;
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (let pass = 0; pass < 3; pass++) {
      const table = pass === 0 ? this.sheath : pass === 1 ? this.mid : this.core;
      for (const a of scene.arcs) {
        if (!a.live || a.alpha < 0.03) continue;
        const base = pass === 0 ? a.width * 3.1 + 1.6 : pass === 1 ? a.width * 1.7 + 0.7 : a.width;
        for (let s = 0; s < a.nSub; s++) {
          if (a.reveal < a.subShow[s]! || (pass === 0 && a.subBare[s])) continue;
          // As a bolt dims its white-hot core goes first and the blue stays: it never fades to grey.
          const alpha = (a.alpha * a.subAlpha[s]!) ** EXPONENT[pass]!;
          const level = Math.min(LEVELS, Math.round(alpha * LEVELS));
          if (level < 1) continue;
          ctx.lineWidth = base * a.subWidth[s]!;
          const from = a.subStart[s]!;
          const to = a.subStart[s + 1]!;
          if (a.kind === LEADER && s === 0 && a.reveal < 1) {
            // A growing leader: the channel so far, faint, with a hot tip.
            const upto = from + Math.max(2, Math.floor((to - from) * a.reveal));
            ctx.strokeStyle = table[Math.max(1, level >> 1)]!;
            stroke(ctx, a.pts, from, upto);
            ctx.strokeStyle = table[level]!;
            stroke(ctx, a.pts, Math.max(from, upto - 7), upto);
          } else {
            ctx.strokeStyle = table[level]!;
            stroke(ctx, a.pts, from, to);
          }
        }
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

function stroke(ctx: CanvasRenderingContext2D, pts: Float32Array, from: number, to: number): void {
  if (to - from < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[from * 2]!, pts[from * 2 + 1]!);
  for (let i = from + 1; i < to; i++) ctx.lineTo(pts[i * 2]!, pts[i * 2 + 1]!);
  ctx.stroke();
}
