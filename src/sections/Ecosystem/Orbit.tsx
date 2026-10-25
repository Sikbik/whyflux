import { type CSSProperties, type KeyboardEvent, type RefObject, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { clamp, damp, DEG, easeOutCubic } from '@/lib/math';
import { useActive, useElementSize, useInView, useReducedMotion } from '@/ui';
import { iconFor, type Ring, shortName, STATUS } from './model';
import styles from './Orbit.module.css';

/**
 * The orbit: the Flux symbol in the middle of concentric rings that lean back like a table seen from
 * above and a little to one side. Each product is a hexagon standing on its ring, and the orbit is
 * the interface: point at a node to preview it, click or press an arrow key to choose it. Every
 * frame writes straight to the DOM (no React renders), the loop only runs while the stage is near
 * the viewport, and the orbit eases to a stop under the pointer or keyboard focus. Solid strokes and
 * flat fills only: no glow, no blur.
 */

/** How far the orbital plane leans back at desktop widths: ring height over ring width. Narrow stages stand it up. */
const TILT = 0.46;
/** Below this stage width the nodes are drawn smaller (the CSS breakpoint in Orbit.module.css matches). */
const COMPACT = 560;
/** Seconds per turn, outermost ring first. Slow on purpose: 120 to 240 s. */
const PERIOD_S = [240, 210, 180, 150, 120];
/** Where each ring's first node starts, in degrees (0 is right, 90 is toward the viewer). */
const PHASE_DEG = [18, 52, 84, 158, 332];
/** Seconds between one ring leaving the center and the next. */
const INTRO_STAGGER = 0.16;
const INTRO_SECONDS = 1.15;
const BEAM_SECONDS = 0.6;

interface NodeSpec {
  id: string;
  ring: number;
  /** Ring radius as a fraction of the outermost. */
  frac: number;
  deg0: number;
  /** When this node leaves the center in the intro, in seconds. Inner rings leave first. */
  introAt: number;
}

interface Geometry {
  w: number;
  h: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** The innermost ring as a fraction of the outermost: a narrow stage needs it wider so the plinth fits inside. */
function innerFrac(w: number): number {
  return w < COMPACT ? 0.36 : 0.27;
}

function geometry(w: number, h: number): Geometry {
  const u = w < COMPACT ? 0.74 : 1; // the node size, as a share of the desktop one
  const tilt = clamp(TILT + (900 - w) * 0.0008, TILT, 0.9);
  const nodeH = (62 + 14 + 5) * u; // hexagon, stem and half the footprint, as laid out in the stylesheet
  const top = nodeH * 0.9 + 8;
  const bottom = (w < COMPACT ? 22 : 56) * u + 10;
  const side = clamp(w * 0.1, 30, 76);
  const rx = Math.max(40, Math.min((w - 2 * side) / 2, (h - top - bottom) / 2 / tilt));
  return { w, h, cx: w / 2, cy: top + (h - top - bottom) / 2, rx, ry: rx * tilt };
}

function ringFrac(r: number, count: number, inner: number): number {
  return count <= 1 ? 1 : 1 - (r * (1 - inner)) / (count - 1);
}

function layout(rings: readonly Ring[], inner: number): NodeSpec[] {
  const n = rings.length;
  const out: NodeSpec[] = [];
  rings.forEach((ring, r) => {
    const phase = PHASE_DEG[r] ?? r * 47;
    ring.items.forEach((item, k) => {
      out.push({
        id: item.id,
        ring: r,
        frac: ringFrac(r, n, inner),
        deg0: phase + (k * 360) / ring.items.length,
        introAt: (n - 1 - r) * INTRO_STAGGER + k * 0.05,
      });
    });
  });
  return out;
}

/**
 * One half of an ellipse as a path, so `pathLength` can draw it in on every browser. The back half
 * runs over the top (left to right), the front half under the bottom (right to left).
 */
function halfPath(cx: number, cy: number, rx: number, ry: number, half: 'back' | 'front'): string {
  return half === 'back'
    ? `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`
    : `M ${cx + rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy}`;
}

export interface OrbitProps {
  rings: readonly Ring[];
  selectedId: string;
  hoverId: string | null;
  /** Written by the showcase: true while the pointer or keyboard focus is over the orbit or its caption. */
  pausedRef: RefObject<boolean>;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export function Orbit({ rings, selectedId, hoverId, pausedRef, onSelect, onHover }: OrbitProps) {
  const stage = useRef<HTMLDivElement>(null);
  const beam = useRef<SVGLineElement>(null);
  const beamHead = useRef<SVGCircleElement>(null);
  const els = useRef(new Map<string, HTMLElement>());
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  const size = useElementSize(stage);
  const active = useActive(stage);
  const entered = useInView(stage, { once: true, threshold: 0.25 });
  const reduced = useReducedMotion();

  const geo = useMemo(() => geometry(size.width, size.height), [size.width, size.height]);
  const inner = innerFrac(size.width);
  const specs = useMemo(() => layout(rings, inner), [rings, inner]);
  const items = useMemo(() => new Map(rings.flatMap((r) => r.items.map((i) => [i.id, i] as const))), [rings]);
  const ringOf = useMemo(() => new Map(rings.flatMap((r, idx) => r.items.map((i) => [i.id, idx] as const))), [rings]);

  // Everything the frame loop reads lives in refs, so the loop is created once per activation.
  const latest = useRef({ geo, specs, selectedId, hoverId, entered, reduced, ringCount: rings.length });
  const rt = useRef({ intro: 0, speed: 1, beam: 0, angles: [] as number[], lastSelected: '' });

  const paint = useCallback(
    (dt: number) => {
      const { geo: g, specs: nodes, selectedId: sel, hoverId: hov, entered: isIn, reduced: calm, ringCount } = latest.current;
      const s = rt.current;
      if (g.w === 0) return;

      if (calm) {
        s.intro = 99;
        s.speed = 0;
        s.beam = 1;
      } else {
        if (isIn) s.intro += dt;
        s.speed = damp(s.speed, pausedRef.current ? 0 : 1, 3.2, dt);
        s.beam = Math.min(1, s.beam + dt / BEAM_SECONDS);
      }
      for (let r = 0; r < ringCount; r++) {
        const period = PERIOD_S[r] ?? 180;
        const dir = r % 2 === 0 ? 1 : -1;
        s.angles[r] = (s.angles[r] ?? 0) + dir * (360 / period) * s.speed * dt;
      }

      let bx = g.cx;
      let by = g.cy;
      for (const n of nodes) {
        const el = els.current.get(n.id);
        if (!el) continue;
        const a = (n.deg0 + (s.angles[n.ring] ?? 0)) * DEG;
        const x = g.cx + Math.cos(a) * g.rx * n.frac;
        const y = g.cy + Math.sin(a) * g.ry * n.frac;
        const e = easeOutCubic(clamp((s.intro - n.introAt) / INTRO_SECONDS, 0, 1));
        const X = g.cx + (x - g.cx) * e;
        const Y = g.cy + (y - g.cy) * e;
        const depth = (Math.sin(a) + 1) / 2; // 0 at the back of its ring, 1 at the front
        const raised = n.id === sel || n.id === hov;
        el.style.translate = `${X.toFixed(1)}px ${Y.toFixed(1)}px`;
        el.style.scale = ((0.86 + 0.14 * depth) * (0.4 + 0.6 * e)).toFixed(3);
        el.style.opacity = (e * (raised ? 1 : 0.78 + 0.22 * depth)).toFixed(3);
        el.style.zIndex = String(Math.round(Y) + (raised ? 1000 : 0));
        if (n.id === sel) {
          bx = X;
          by = Y;
        }
      }

      const line = beam.current;
      const head = beamHead.current;
      if (line && head) {
        const t = easeOutCubic(s.beam);
        const x2 = g.cx + (bx - g.cx) * t;
        const y2 = g.cy + (by - g.cy) * t;
        line.setAttribute('x1', g.cx.toFixed(1));
        line.setAttribute('y1', g.cy.toFixed(1));
        line.setAttribute('x2', x2.toFixed(1));
        line.setAttribute('y2', y2.toFixed(1));
        head.setAttribute('cx', x2.toFixed(1));
        head.setAttribute('cy', y2.toFixed(1));
        head.style.opacity = s.beam >= 1 ? '0' : '1';
      }
    },
    [pausedRef],
  );

  // A still frame whenever the inputs change (this is also the whole picture under reduced motion).
  useLayoutEffect(() => {
    latest.current = { geo, specs, selectedId, hoverId, entered, reduced, ringCount: rings.length };
    if (rt.current.lastSelected !== selectedId) {
      rt.current.lastSelected = selectedId;
      rt.current.beam = 0;
    }
    paint(0);
  }, [geo, specs, selectedId, hoverId, entered, reduced, rings.length, paint]);

  // Motion: one rAF loop while the stage is near the viewport.
  useEffect(() => {
    if (!active || reduced) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      paint(dt);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, reduced, paint]);

  const lift = ringOf.get(hoverId ?? selectedId);

  // One tab stop for the whole orbit; the arrow keys walk the products and choose as they go.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const id = (e.target as HTMLElement).closest<HTMLElement>('[data-id]')?.dataset.id;
    if (!id) return;
    const n = specs.length;
    const i = specs.findIndex((s) => s.id === id);
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % n;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else return;
    e.preventDefault();
    const target = specs[next];
    if (!target) return;
    onSelect(target.id);
    buttons.current.get(target.id)?.focus();
  };

  return (
    <div
      ref={stage}
      className={styles.stage}
      data-ready={entered ? 'true' : 'false'}
      role="group"
      aria-label="Flux products, use the arrow keys to move between them"
      onKeyDown={onKeyDown}
    >
      {geo.w > 0 ? (
        <svg className={styles.rings} width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} aria-hidden="true">
          {rings.map((ring, r) => {
            const frac = ringFrac(r, rings.length, inner);
            const rx = geo.rx * frac;
            const ry = geo.ry * frac;
            return (
              <g
                key={ring.id}
                className={styles.ring}
                data-lift={lift === r ? 'true' : undefined}
                style={{ '--ri': rings.length - 1 - r } as CSSProperties}
              >
                <path className={styles.ringBack} d={halfPath(geo.cx, geo.cy, rx, ry, 'back')} pathLength={1} />
                <path className={styles.ringFront} d={halfPath(geo.cx, geo.cy, rx, ry, 'front')} pathLength={1} />
              </g>
            );
          })}
        </svg>
      ) : null}
      {geo.w > 0 ? (
        <svg className={styles.beamLayer} width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} aria-hidden="true">
          <line ref={beam} className={styles.beam} />
          <circle ref={beamHead} className={styles.beamHead} r={3.5} />
        </svg>
      ) : null}

      <div className={styles.core} style={{ translate: `${geo.cx}px ${geo.cy}px`, zIndex: Math.round(geo.cy) }} aria-hidden="true">
        <span className={styles.coreRim} />
        <span className={styles.coreStem} />
        <img className={styles.coreSymbol} src="/brand/Flux_symbol_blue-white.svg" alt="" width={78} height={78} draggable={false} />
      </div>

      {specs.map((n) => {
        const item = items.get(n.id);
        if (!item) return null;
        const Icon = iconFor(item);
        const selected = n.id === selectedId;
        const planned = item.status === 'announced';
        return (
          <div
            key={n.id}
            ref={(el) => {
              if (el) els.current.set(n.id, el);
              else els.current.delete(n.id);
            }}
            className={styles.anchor}
          >
            <button
              ref={(el) => {
                if (el) buttons.current.set(n.id, el);
                else buttons.current.delete(n.id);
              }}
              type="button"
              data-id={n.id}
              className={styles.node}
              data-status={item.status}
              data-selected={selected ? 'true' : undefined}
              data-hover={n.id === hoverId ? 'true' : undefined}
              tabIndex={selected ? 0 : -1}
              aria-current={selected ? 'true' : undefined}
              aria-label={planned ? `${item.name}, planned` : item.name}
              onClick={() => onSelect(n.id)}
              onPointerEnter={(e) => {
                if (e.pointerType === 'mouse') onHover(n.id);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === 'mouse') onHover(null);
              }}
            >
              <span className={styles.hex}>
                <svg className={styles.hexSvg} viewBox="0 0 46 53" aria-hidden="true">
                  <path className={styles.hexBody} d="M23 1 L44.5 13.5 V39.5 L23 52 L1.5 39.5 V13.5 Z" />
                  <path className={styles.hexInner} d="M23 9 L37.5 17.5 V35 L23 43.5 L8.5 35 V17.5 Z" />
                </svg>
                <Icon className={styles.icon} size={18} strokeWidth={1.75} aria-hidden="true" />
                <svg className={styles.reticle} viewBox="0 0 62 70" aria-hidden="true">
                  <path d="M1 11 V1 H11 M51 1 H61 V11 M61 59 V69 H51 M11 69 H1 V59" />
                </svg>
              </span>
              <span className={styles.stem} aria-hidden="true" />
              <span className={styles.foot} aria-hidden="true">
                <span className={styles.pulse} />
              </span>
              <span className={styles.label} aria-hidden="true">
                <span>{shortName(item)}</span>
                {planned ? <em>{STATUS.announced.label}</em> : null}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
