/**
 * Turns the headline's letterforms into hexagon cells. Each line is drawn in a heavy weight into
 * an offscreen canvas, then every cell of the lattice asks "how much of me is ink?": at half or
 * more, it is a lit hex. The result is plain arrays (cell centres, role, brightness, neighbours)
 * that the engine animates.
 */
import { mulberry32 } from '@/lib/rng';
import type { Layout, Role } from './layout';

export interface Cells {
  n: number;
  /** Cell centres in device pixels. */
  cx: Int32Array;
  cy: Int32Array;
  role: Uint8Array;
  /** Resting brightness step, 0 (dim) to 3 (bright). */
  shade: Uint8Array;
  /** The six neighbours that are lit cells too (-1 where there is none). */
  nb: Int32Array;
  /** Number of lit neighbours. */
  deg: Uint8Array;
  /** Lattice lookup (row * cols + col): cell index or -1. */
  grid: Int32Array;
  /** Connected letter parts: id per cell, the count, and each part's horizontal centre (0..1). */
  comp: Int32Array;
  compCount: number;
  compX: Float32Array;
  /** Hops from the cell to the seed of its letter part. */
  hop: Uint16Array;
  /** 1 for the cells of the word "plug" in the quiet line. */
  plug: Uint8Array;
  /** 1 where the cell sits in solid ink: nearly all of its two-hop neighbourhood is lit too. */
  thick: Uint8Array;
}

export interface SampleOptions {
  fontFamily: string;
  /** Share of a cell that must be ink for it to light. */
  threshold?: number;
}

/** How often each brightness step is picked, dim to bright, per role: mostly the middle two. */
const SHADE_WEIGHTS: Record<Role, readonly number[]> = {
  0: [0.05, 0.6, 0.3, 0.05],
  1: [0.08, 0.56, 0.31, 0.05],
};

/** Smooth value noise on the lattice so the brightness clusters a little, like groups of nodes. */
function noise2(seed: number): (x: number, y: number) => number {
  const rand = mulberry32(seed);
  const SIZE = 64;
  const table = new Float32Array(SIZE * SIZE);
  for (let i = 0; i < table.length; i++) table[i] = rand();
  const at = (x: number, y: number) => table[((y & (SIZE - 1)) * SIZE + (x & (SIZE - 1))) | 0]!;
  return (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = x - xi;
    const fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * sx;
    const b = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * sx;
    return a + (b - a) * sy;
  };
}

export function sampleCells(layout: Layout, { fontFamily, threshold = 0.5 }: SampleOptions): Cells {
  const { P, Q, cols, rows, pad, width, lines } = layout;
  // Small hexes are sampled at twice the resolution so a cell's share of ink is measured finely.
  const S = P < 10 ? 2 : 1;

  const centreX = (r: number, c: number) => c * P + P / 2 + (r & 1 ? P / 2 : 0);
  const centreY = (r: number) => pad + r * Q;

  const grid = new Int32Array(rows * cols).fill(-1);
  const list: { r: number; c: number; role: Role }[] = [];
  /** Where the word "plug" starts in the quiet line, in device pixels. */
  let plugX = Infinity;

  const mask = document.createElement('canvas');
  const mctx = mask.getContext('2d', { willReadFrequently: true });
  if (!mctx) throw new Error('2d canvas unavailable');

  for (const ln of lines) {
    const bandTop = centreY(ln.row0) - Q / 2;
    const bandH = ln.rows * Q;
    mask.width = Math.ceil(width * S);
    mask.height = Math.ceil(bandH * S);
    mctx.setTransform(1, 0, 0, 1, 0, 0);
    mctx.clearRect(0, 0, mask.width, mask.height);
    mctx.scale(S, S);
    mctx.textBaseline = 'alphabetic';
    mctx.fontKerning = 'normal';
    mctx.fillStyle = '#fff';

    // Size the type so the ink (top of the tallest ascender to bottom of the lowest descender)
    // exactly fills the line's rows.
    const setFont = (px: number) => {
      mctx.font = `${ln.weight} ${px}px ${fontFamily}`;
      mctx.letterSpacing = `${(ln.tracking * px).toFixed(2)}px`;
    };
    setFont(100);
    const ref = mctx.measureText(ln.text);
    const inkRef = ref.actualBoundingBoxAscent + ref.actualBoundingBoxDescent;
    let px = (bandH / inkRef) * 100;
    setFont(px);
    let m = mctx.measureText(ln.text);
    const inkW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    if (inkW > width - P * 2) {
      px *= (width - P * 2) / inkW;
      setFont(px);
      m = mctx.measureText(ln.text);
    }
    const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const x = (width - w) / 2 + m.actualBoundingBoxLeft;
    mctx.fillText(ln.text, x, m.actualBoundingBoxAscent);
    if (ln.role === 0) plugX = x + mctx.measureText('Pull the ').width;

    const data = mctx.getImageData(0, 0, mask.width, mask.height).data;
    const mw = mask.width;
    const mh = mask.height;
    const hx = (P * S) / 2;
    const hy = (Q * S) / 2;
    for (let r = ln.row0; r < ln.row0 + ln.rows; r++) {
      const my = (centreY(r) - bandTop) * S;
      const y0 = Math.max(0, Math.round(my - hy));
      const y1 = Math.min(mh, Math.round(my + hy));
      for (let c = 0; c < cols; c++) {
        const mx = centreX(r, c) * S;
        const x0 = Math.max(0, Math.round(mx - hx));
        const x1 = Math.min(mw, Math.round(mx + hx));
        let sum = 0;
        let count = 0;
        for (let yy = y0; yy < y1; yy++) {
          let o = (yy * mw + x0) * 4 + 3;
          for (let xx = x0; xx < x1; xx++, o += 4) {
            sum += data[o]!;
            count++;
          }
        }
        if (count && sum / (count * 255) >= threshold) {
          grid[r * cols + c] = list.length;
          list.push({ r, c, role: ln.role });
        }
      }
    }
  }
  mask.width = 0;
  mask.height = 0;

  const n = list.length;
  const cx = new Int32Array(n);
  const cy = new Int32Array(n);
  const row = new Int16Array(n);
  const col = new Int16Array(n);
  const role = new Uint8Array(n);
  const shade = new Uint8Array(n);
  const nb = new Int32Array(n * 6).fill(-1);
  const deg = new Uint8Array(n);

  // Brightness: a little white noise plus smooth noise, ranked per role so each step gets exactly
  // its share of the cells (and the brighter ones cluster a little, like groups of nodes).
  const field = noise2(0x5eed);
  const rand = mulberry32(0xf1ec5);
  const u = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const { r, c, role: rl } = list[i]!;
    cx[i] = centreX(r, c);
    cy[i] = centreY(r);
    row[i] = r;
    col[i] = c;
    role[i] = rl;
    u[i] = 0.4 * rand() + 0.6 * field(c * 0.34 + (r & 1) * 0.17, r * 0.42);
  }
  for (const rl of [0, 1] as const) {
    const ids: number[] = [];
    for (let i = 0; i < n; i++) if (role[i] === rl) ids.push(i);
    ids.sort((a, b) => u[a]! - u[b]!);
    const w = SHADE_WEIGHTS[rl];
    let acc = 0;
    let from = 0;
    for (let s = 0; s < w.length; s++) {
      acc += w[s]!;
      const to = s === w.length - 1 ? ids.length : Math.round(acc * ids.length);
      for (let k = from; k < to; k++) shade[ids[k]!] = s;
      from = to;
    }
  }

  // Neighbours (odd rows are shifted half a cell to the right).
  const idx = (r: number, c: number) => (r < 0 || r >= rows || c < 0 || c >= cols ? -1 : grid[r * cols + c]!);
  for (let i = 0; i < n; i++) {
    const r = row[i]!;
    const c = col[i]!;
    const o = r & 1 ? 1 : 0;
    const around = [
      idx(r, c - 1),
      idx(r, c + 1),
      idx(r - 1, c - 1 + o),
      idx(r - 1, c + o),
      idx(r + 1, c - 1 + o),
      idx(r + 1, c + o),
    ];
    let d = 0;
    for (let k = 0; k < 6; k++) {
      const j = around[k]!;
      nb[i * 6 + k] = j;
      if (j >= 0) d++;
    }
    deg[i] = d;
  }

  // Solid ink: how many cells sit within two hops (a full disc is 19). And the word "plug".
  const thick = new Uint8Array(n);
  const plug = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (role[i] === 0 && cx[i]! >= plugX - P / 2) plug[i] = 1;
    const seen = new Set<number>([i]);
    for (let k = 0; k < 6; k++) {
      const j = nb[i * 6 + k]!;
      if (j < 0) continue;
      seen.add(j);
      for (let q = 0; q < 6; q++) {
        const j2 = nb[j * 6 + q]!;
        if (j2 >= 0) seen.add(j2);
      }
    }
    if (seen.size >= 17) thick[i] = 1;
  }

  // Letter parts: connected components, each with a seed and hop distances from it.
  const comp = new Int32Array(n).fill(-1);
  const hop = new Uint16Array(n);
  const compX: number[] = [];
  let compCount = 0;
  const stack: number[] = [];
  for (let s = 0; s < n; s++) {
    if (comp[s]! >= 0) continue;
    const members: number[] = [];
    comp[s] = compCount;
    stack.push(s);
    while (stack.length) {
      const i = stack.pop()!;
      members.push(i);
      for (let k = 0; k < 6; k++) {
        const j = nb[i * 6 + k]!;
        if (j >= 0 && comp[j]! < 0) {
          comp[j] = compCount;
          stack.push(j);
        }
      }
    }
    // Seed: the member nearest the part's centre of mass, then breadth-first hops from it.
    let mx = 0;
    let my = 0;
    for (const i of members) {
      mx += cx[i]!;
      my += cy[i]!;
    }
    mx /= members.length;
    my /= members.length;
    let seed = members[0]!;
    let best = Infinity;
    for (const i of members) {
      const d = (cx[i]! - mx) ** 2 + (cy[i]! - my) ** 2;
      if (d < best) {
        best = d;
        seed = i;
      }
    }
    const seen = new Set<number>([seed]);
    let frontier = [seed];
    for (let h = 0; frontier.length; h++) {
      const next: number[] = [];
      for (const i of frontier) {
        hop[i] = h;
        for (let k = 0; k < 6; k++) {
          const j = nb[i * 6 + k]!;
          if (j >= 0 && !seen.has(j)) {
            seen.add(j);
            next.push(j);
          }
        }
      }
      frontier = next;
    }
    compX.push(mx / width);
    compCount++;
  }

  return {
    n,
    cx,
    cy,
    role,
    shade,
    nb,
    deg,
    grid,
    comp,
    compCount,
    compX: Float32Array.from(compX),
    hop,
    plug,
    thick,
  };
}
