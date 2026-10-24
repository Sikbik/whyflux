import type { CSSProperties } from 'react';
import type { CategoryId } from './model';
import styles from './OpenMap.module.css';

/**
 * One pictogram per kind of deployment, all drawn from the same hexagon at the same size, so a cell
 * is always "one machine". The faint cells are the machines that could host the app (the pool: one,
 * a company's cluster, a vetted set, or an open field); the ringed and filled ones are where the app
 * actually runs. Tight and touching reads as one place, spread out reads as independent.
 *
 * Geometry is in "doubled" honeycomb coordinates (c, k), flat-top cells, c + k even.
 */

/** Grid pitch (a cell's slot) and drawn radius, a little smaller so cells keep a gutter. */
const PITCH = 11;
const RADIUS = 10;
/** The filled core of a running copy. */
const CORE = 7.2;
const H = Math.sqrt(3) / 2;
/** Room around the outermost cells for the stroke. */
const MARGIN = 1.4;

type Cell = readonly [c: number, k: number];

interface Spec {
  cells: readonly Cell[];
  /** Indices into `cells` where the app runs. */
  lit: readonly number[];
}

const at = (cells: readonly Cell[], c: number, k: number): number => cells.findIndex((x) => x[0] === c && x[1] === k);

/** An open field: seven columns wide, the corners trimmed off. */
const FIELD: readonly Cell[] = (() => {
  const out: Cell[] = [];
  for (let c = -3; c <= 3; c++) {
    for (let k = -3; k <= 3; k++) {
      if ((c + k) % 2 !== 0) continue;
      if (Math.abs(c) === 3 && Math.abs(k) === 3) continue;
      out.push([c, k]);
    }
  }
  return out;
})();

const CLOUD: readonly Cell[] = [
  [0, 0],
  [0, -2],
  [1, -1],
  [1, 1],
  [0, 2],
  [-1, 1],
  [-1, -1],
];

const APPROVED: readonly Cell[] = [
  [-2, -2],
  [0, -2],
  [2, -2],
  [-2, 2],
  [0, 2],
  [2, 2],
];

const SPECS: Record<CategoryId, Spec> = {
  own: { cells: [[0, 0]], lit: [0] },
  // Three copies in one cluster: the same company, the same place.
  cloud: { cells: CLOUD, lit: [0, 2, 3] },
  // Copies on several operators, but the pool is a short list.
  approved: { cells: APPROVED, lit: [1, 3, 5] },
  // The pool is open to anyone, and the app sits on one of it.
  market: { cells: FIELD, lit: [at(FIELD, -1, 1)] },
  // The pool is open to anyone, and the app runs on several, far apart.
  flux: {
    cells: FIELD,
    lit: [at(FIELD, -3, -1), at(FIELD, -1, 3), at(FIELD, 0, -2), at(FIELD, 2, 2), at(FIELD, 3, -1)],
  },
};

const num = (n: number): string => String(Math.round(n * 100) / 100);

const cx = (c: number): number => c * 1.5 * PITCH;
const cy = (k: number): number => k * H * PITCH;

/** A flat-top hexagon path of radius `r`, clockwise from the right vertex. */
function hex(x: number, y: number, r: number): string {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    d += `${i === 0 ? 'M' : 'L'}${num(x + r * Math.cos(a))} ${num(y + r * Math.sin(a))}`;
  }
  return `${d}Z`;
}

interface Drawn {
  key: string;
  ring: string;
  core: string | null;
  /** Position in the ripple that draws the cells, outward from the nearest copy. */
  order: number;
  /** Position among the copies, for the order they light in. */
  lit: number;
}

interface Shape {
  viewBox: string;
  /** The viewBox size in glyph units: the CSS scales the whole picture from these. */
  w: number;
  h: number;
  cells: readonly Drawn[];
}

function build(spec: Spec): Shape {
  const pts = spec.cells.map(([c, k]) => ({ x: cx(c), y: cy(k) }));
  const lit = spec.lit.map((i) => pts[i]).filter((p): p is { x: number; y: number } => p !== undefined);
  const nearest = (p: { x: number; y: number }): number => Math.min(...lit.map((l) => Math.hypot(l.x - p.x, l.y - p.y)));

  const ranked = pts.map((p, i) => ({ i, d: nearest(p) })).sort((a, b) => a.d - b.d || a.i - b.i);
  const order = new Map(ranked.map((r, rank) => [r.i, rank]));

  const x0 = Math.min(...pts.map((p) => p.x)) - RADIUS - MARGIN;
  const x1 = Math.max(...pts.map((p) => p.x)) + RADIUS + MARGIN;
  const y0 = Math.min(...pts.map((p) => p.y)) - RADIUS * H - MARGIN;
  const y1 = Math.max(...pts.map((p) => p.y)) + RADIUS * H + MARGIN;

  return {
    viewBox: `${num(x0)} ${num(y0)} ${num(x1 - x0)} ${num(y1 - y0)}`,
    w: Number(num(x1 - x0)),
    h: Number(num(y1 - y0)),
    cells: pts.map((p, i) => {
      const litAt = spec.lit.indexOf(i);
      return {
        key: String(i),
        ring: hex(p.x, p.y, RADIUS),
        core: litAt >= 0 ? hex(p.x, p.y, CORE) : null,
        order: order.get(i) ?? 0,
        lit: litAt,
      };
    }),
  };
}

const SHAPES: Record<CategoryId, Shape> = {
  own: build(SPECS.own),
  cloud: build(SPECS.cloud),
  approved: build(SPECS.approved),
  market: build(SPECS.market),
  flux: build(SPECS.flux),
};

/** The width of each picture in glyph units, so the map can size its columns to them. */
export const GLYPH_W: Record<CategoryId, number> = {
  own: SHAPES.own.w,
  cloud: SHAPES.cloud.w,
  approved: SHAPES.approved.w,
  market: SHAPES.market.w,
  flux: SHAPES.flux.w,
};

/** The pictogram of one kind of deployment. Decorative: the marker around it carries the name. */
export function Glyph({ id }: { id: CategoryId }) {
  const shape = SHAPES[id];
  return (
    <svg
      className={styles.glyph}
      viewBox={shape.viewBox}
      style={{ '--w': shape.w, '--h': shape.h } as CSSProperties}
      aria-hidden="true"
      focusable="false"
    >
      {shape.cells.map((c) => (
        <g key={c.key} className={styles.node} data-lit={c.core ? '' : undefined}>
          <path className={styles.ring} d={c.ring} pathLength={1} style={{ '--i': c.order } as CSSProperties} />
          {c.core ? <path className={styles.core} d={c.core} style={{ '--j': c.lit } as CSSProperties} /> : null}
        </g>
      ))}
    </svg>
  );
}
