import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { SeriesMarker } from '@/lib/compare';
import { easeOutCubic } from '@/lib/math';
import { IconButton, useIsPhone, useReducedMotion } from '@/ui';
import { HexPips } from './Glyph';
import { Marker } from './Marker';
import { groupLabel, ORDERED_DIMENSIONS, shortName } from './model';
import { nearestSpoke, polar, polygonPoints, spokeAngle, wrapLabel } from './radar';
import { labelSpokes, strongestLead, type Series } from './series';
import styles from './Radar.module.css';

interface Layout {
  w: number;
  h: number;
  cx: number;
  cy: number;
  R: number;
  labels: boolean;
}

/** The full chart has room for a name on every spoke; the phone's square one leaves names to the readout. */
const FULL: Layout = { w: 760, h: 600, cx: 380, cy: 300, R: 218, labels: true };
const COMPACT: Layout = { w: 380, h: 380, cx: 190, cy: 190, R: 150, labels: false };
const RINGS = 5;
const TWEEN_MS = 560;

export interface RadarProps {
  series: Series[];
  onOpenReceipt: (platformId: string, dimensionId: string, anchor: HTMLElement) => void;
}

/**
 * The radar: 14 spokes, one per question in group order, a web of five rings, Flux always drawn solid
 * blue with a flat 18 percent fill, the others as strokes (web2 dashed), each labelled where it stands
 * out. Hover a spoke (or step with the arrow keys, or tap) and the readout beside it lists every
 * series' answer to that question with a way into the receipt. A visually hidden table elsewhere
 * carries every value.
 */
export function Radar({ series, onOpenReceipt }: RadarProps) {
  const isPhone = useIsPhone();
  const L = isPhone ? COMPACT : FULL;
  const n = ORDERED_DIMENSIONS.length;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);

  const fallback = useMemo(() => strongestLead(series), [series]);
  const active = hover ?? pinned ?? fallback;
  const tags = useMemo(() => labelSpokes(series), [series]);

  const labelR = L.R + 22;

  const onMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'touch') return;
    const el = svgRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * L.w;
    const y = ((e.clientY - r.top) / r.height) * L.h;
    const dist = Math.hypot(x - L.cx, y - L.cy);
    setHover(dist < 18 ? null : nearestSpoke(L.cx, L.cy, x, y, n));
  };
  const onClick = (e: ReactMouseEvent<SVGSVGElement>) => {
    const el = svgRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * L.w;
    const y = ((e.clientY - r.top) / r.height) * L.h;
    if (Math.hypot(x - L.cx, y - L.cy) < 18) return;
    const i = nearestSpoke(L.cx, L.cy, x, y, n);
    setPinned((p) => (p === i ? null : i));
  };

  const move = (delta: number) => setPinned((((pinned ?? active) + delta) % n + n) % n);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') move(1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') move(-1);
    else if (e.key === 'Home') setPinned(0);
    else if (e.key === 'End') setPinned(n - 1);
    else if (e.key === 'Escape') setPinned(null);
    else return;
    e.preventDefault();
  };

  const dim = ORDERED_DIMENSIONS[active];
  const spokeText = dim
    ? `${dim.label}: ${series.map((s) => `${shortName(s.platform)} ${s.cells[active]?.verdict === 'na' ? 'not applicable' : s.scores[active]}`).join(', ')}`
    : '';

  return (
    <div className={styles.wrap}>
      <div className={styles.radar}>
        <div
          className={styles.chart}
          role="slider"
          tabIndex={0}
          aria-label="Question: arrow keys step through the spokes"
          aria-valuemin={1}
          aria-valuemax={n}
          aria-valuenow={active + 1}
          aria-valuetext={`${dim?.label ?? ''}, question ${active + 1} of ${n}`}
          onKeyDown={onKey}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${L.w} ${L.h}`}
            className={styles.svg}
            aria-hidden="true"
            focusable="false"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            onClick={onClick}
          >
            {/* The web: five rings and a spoke per question. */}
            {Array.from({ length: RINGS }, (_, k) => (
              <polygon
                key={k}
                className={styles.ring}
                data-outer={k === RINGS - 1 || undefined}
                points={polygonPoints(L.cx, L.cy, Array.from({ length: n }, () => (L.R * (k + 1)) / RINGS))}
              />
            ))}
            {ORDERED_DIMENSIONS.map((d, i) => {
              const p = polar(L.cx, L.cy, L.R, spokeAngle(i, n));
              return (
                <line
                  key={d.id}
                  className={styles.spoke}
                  data-active={i === active || undefined}
                  x1={L.cx}
                  y1={L.cy}
                  x2={p.x}
                  y2={p.y}
                />
              );
            })}

            {series.map((s, si) => (
              <Shape key={s.platform.id} s={s} index={si} L={L} />
            ))}

            {/* The active spoke: a marker on every series' score. */}
            {dim
              ? series.map((s) => {
                  const p = polar(L.cx, L.cy, (L.R * (s.scores[active] ?? 0)) / 5, spokeAngle(active, n));
                  return <SvgMarker key={s.platform.id} shape={s.marker} color={s.color} x={p.x} y={p.y} r={5.2} ring />;
                })
              : null}

            {/* Direct labels, each where its series stands out. */}
            {series.map((s, si) => {
              const i = tags[si] ?? 0;
              const deg = spokeAngle(i, n);
              const score = s.scores[i] ?? 0;
              const inward = score >= 4;
              const v = polar(L.cx, L.cy, (L.R * score) / 5, deg);
              const lab = polar(L.cx, L.cy, (L.R * score) / 5 + (inward ? -16 : 18), deg);
              const cos = Math.cos((deg * Math.PI) / 180);
              const anchor = Math.abs(cos) < 0.3 ? 'middle' : (cos > 0) !== inward ? 'start' : 'end';
              const sin = Math.sin((deg * Math.PI) / 180);
              return (
                <g key={s.platform.id} className={styles.tag} style={{ '--i': si } as CSSProperties}>
                  <SvgMarker shape={s.marker} color={s.color} x={v.x} y={v.y} r={4.6} ring />
                  {L.labels ? (
                    <text className={styles.tagText} x={lab.x} y={lab.y + 4 + sin * 4} textAnchor={anchor}>
                      {shortName(s.platform)}
                    </text>
                  ) : null}
                </g>
              );
            })}

            {/* The questions, named once, outside the rings. */}
            {L.labels
              ? ORDERED_DIMENSIONS.map((d, i) => {
                  const deg = spokeAngle(i, n);
                  const p = polar(L.cx, L.cy, labelR, deg);
                  const cos = Math.cos((deg * Math.PI) / 180);
                  const sin = Math.sin((deg * Math.PI) / 180);
                  const lines = wrapLabel(d.label, 16);
                  const lh = 14.5;
                  const h = lh * lines.length;
                  const anchor = cos > 0.28 ? 'start' : cos < -0.28 ? 'end' : 'middle';
                  const x = p.x + (anchor === 'start' ? 3 : anchor === 'end' ? -3 : 0);
                  const y0 = p.y + (sin * h) / 2 - h / 2 + lh * 0.78;
                  return (
                    <text key={d.id} className={styles.dimLabel} data-active={i === active || undefined} textAnchor={anchor}>
                      {lines.map((line, k) => (
                        <tspan key={k} x={x} y={y0 + k * lh}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  );
                })
              : null}
          </svg>
        </div>

        <Readout
          series={series}
          active={active}
          pinned={pinned !== null && hover === null}
          onStep={move}
          onOpenReceipt={onOpenReceipt}
        />
        <p className="sr-only" aria-live="polite">
          {spokeText}
        </p>
      </div>
    </div>
  );
}

/** One series' polygon. It grows from the centre on mount (rAF, no re-render per frame). */
function Shape({ s, index, L }: { s: Series; index: number; L: Layout }) {
  const reduced = useReducedMotion();
  const poly = useRef<SVGPolygonElement | null>(null);
  const n = s.scores.length;
  const target = useMemo(() => s.scores.map((v) => (L.R * v) / 5), [s.scores, L.R]);
  const zeros = useMemo(() => polygonPoints(L.cx, L.cy, Array.from({ length: n }, () => 0)), [L.cx, L.cy, n]);
  const final = useMemo(() => polygonPoints(L.cx, L.cy, target), [L.cx, L.cy, target]);

  useEffect(() => {
    const el = poly.current;
    if (!el) return;
    if (reduced) {
      el.setAttribute('points', final);
      return;
    }
    let raf = 0;
    const t0 = performance.now() + index * 90;
    const frame = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - t0) / TWEEN_MS));
      const e = easeOutCubic(t);
      el.setAttribute('points', polygonPoints(L.cx, L.cy, target.map((r) => r * e)));
      if (t < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [target, final, reduced, index, L.cx, L.cy]);

  const flux = s.platform.kind === 'flux';
  return (
    <polygon
      ref={poly}
      className={styles.shape}
      data-flux={flux || undefined}
      points={reduced ? final : zeros}
      style={{ stroke: s.color, fill: flux ? 'rgb(var(--accent-rgb) / 0.18)' : 'none', strokeDasharray: s.dash } as CSSProperties}
    />
  );
}

/** A series marker in SVG units: a diamond for Flux, a circle for DePIN, a square in a dashed ring for web2. */
function SvgMarker({
  shape,
  color,
  x,
  y,
  r,
  ring = false,
}: {
  shape: SeriesMarker;
  color: string;
  x: number;
  y: number;
  r: number;
  ring?: boolean;
}) {
  const surface = ring ? { stroke: 'var(--ink-0)', strokeWidth: 2, paintOrder: 'stroke' as const } : undefined;
  return (
    <g className={styles.marker} transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}>
      {shape === 'circle' ? <circle r={r} fill={color} style={surface} /> : null}
      {shape === 'diamond' ? <polygon points={`0,${-r * 1.25} ${r * 1.25},0 0,${r * 1.25} ${-r * 1.25},0`} fill={color} style={surface} /> : null}
      {shape === 'square' ? <rect x={-r} y={-r} width={r * 2} height={r * 2} fill={color} style={surface} /> : null}
    </g>
  );
}

interface ReadoutProps {
  series: Series[];
  active: number;
  pinned: boolean;
  onStep: (delta: number) => void;
  onOpenReceipt: RadarProps['onOpenReceipt'];
}

function Readout({ series, active, pinned, onStep, onOpenReceipt }: ReadoutProps) {
  const dim = ORDERED_DIMENSIONS[active];
  if (!dim) return null;
  return (
    <aside className={styles.readout} aria-label="The selected question">
      <header className={styles.rHead}>
        <p className={styles.rGroup}>{groupLabel(dim.group)}</p>
        <div className={styles.rStep}>
          <IconButton size="sm" variant="ghost" aria-label="Previous question" icon={<ChevronLeft size={16} />} onClick={() => onStep(-1)} />
          <IconButton size="sm" variant="ghost" aria-label="Next question" icon={<ChevronRight size={16} />} onClick={() => onStep(1)} />
        </div>
      </header>
      <h3 className={styles.rTitle}>{dim.label}</h3>
      <p className={styles.rAsk}>{dim.question}</p>
      <ul role="list" className={styles.rows}>
        {series.map((s) => {
          const cell = s.cells[active];
          const na = cell?.verdict === 'na';
          return (
            <li key={s.platform.id}>
              <button
                type="button"
                className={styles.rRow}
                disabled={!cell}
                aria-haspopup="dialog"
                aria-label={`${s.platform.name}: ${na ? 'not applicable' : `${s.scores[active]} out of 5`}. ${cell?.short ?? ''}. Open the receipt.`}
                style={{ '--gl-fill': s.color } as CSSProperties}
                onClick={(e) => cell && onOpenReceipt(s.platform.id, dim.id, e.currentTarget)}
              >
                <span className={styles.rName}>
                  <Marker platform={s.platform} size={11} />
                  {shortName(s.platform)}
                </span>
                <span className={styles.rScore}>
                  <b>{na ? 'n/a' : s.scores[active]}</b>
                  {na ? null : <HexPips score={s.scores[active] ?? 0} size={14} />}
                </span>
                <span className={styles.rShort}>{cell?.short ?? 'No data'}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className={styles.rHint}>{pinned ? 'Pinned, click the spoke again to let go' : 'Hover a spoke, or use the arrow keys'}</p>
    </aside>
  );
}
