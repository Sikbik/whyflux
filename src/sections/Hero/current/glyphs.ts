/**
 * The headline as individual letters: where each one sits, what its outline is, and which pairs of
 * letters have a gap small enough for a spark to cross.
 *
 * The letters are drawn on the canvas one at a time (so each can charge and flash on its own), at
 * x positions worked out from the browser's own shaping: the advance of a prefix minus the advance
 * of its last letter includes the kerning with its neighbour, and tracking is added on top.
 */
import { type Loop, traceLoops } from './contour';

/** Where a line goes and how it is set. Everything is already in canvas pixels. */
export interface LineSpec {
  text: string;
  size: number;
  weight: number;
  /** A CSS font-stretch keyword (the canvas font shorthand takes keywords only). */
  stretch: string;
  /** Letter-spacing in em. */
  tracking: number;
  /** Extra space added to each word gap, in em (tracking shrinks the face's own). */
  word: number;
  /** Baseline, from the top of the canvas. */
  baseline: number;
  /** Colour role: 0 for the steel line, 1 for the Flux blue line. */
  tone: 0 | 1;
}

export interface Glyph {
  ch: string;
  /** Index of the line this letter is on. */
  line: number;
  /** Index among all letters, for per-letter state arrays. */
  id: number;
  /** Left of the letter's origin, from the left of the canvas. */
  x: number;
  /** Outlines in canvas pixels. */
  loops: Loop[];
  /** Points on the outer outline, spaced out: x, y, nx, ny, ... (normals point out of the ink). */
  terminals: Float32Array;
  /** The highest point of the letter (x, y, nx, ny): where a spark hops off or lands from above. */
  top: Float32Array;
  /** Bounds of the ink. */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface BuiltLine {
  spec: LineSpec;
  /** The canvas `font` for the line. */
  font: string;
  left: number;
  width: number;
  glyphs: Glyph[];
}

/** A place where a spark can cross from one letter to another. */
export interface Gap {
  a: number;
  b: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  /** Outward normals at the two ends. */
  anx: number;
  any: number;
  bnx: number;
  bny: number;
  dist: number;
  /** Across the line break rather than between neighbours. */
  cross: boolean;
}

export interface BuiltHeadline {
  lines: BuiltLine[];
  glyphs: Glyph[];
  gaps: Gap[];
}

/**
 * The canvas `font` for a line. The face's width goes in as a font-stretch keyword; an engine that
 * does not take one in the canvas shorthand would drop the whole assignment (and draw at 10 px), so
 * it is probed once and left out where it is not understood. Measuring and drawing both come
 * through here, so the layout stays self-consistent either way.
 */
const fontString = (weight: number, stretch: string, size: number, family: string): string =>
  `${weight} ${stretch === 'normal' || !stretchWorks() ? '' : `${stretch} `}${size}px ${family}`;

let stretchOk: boolean | null = null;
function stretchWorks(): boolean {
  if (stretchOk === null) {
    const ctx = context(scratchCanvas());
    // An assignment the engine rejects leaves the old value in place (some engines apply the width
    // without echoing it back, so the keyword itself is not the test: the new size is).
    ctx.font = '10px serif';
    ctx.font = '400 expanded 20px serif';
    stretchOk = ctx.font.includes('20px');
  }
  return stretchOk;
}

// A detached canvas element (not an OffscreenCanvas) so the document's fonts resolve the same way
// everywhere.
let scratch: HTMLCanvasElement | null = null;
function scratchCanvas(): HTMLCanvasElement {
  scratch ??= document.createElement('canvas');
  return scratch;
}

type Ctx2D = CanvasRenderingContext2D;

function context(c: HTMLCanvasElement): Ctx2D {
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('no 2d canvas');
  return ctx;
}

/** Advance width of a string at one pixel of font size (kerning included, tracking not). */
export function advanceEm(text: string, weight: number, stretch: string, family: string): number {
  const ctx = context(scratchCanvas());
  ctx.font = fontString(weight, stretch, 100, family);
  return ctx.measureText(text).width / 100;
}

/** Cap height and descender of a face, in em, from its own metrics. */
export function faceMetrics(weight: number, stretch: string, family: string): { cap: number; descent: number } {
  const ctx = context(scratchCanvas());
  ctx.font = fontString(weight, stretch, 100, family);
  return {
    cap: ctx.measureText('H').actualBoundingBoxAscent / 100,
    descent: ctx.measureText('gpy').actualBoundingBoxDescent / 100,
  };
}

/** Spacing of the points the sparks leap from, in pixels. */
const TERMINAL_SPACING = 7;
/** Spacing of the points an arc rides along an outline, in pixels. */
const LOOP_STEP = 3;

/**
 * Lays the lines out centred on `centerX`, traces every letter and finds the gaps.
 * The font must already be loaded: it is measured and drawn here.
 */
export function buildHeadline(specs: readonly LineSpec[], family: string, centerX: number): BuiltHeadline {
  const probe = context(scratchCanvas());
  const raster = document.createElement('canvas');
  const rctx = context(raster);

  const lines: BuiltLine[] = [];
  const glyphs: Glyph[] = [];

  specs.forEach((spec, lineIndex) => {
    const font = fontString(spec.weight, spec.stretch, spec.size, family);
    probe.font = font;
    const chars = [...spec.text];
    const track = spec.tracking * spec.size;
    const gap = spec.word * spec.size;
    const spaces = chars.filter((c) => c === ' ').length;
    const width = probe.measureText(spec.text).width + track * (chars.length - 1) + gap * spaces;
    const left = centerX - width / 2;
    const built: Glyph[] = [];
    let prefix = '';
    let spacesBefore = 0;
    chars.forEach((ch, i) => {
      prefix += ch;
      // The origin of letter i: everything before it, kerned with it, plus the tracking so far.
      const x = left + probe.measureText(prefix).width - probe.measureText(ch).width + track * i + gap * spacesBefore;
      if (ch === ' ') spacesBefore++;
      if (ch === ' ') return;
      built.push(traceGlyph(ch, font, x, spec.baseline, lineIndex, glyphs.length + built.length, probe, raster, rctx));
    });
    glyphs.push(...built);
    lines.push({ spec, font, left, width, glyphs: built });
  });

  return { lines, glyphs, gaps: findGaps(glyphs, lines) };
}

function traceGlyph(
  ch: string,
  font: string,
  x: number,
  baseline: number,
  line: number,
  id: number,
  probe: Ctx2D,
  raster: HTMLCanvasElement,
  rctx: Ctx2D,
): Glyph {
  probe.font = font;
  const m = probe.measureText(ch);
  const margin = 4;
  // An integer-aligned box around the ink, so the raster lines up with the visible canvas.
  const bx = Math.floor(x - m.actualBoundingBoxLeft) - margin;
  const by = Math.floor(baseline - m.actualBoundingBoxAscent) - margin;
  const w = Math.ceil(x + m.actualBoundingBoxRight) + margin - bx;
  const h = Math.ceil(baseline + m.actualBoundingBoxDescent) + margin - by;
  raster.width = w;
  raster.height = h;
  rctx.font = font;
  rctx.fillStyle = '#fff';
  rctx.fillText(ch, x - bx, baseline - by);
  const rgba = rctx.getImageData(0, 0, w, h).data;
  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < alpha.length; i++) alpha[i] = rgba[i * 4 + 3]!;

  // Sample space has pixel (ix, iy) at (ix, iy): move to canvas space (the pixel's centre).
  const loops = traceLoops(alpha, w, h, LOOP_STEP);
  for (const loop of loops) {
    for (let i = 0; i < loop.count; i++) {
      loop.xy[i * 2] = loop.xy[i * 2]! + bx + 0.5;
      loop.xy[i * 2 + 1] = loop.xy[i * 2 + 1]! + by + 0.5;
    }
  }

  // Terminals: evenly spaced points of the outer outlines, where a spark can start or land.
  const pts: number[] = [];
  for (const loop of loops) {
    if (loop.hole) continue;
    const every = Math.max(1, Math.round(TERMINAL_SPACING / loop.step));
    for (let i = 0; i < loop.count; i += every) {
      pts.push(loop.xy[i * 2]!, loop.xy[i * 2 + 1]!, loop.nm[i * 2]!, loop.nm[i * 2 + 1]!);
    }
  }
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const loop of loops) {
    if (loop.hole) continue;
    for (let i = 0; i < loop.count; i++) {
      x0 = Math.min(x0, loop.xy[i * 2]!);
      x1 = Math.max(x1, loop.xy[i * 2]!);
      y0 = Math.min(y0, loop.xy[i * 2 + 1]!);
      y1 = Math.max(y1, loop.xy[i * 2 + 1]!);
    }
  }
  // The crown of the letter: the highest outline point whose normal faces up, else simply the highest.
  const top = new Float32Array(4);
  let best = Infinity;
  for (const facingUp of [true, false]) {
    for (let i = 0; i < pts.length; i += 4) {
      if (facingUp && pts[i + 3]! > -0.5) continue;
      if (pts[i + 1]! < best) {
        best = pts[i + 1]!;
        top.set([pts[i]!, pts[i + 1]!, pts[i + 2]!, pts[i + 3]!]);
      }
    }
    if (best < Infinity) break;
  }
  return { ch, line, id, x, loops, terminals: new Float32Array(pts), top, x0, y0, x1, y1 };
}

/**
 * Pairs of letters that are close enough for a spark to cross, with the closest facing points of
 * each. A pair only counts when both ends face each other, so a spark bridges an open gap and
 * never cuts through a letter's body.
 */
function findGaps(glyphs: readonly Glyph[], lines: readonly BuiltLine[]): Gap[] {
  const gaps: Gap[] = [];
  for (let a = 0; a < glyphs.length; a++) {
    const ga = glyphs[a]!;
    const size = lines[ga.line]!.spec.size;
    for (let b = a + 1; b < glyphs.length; b++) {
      const gb = glyphs[b]!;
      const cross = ga.line !== gb.line;
      // Neighbours on a line, or letters that overlap horizontally on the next line down.
      if (!cross && b !== a + 1) continue;
      if (cross && gb.line !== ga.line + 1) continue;
      if (cross && (gb.x0 > ga.x1 + size * 0.12 || ga.x0 > gb.x1 + size * 0.12)) continue;
      const reach = size * (cross ? 0.4 : 0.32);
      // The few closest facing pairs, kept apart from one another.
      const found: Gap[] = [];
      const ta = ga.terminals;
      const tb = gb.terminals;
      for (let i = 0; i < ta.length; i += 4) {
        for (let j = 0; j < tb.length; j += 4) {
          const dx = tb[j]! - ta[i]!;
          const dy = tb[j + 1]! - ta[i + 1]!;
          const d = Math.hypot(dx, dy);
          if (d > reach || d < 1) continue;
          // Both normals must lean toward the other end.
          if ((dx * ta[i + 2]! + dy * ta[i + 3]!) / d < 0.25) continue;
          if ((-dx * tb[j + 2]! - dy * tb[j + 3]!) / d < 0.25) continue;
          found.push({
            a,
            b,
            ax: ta[i]!,
            ay: ta[i + 1]!,
            bx: tb[j]!,
            by: tb[j + 1]!,
            anx: ta[i + 2]!,
            any: ta[i + 3]!,
            bnx: tb[j + 2]!,
            bny: tb[j + 3]!,
            dist: d,
            cross,
          });
        }
      }
      found.sort((p, q) => p.dist - q.dist);
      const kept: Gap[] = [];
      for (const g of found) {
        if (kept.length >= 3) break;
        if (kept.every((k) => Math.hypot(k.ax - g.ax, k.ay - g.ay) > 18)) kept.push(g);
      }
      gaps.push(...kept);
    }
  }
  return gaps;
}
