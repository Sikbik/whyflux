/**
 * Layout of the hexagon headline: which words go on which line, how big a hex is, how many rows
 * the letters get. Pure arithmetic with no DOM, so the height the headline will need is known
 * before the font has loaded and nothing moves when it does.
 *
 * The lattice is pointy-top (the Flux symbol's hexagon): rows are a fixed distance apart and every
 * other row is shifted half a cell. All sizes are whole device pixels (`P` is even), so every hex
 * is pixel-identical to its neighbours and the 1 px gaps stay crisp.
 */

/** Role of a line: the quiet setup (line one) or the loud payoff (line two). */
export type Role = 0 | 1;

/**
 * Hex pitches in device pixels: [P, Q] = [horizontal pitch (even), row pitch]. Q is about
 * 0.866 P, which is what makes the hexagons regular; a few percent either way is invisible.
 */
const PITCHES: readonly (readonly [number, number])[] = [
  [6, 5],
  [8, 7],
  [10, 9],
  [12, 10],
  [14, 12],
  [16, 14],
  [18, 16],
  [20, 17],
  [22, 19],
  [24, 21],
  [26, 22],
  [28, 24],
  [30, 26],
  [34, 29],
  [40, 35],
];

/** Ink width over ink height of each string in Montserrat 800 (measured), used only to size the layout. */
const ALPHA = { wide: 8.28, itKeeps: 4.29, running: 3.97, plug: 6.7 };

const WEIGHT = 800;
const TRACKING = { quiet: -0.01, loud: -0.02 };

export interface PlacedLine {
  text: string;
  role: Role;
  weight: number;
  /** Letter-spacing in em. */
  tracking: number;
  /** First lattice row of the line and how many rows its ink covers. */
  row0: number;
  rows: number;
}

export interface Layout {
  mode: 'wide' | 'stack';
  dpr: number;
  /** Horizontal pitch, row pitch and gap, in device pixels. */
  P: number;
  Q: number;
  g: number;
  /** Lattice size in cells. */
  cols: number;
  rows: number;
  /** Space above the first row centre, in device pixels (room for the hex tip). */
  pad: number;
  /** Canvas size in device pixels and in CSS pixels. */
  width: number;
  height: number;
  cssWidth: number;
  cssHeight: number;
  lines: PlacedLine[];
}

export interface LayoutInput {
  /** Width the headline may use, in CSS pixels. */
  width: number;
  /** Viewport height in CSS pixels: the headline takes a share of it. */
  vh: number;
  dpr: number;
}

/** What makes two layouts the same lattice (the canvas width alone is not part of it). */
export const layoutKey = (l: Layout) =>
  `${l.mode}|${l.P}|${l.Q}|${l.g}|${l.cols}|${l.rows}|${l.dpr}|${l.lines.map((x) => x.rows).join(',')}`;

function line(text: string, role: Role, row0: number, rows: number): PlacedLine {
  return {
    text,
    role,
    weight: WEIGHT,
    tracking: role ? TRACKING.loud : TRACKING.quiet,
    row0,
    rows,
  };
}

function build(
  mode: 'wide' | 'stack',
  [P, Q]: readonly [number, number],
  dpr: number,
  rowsBig: number,
  rowsQuiet: number,
  maxInkWidth: number,
): Layout {
  const gap = Math.max(3, Math.round(rowsBig * 0.18));
  const gapBig = Math.max(1, Math.round(rowsBig * 0.1));
  const lines: PlacedLine[] = [];
  let row = 0;
  lines.push(line('Pull the plug', 0, row, rowsQuiet));
  row += rowsQuiet + gap;
  if (mode === 'wide') {
    lines.push(line('It keeps running', 1, row, rowsBig));
    row += rowsBig;
  } else {
    lines.push(line('It keeps', 1, row, rowsBig));
    row += rowsBig + gapBig;
    lines.push(line('running', 1, row, rowsBig));
    row += rowsBig;
  }
  const pad = Math.ceil((2 * Q) / 3) + 2;
  const cols = Math.ceil(maxInkWidth / P) + 2;
  const width = cols * P + P / 2;
  const height = pad * 2 + (row - 1) * Q + 1;
  return {
    mode,
    dpr,
    P,
    Q,
    g: Math.max(1, Math.round(dpr)),
    cols,
    rows: row,
    pad,
    width,
    height,
    cssWidth: width / dpr,
    cssHeight: height / dpr,
    lines,
  };
}

interface Plan {
  /** Fewest and most rows the big line may have. */
  min: number;
  max: number;
  /** Tallest the whole headline may be, in device pixels, and the smallest hex, in device pixels. */
  budget: number;
  pMin: number;
  /** Line one's height as a share of the big line's. */
  quiet: number;
}

/**
 * Picks the biggest hex that still leaves the letters enough rows to be legible. On a wide
 * container "It keeps running" is one line; on a narrow one it stacks as "It keeps" / "running".
 */
export function computeLayout({ width, vh, dpr: rawDpr }: LayoutInput): Layout {
  const dpr = Math.min(3, Math.max(0.5, rawDpr));
  const W = Math.floor(width * dpr);
  const wide: Plan = {
    min: 17,
    max: 28,
    budget: Math.min(380, Math.max(230, vh * 0.34)) * dpr,
    pMin: 5.5 * dpr,
    quiet: 0.7,
  };
  const stack: Plan = {
    min: 16,
    max: 26,
    budget: Math.min(520, Math.max(300, vh * 0.46)) * dpr,
    pMin: 3.8 * dpr,
    quiet: 0.62,
  };

  const attempt = (mode: 'wide' | 'stack', plan: Plan): Layout | null => {
    const alpha = mode === 'wide' ? ALPHA.wide : Math.max(ALPHA.itKeeps, ALPHA.running);
    for (let i = PITCHES.length - 1; i >= 0; i--) {
      const pitch = PITCHES[i]!;
      const [P, Q] = pitch;
      if (P < plan.pMin) break;
      // Shave rows until the headline fits its share of the viewport.
      for (let n = Math.min(plan.max, Math.floor(W / (alpha * Q))); n >= plan.min; n--) {
        const quiet = Math.max(11, Math.round(n * plan.quiet));
        const ink = Math.max(alpha * n * Q, ALPHA.plug * quiet * Q);
        const l = build(mode, pitch, dpr, n, quiet, ink);
        if (l.height <= plan.budget && l.width <= W + P) return l;
      }
    }
    return null;
  };

  return (
    attempt('wide', wide) ??
    attempt('stack', stack) ??
    // Tiny containers: the smallest lattice, stacked, whatever the budget.
    build('stack', PITCHES[0]!, dpr, 16, 11, Math.floor(W))
  );
}
