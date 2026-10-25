import { Minus, Plus } from 'lucide-react';
import { type CSSProperties, type KeyboardEvent, memo, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { Button, IconButton } from '@/ui';
import { type LensId } from './lenses';
import { anchorPoint, APP_NAME, IP_PAIRS, type Layout, layoutFor, type Pt, SHOWN_MAX, ZONES } from './model';
import type { Fx, SimNode, View } from './sim';
import type { Theater as TheaterApi } from './useTheater';
import css from './Theater.module.css';

/* ------------------------------------------------------------------------------------------ */
/* Small helpers                                                                              */
/* ------------------------------------------------------------------------------------------ */

const hexCache = new Map<number, string>();
function hex(r: number): string {
  const hit = hexCache.get(r);
  if (hit) return hit;
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    pts.push(`${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`);
  }
  const out = pts.join(' ');
  hexCache.set(r, out);
  return out;
}

/** The edge of a hexagon that catches the light: top to upper right. */
function rim(r: number): string {
  const a = (deg: number) => `${(r * Math.cos((deg * Math.PI) / 180)).toFixed(2)},${(r * Math.sin((deg * Math.PI) / 180)).toFixed(2)}`;
  return `${a(-90)} ${a(-30)}`;
}

const vars = (o: Record<string, string | number>) => o as CSSProperties;

/** A line of text that changes at most once per `ms`: the polite live region should not chatter. */
function useThrottled(text: string, ms: number): string {
  const [shown, setShown] = useState(text);
  const last = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    const wait = last.current + ms - Date.now();
    window.clearTimeout(timer.current);
    if (wait <= 0) {
      last.current = Date.now();
      setShown(text);
    } else {
      timer.current = window.setTimeout(() => {
        last.current = Date.now();
        setShown(text);
      }, wait);
    }
    return () => window.clearTimeout(timer.current);
  }, [text, ms]);
  return shown;
}

/** Which groups a lens quiets so the eye lands on what the row is about. */
const DIM: Record<LensId, string> = {
  registry: 'fdm users routes',
  schedule: 'fdm users routes',
  replicas: 'fdm users routes',
  reconcile: 'reg fdm users routes',
  probes: 'reg users',
  failure: '',
  ingress: 'reg',
  volumes: 'reg fdm users routes',
  geo: 'reg fdm users routes',
  spread: 'reg fdm users routes',
  secrets: 'fdm users routes',
  nodes: 'reg fdm users routes',
  generic: '',
};

/* ------------------------------------------------------------------------------------------ */
/* The picture                                                                                */
/* ------------------------------------------------------------------------------------------ */

/** The app: a hexagon cut into three flat faces, a container seen corner-on. The same mark as chapter 03. */
function Crystal({ r }: { r: number }) {
  const h = r * 0.866;
  const half = r / 2;
  return (
    <g className={css.crystal}>
      <polygon className={css.faceTop} points={`0,${-r} ${h},${-half} 0,0 ${-h},${-half}`} />
      <polygon className={css.faceLeft} points={`${-h},${-half} 0,0 0,${r} ${-h},${half}`} />
      <polygon className={css.faceRight} points={`0,0 ${h},${-half} ${h},${half} 0,${r}`} />
    </g>
  );
}

const NodeGlyph = memo(function NodeGlyph({ n, p, r }: { n: SimNode; p: Pt; r: number }) {
  return (
    <g transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}>
      <g
        className={css.node}
        data-state={n.state}
        data-lb={n.inLb || undefined}
        data-crash={n.crash || undefined}
        style={vars({ '--dur': `${n.installFor}s` })}
      >
        <polygon className={css.hard} points={hex(r + 4)} />
        <polygon className={css.ring} points={hex(r + 5)} pathLength={100} />
        <polygon className={css.body} points={hex(r)} />
        <polyline className={css.rim} points={rim(r)} />
        <circle className={css.core} r={r * 0.15} />
        <g className={css.app}>
          <Crystal r={r * 0.5} />
        </g>
        <path className={css.cross} d={`M${-r * 0.32} ${-r * 0.32} L${r * 0.32} ${r * 0.32} M${r * 0.32} ${-r * 0.32} L${-r * 0.32} ${r * 0.32}`} />
        <g className={css.vol}>
          <ellipse cx={r * 0.78} cy={r * 0.9} rx={r * 0.34} ry={r * 0.14} />
          <path d={`M${r * 0.44} ${r * 0.9} V${r * 1.24} A${r * 0.34} ${r * 0.14} 0 0 0 ${r * 1.12} ${r * 1.24} V${r * 0.9}`} />
        </g>
        <g className={css.ladder}>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={-r * 0.8 + i * r * 0.4} y={r * 1.35} width={r * 0.28} height={2.2} data-on={i === 0 || undefined} />
          ))}
        </g>
      </g>
    </g>
  );
});

function FxGlyph({ fx, layout, lens }: { fx: Fx; layout: Layout; lens: LensId }) {
  const a = anchorPoint(layout, fx.from);
  const b = fx.to === undefined ? a : anchorPoint(layout, fx.to);
  const style = vars({
    '--x1': `${a.x.toFixed(1)}px`,
    '--y1': `${a.y.toFixed(1)}px`,
    '--x2': `${b.x.toFixed(1)}px`,
    '--y2': `${b.y.toFixed(1)}px`,
    '--fdur': `${fx.dur}s`,
    '--fdelay': `${fx.delay}s`,
  });
  const r = layout.nodeR;
  switch (fx.kind) {
    case 'ring':
      return (
        <g transform={`translate(${a.x.toFixed(1)} ${a.y.toFixed(1)})`}>
          <circle className={css.fxRing} data-tone={fx.tone} r={typeof fx.from === 'number' ? r + 3 : 14} style={style} />
        </g>
      );
    case 'ping':
      return (
        <g transform={`translate(${a.x.toFixed(1)} ${a.y.toFixed(1)})`} className={css.fxPingWrap}>
          <polygon className={css.fxPing} data-tone={fx.tone} points={hex(r + 2)} style={style} />
        </g>
      );
    case 'fail':
      return (
        <g transform={`translate(${a.x.toFixed(1)} ${a.y.toFixed(1)})`}>
          <path className={css.fxFail} data-tone={fx.tone} d="M-7 -7 L7 7 M7 -7 L-7 7" style={style} />
        </g>
      );
    case 'trim':
      return (
        <g transform={`translate(${a.x.toFixed(1)} ${a.y.toFixed(1)})`}>
          <polygon className={css.fxTrim} data-tone={fx.tone} points={hex(r + 8)} style={style} />
        </g>
      );
    case 'peek':
      return <line className={css.fxPeek} x1={a.x} y1={a.y} x2={b.x} y2={b.y} style={style} />;
    case 'packet':
      return <circle className={css.fxPacket} data-tone={fx.tone} r={2.8} style={style} />;
    case 'drop':
      return (
        <g transform={`translate(${a.x.toFixed(1)} ${a.y.toFixed(1)})`}>
          <polygon className={css.fxDrop} points={hex(8)} style={style} />
        </g>
      );
    case 'wave':
      return (
        <g className={css.fxWave} data-lens={lens} style={style}>
          {layout.nodes.map((p, i) => (
            <line key={i} x1={a.x} y1={a.y} x2={p.x} y2={p.y} style={vars({ '--k': i })} />
          ))}
        </g>
      );
    default:
      return null;
  }
}

/**
 * The registry, drawn bare: the app and a pip for every copy it asks for on the left, the last few blocks
 * of the chain on the right. No outline, no title, no caption: the picture says what it is.
 */
function RegistryStrip({ view, layout, phone, lens }: { view: View; layout: Layout; phone: boolean; lens: LensId }) {
  const r = layout.registry;

  // The app's slots: one per copy asked for, in the order the nodes took them.
  const holders = view.nodes.filter((n) => n.copy).sort((a, b) => a.order - b.order);
  const slots = Math.max(view.desired, holders.length);
  const pipR = phone ? 5.5 : 6.5;
  const pipGap = phone ? 15 : 18;
  const ax = r.x + (phone ? 14 : 20);
  const ay = r.y + (phone ? 20 : 24);
  const tx = ax + (phone ? 18 : 24);
  const py = r.y + (phone ? 46 : 56);

  const blocks = phone ? 4 : 8;
  const bgap = phone ? 32 : 44;
  const bx0 = r.x + r.w - (blocks - 1) * bgap - 12;
  const by = r.y + (phone ? 24 : 34);

  return (
    <g data-g="reg" className={css.reg} data-lens={lens}>
      {view.published ? (
        <g transform={`translate(${ax} ${ay})`}>
          <Crystal r={phone ? 10 : 12} />
        </g>
      ) : (
        <polygon className={css.slot} points={hex(phone ? 10 : 12)} transform={`translate(${ax} ${ay})`} />
      )}
      <text className={css.name} x={tx} y={ay + 5} data-on={view.published || undefined}>
        {view.published ? APP_NAME : 'No apps yet'}
      </text>
      {view.published ? (
        <g className={css.lock}>
          <rect x={tx + (phone ? 62 : 66)} y={ay - 1} width="8" height="6" rx="0.5" />
          <path d={`M${tx + (phone ? 64 : 68)} ${ay - 1} v-2 a2 2 0 0 1 4 0 v2`} />
        </g>
      ) : null}

      {view.published || view.pending
        ? Array.from({ length: slots }, (_, i) => {
            const h = holders[i];
            const kind = !h ? 'missing' : h.state === 'run' ? 'live' : h.state === 'dead' ? 'stale' : 'pending';
            return <polygon key={i} className={css.pip} data-kind={kind} points={hex(pipR)} transform={`translate(${tx + pipR + i * pipGap} ${py})`} />;
          })
        : null}

      <g className={css.chain}>
        {Array.from({ length: blocks }, (_, i) => {
          const n = view.blocks - (blocks - 1) + i;
          const x = bx0 + i * bgap;
          return (
            <g
              key={n}
              className={css.block}
              data-new={i === blocks - 1 || undefined}
              data-spec={(view.specBlock > 0 && n === view.specBlock) || undefined}
              style={vars({ translate: `${x}px ${by}px` })}
            >
              {i > 0 ? <line className={css.blockLink} x1={-bgap + 11} x2={-11} y1={0} y2={0} /> : null}
              <polygon points={hex(10)} />
              <path className={css.blockMark} d="M-3.5 -1 H3.5 M-3.5 2.5 H1.5" />
            </g>
          );
        })}
      </g>
    </g>
  );
}

function ZoneOverlay({ layout, zone, phone }: { layout: Layout; zone: number | null; phone: boolean }) {
  return (
    <g className={css.zones} aria-hidden="true">
      {layout.zones.map((z, i) => (
        <g key={i} data-allowed={zone === i || undefined} data-blocked={(zone !== null && zone !== i) || undefined}>
          <rect x={z.x} y={z.y} width={z.w} height={z.h} />
          <text className={css.t} x={z.x + 10} y={z.y + 18}>
            {`Zone ${ZONES[i]}`}
          </text>
          {zone === i ? (
            <text className={cn(css.t, css.tHot)} x={z.x + z.w - 10} y={z.y + 18} textAnchor="end">
              {phone ? 'Allowed' : 'Allowed here'}
            </text>
          ) : null}
        </g>
      ))}
    </g>
  );
}

const SERVING: Record<View['serving'], string> = {
  off: '',
  starting: 'Starting',
  ok: 'Serving',
  retry: 'Rerouting',
  down: 'Waiting for a copy',
};

function Picture({ view, lens, phone }: { view: View; lens: LensId; phone: boolean }) {
  const layout = layoutFor(phone);
  const r = layout.nodeR;
  const running = useMemo(() => view.nodes.filter((n) => n.state === 'run'), [view.nodes]);
  const rotation = view.nodes.filter((n) => n.copy && n.inLb);
  const fdm = layout.fdm;
  const users = layout.users;
  const servingLabel = SERVING[view.serving];

  const label = `An illustrative network of nodes, ${
    view.published ? `${view.counts.live} of ${view.desired} copies running${servingLabel ? `, ${servingLabel.toLowerCase()}` : ''}` : 'no app published yet'
  }`;

  return (
    <svg
      className={css.svg}
      viewBox={`0 0 ${layout.w} ${layout.h}`}
      role="img"
      aria-label={label}
      data-lens={lens}
      data-dim={DIM[lens]}
      data-serving={view.serving}
      data-published={view.published || undefined}
      data-phone={phone || undefined}
    >
      <ZoneOverlay layout={layout} zone={view.zone} phone={phone} />

      {/* Nodes that share one IP: a copy never lands on both. */}
      <g className={css.ipLinks} aria-hidden="true">
        {IP_PAIRS.map(([a, b], i) => {
          const pa = layout.nodes[a];
          const pb = layout.nodes[b];
          if (!pa || !pb) return null;
          return (
            <g key={a}>
              <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} />
              {i === 0 ? (
                <text className={css.t} x={(pa.x + pb.x) / 2} y={(pa.y + pb.y) / 2 - r - 6} textAnchor="middle">
                  Same IP
                </text>
              ) : null}
            </g>
          );
        })}
      </g>

      {/* The balancer's routes to every copy in rotation. */}
      <g data-g="routes" className={css.routes} aria-hidden="true">
        <line className={css.routeUsers} x1={users.x + 48} y1={users.y} x2={fdm.x - 26} y2={fdm.y} data-on={view.published || undefined} />
        {rotation.map((n) => {
          const p = layout.nodes[n.id];
          if (!p) return null;
          return <line key={n.id} className={css.route} data-dead={n.state === 'dead' || undefined} x1={fdm.x} y1={fdm.y - 20} x2={p.x} y2={p.y} />;
        })}
      </g>

      {/* Volumes keep the copies in step with each other. */}
      <g className={css.sync} aria-hidden="true">
        {running.length > 1
          ? running.map((n, i) => {
              const next = running[(i + 1) % running.length];
              const pa = layout.nodes[n.id];
              const pb = next ? layout.nodes[next.id] : undefined;
              if (!pa || !pb || (running.length === 2 && i === 1)) return null;
              return <line key={n.id} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} />;
            })
          : null}
      </g>

      <g data-g="field" className={css.field}>
        {view.nodes.map((n) => {
          const p = layout.nodes[n.id];
          return p ? <NodeGlyph key={n.id} n={n} p={p} r={r} /> : null;
        })}
      </g>

      <g className={css.fxLayer} aria-hidden="true">
        {view.fx.map((f) => (
          <FxGlyph key={f.id} fx={f} layout={layout} lens={lens} />
        ))}
      </g>

      <RegistryStrip view={view} layout={layout} phone={phone} lens={lens} />

      <g data-g="fdm" className={css.fdm} data-hot={rotation.length > 0 || undefined}>
        <polygon points={hex(22)} transform={`translate(${fdm.x} ${fdm.y})`} className={css.fdmBody} />
        <path className={css.fdmGlyph} transform={`translate(${fdm.x} ${fdm.y})`} d="M-10 0 H-2 M-2 0 L8 -8 M-2 0 H8 M-2 0 L8 8" />
        <text className={css.t} x={fdm.x} y={fdm.y + 42} textAnchor="middle">
          Load balancer
        </text>
      </g>

      <g data-g="users" className={css.users}>
        <g transform={`translate(${users.x} ${users.y})`} className={css.usersGlyph}>
          {[-32, 0, 32].map((dx) => (
            <g key={dx} transform={`translate(${dx} 0)`}>
              <circle cy={-9} r={5.5} />
              <path d="M-10 9 a10 8 0 0 1 20 0" />
            </g>
          ))}
        </g>
        {servingLabel ? (
          <text className={cn(css.t, css.tServing)} x={users.x} y={users.y + 42} textAnchor="middle" data-serving={view.serving}>
            {servingLabel}
          </text>
        ) : null}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* The controls                                                                               */
/* ------------------------------------------------------------------------------------------ */

/** Where the copies may run: plain words, one underlined. Arrow keys move the choice, like any radio group. */
function ZonePicker({ zone, onChange }: { zone: number | null; onChange: (zone: number | null) => void }) {
  const items: { zone: number | null; label: string }[] = [{ zone: null, label: 'Anywhere' }, ...ZONES.map((z, i) => ({ zone: i, label: `Zone ${z}` }))];
  const box = useRef<HTMLDivElement>(null);
  const at = Math.max(0, items.findIndex((it) => it.zone === zone));

  const move = (to: number) => {
    const next = (to + items.length) % items.length;
    const it = items[next];
    if (!it) return;
    onChange(it.zone);
    box.current?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') move(at + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') move(at - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(items.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div ref={box} className={css.zonePick} role="radiogroup" aria-label="Where copies may run" onKeyDown={onKey}>
      {items.map((it, i) => (
        <button
          key={it.label}
          type="button"
          role="radio"
          aria-checked={i === at}
          tabIndex={i === at ? 0 : -1}
          className={css.zoneOpt}
          data-on={i === at || undefined}
          onClick={() => onChange(it.zone)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* The theater                                                                                */
/* ------------------------------------------------------------------------------------------ */

export interface TheaterProps {
  theater: TheaterApi;
  lens: LensId;
  phone: boolean;
}

export function Theater({ theater, lens, phone }: TheaterProps) {
  const { view } = theater;
  const live = useThrottled(view.log[0]?.text ?? '', 900);
  const started = view.published || view.pending;

  return (
    <div className={css.theater} data-lens={lens}>
      <Picture view={view} lens={lens} phone={phone} />

      <div className={css.controls} role="group" aria-label="Drive the stage">
        {started ? (
          <Button variant="ghost" size="md" onClick={theater.reset}>
            Reset
          </Button>
        ) : (
          <Button variant="primary" size="md" onClick={theater.publish}>
            Publish an app
          </Button>
        )}

        <div className={css.stepper} role="group" aria-label="Copies of the app">
          <IconButton
            variant="secondary"
            size="md"
            aria-label="Remove a copy"
            icon={<Minus size={16} aria-hidden="true" />}
            onClick={() => theater.setCopies(view.desired - 1)}
            disabled={view.desired <= 1}
          />
          <span className={css.count}>
            <b>{view.desired}</b>
            <span>{view.desired === 1 ? 'copy' : 'copies'}</span>
          </span>
          <IconButton
            variant="secondary"
            size="md"
            aria-label="Add a copy"
            icon={<Plus size={16} aria-hidden="true" />}
            onClick={() => theater.setCopies(view.desired + 1)}
            disabled={view.desired >= SHOWN_MAX}
          />
        </div>

        <Button variant="secondary" size="md" onClick={theater.lose}>
          Lose a node
        </Button>
      </div>

      <div className={css.foot}>
        <p className={css.live} role="status" aria-live="polite">
          {live}
        </p>
        {lens === 'geo' ? <ZonePicker zone={view.zone} onChange={theater.setZone} /> : null}
      </div>
    </div>
  );
}
