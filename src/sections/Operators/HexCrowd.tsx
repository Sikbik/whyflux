import { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/cn';
import { clamp, easeOutCubic } from '@/lib/math';
import { mulberry32 } from '@/lib/rng';
import { useElementSize, useInView, usePageVisible, useReducedMotion } from '@/ui';
import { fitCanvas, hexPath, readRgb, rgba } from './canvas';
import styles from './HexCrowd.module.css';

export interface HexCrowdProps {
  /** One hexagon per operator identity. */
  count: number;
  /** Where the crowd gathers, as 0..1 of the width and height. */
  center?: readonly [number, number];
  seed?: number;
  /** Light up once, the first time it is seen. */
  ignite?: boolean;
  /** The text twin: what the picture shows. */
  label: string;
  className?: string;
}

interface Cell {
  x: number;
  y: number;
  /** 0..1, how bright this one sits at rest. */
  e: number;
  /** Seconds before it ignites. */
  delay: number;
}

const IGNITE_SPAN = 1.5;
const FADE = 0.55;
const SIN60 = Math.sqrt(3) / 2;

/**
 * A crowd of hexagons, one per operator identity, packed on the brand's hex lattice and gathered in
 * a ragged blob so it reads as people rather than as a grid. It carries no extra data: positions and
 * brightness are decoration, and the count is the only fact. Flat fills only. Drawn once; if `ignite`
 * is set it lights up a single time when first seen, then rests (the page is calm between beats).
 */
export function HexCrowd({ count, center = [0.5, 0.5], seed = 7, ignite = true, label, className }: HexCrowdProps) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const { width, height } = useElementSize(box);
  const seen = useInView(box, { once: true, rootMargin: '0px 0px -12% 0px' });
  const visible = usePageVisible();
  const reduced = useReducedMotion();
  const played = useRef(false);

  const [cx, cy] = center;
  const layout = useMemo(() => build(width, height, count, seed, cx, cy), [width, height, count, seed, cx, cy]);

  // Paint at rest; if asked to, light the crowd up once, the first time it is seen. Anything that
  // re-runs this mid-way (a resize, a hidden tab) simply finishes the picture.
  useEffect(() => {
    const el = canvas.current;
    if (!el || layout.cells.length === 0) return;
    const ctx = fitCanvas(el, width, height);
    if (!ctx) return;
    const accent = readRgb(el, '--accent-rgb', [79, 122, 212]);
    if (!ignite || !seen || played.current || reduced || !visible) {
      paint(ctx, width, height, layout, accent, Infinity);
      return;
    }
    played.current = true;
    const t0 = performance.now();
    const total = IGNITE_SPAN + FADE + 0.2;
    let id = 0;
    const step = (now: number) => {
      const t = (now - t0) / 1000;
      if (t < total) {
        paint(ctx, width, height, layout, accent, t);
        id = requestAnimationFrame(step);
      } else paint(ctx, width, height, layout, accent, Infinity);
    };
    paint(ctx, width, height, layout, accent, 0);
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [layout, width, height, ignite, seen, reduced, visible]);

  return (
    <div ref={box} className={cn(styles.crowd, className)} role="img" aria-label={label}>
      <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
    </div>
  );
}

interface Layout {
  cells: Cell[];
  r: number;
}

/** Cells on a hex lattice, chosen by a ragged blob around the centre, in a seeded order so the same data draws the same crowd. */
function build(w: number, h: number, count: number, seed: number, cx: number, cy: number): Layout {
  if (w < 40 || h < 40 || count <= 0) return { cells: [], r: 0 };
  const rand = mulberry32(seed);
  // Roughly half the lattice is occupied: enough empty cells for the edge to be ragged.
  const slots = Math.ceil(count * 2.1);
  const pitch = Math.max(5, Math.sqrt((w * h) / (slots * SIN60)));
  const rowH = pitch * SIN60;
  const cols = Math.max(1, Math.floor(w / pitch));
  const rows = Math.max(1, Math.floor(h / rowH));
  const scored: { x: number; y: number; score: number }[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = i * pitch + pitch / 2 + (j % 2 ? pitch / 2 : 0);
      const y = j * rowH + rowH / 2;
      // Distance from the gathering point, stretched to the box, so the blob follows its shape.
      const dx = (x / w - cx) / 0.5;
      const dy = (y / h - cy) / 0.5;
      const radial = Math.min(1.6, Math.hypot(dx * 0.82, dy));
      scored.push({ x, y, score: rand() * 0.62 + radial * 0.9 });
    }
  }
  scored.sort((a, b) => a.score - b.score);
  const chosen = scored.slice(0, Math.min(count, scored.length));
  const cells = chosen.map<Cell>((c) => ({ x: c.x, y: c.y, e: rand() ** 2.2, delay: rand() * IGNITE_SPAN }));
  return { cells, r: pitch * 0.5 * 0.82 };
}

function paint(ctx: CanvasRenderingContext2D, w: number, h: number, layout: Layout, accent: readonly [number, number, number], t: number): void {
  ctx.clearRect(0, 0, w, h);
  for (const cell of layout.cells) {
    const k = t === Infinity ? 1 : easeOutCubic(clamp((t - cell.delay) / FADE, 0, 1));
    if (k <= 0) continue;
    ctx.fillStyle = rgba(accent, (0.16 + 0.62 * cell.e) * k);
    ctx.beginPath();
    hexPath(ctx, cell.x, cell.y, layout.r * (0.55 + 0.45 * k));
    ctx.fill();
  }
}
