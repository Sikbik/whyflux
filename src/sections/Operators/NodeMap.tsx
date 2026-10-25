import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { NodeTierId } from '@/data/types';
import { cn } from '@/lib/cn';
import { formatInt } from '@/lib/format';
import { countryName, type CountryCount, type NodePoint } from '@/lib/live';
import { useActive, useElementSize, useInView, useReducedMotion } from '@/ui';
import { createMapEngine, type MapEngine, type MapNode } from './mapEngine';
import { tierName, TIER_IDS, type TierFilter } from './model';
import styles from './NodeMap.module.css';

export interface NodeMapProps {
  points: readonly NodePoint[];
  /** Per-country counts: the tooltip and the text twin read them. */
  counts: readonly CountryCount[];
  tier: TierFilter;
  className?: string;
}

interface Tip {
  country: string;
  x: number;
  y: number;
}

/**
 * The map itself: a hex-dot world with a disc for every cluster of nodes. The canvas is picture plus a
 * text twin (a table for screen readers carries the same numbers). The pointer picks the nearest
 * node and brings that country forward; the keyboard steps through the countries with the arrow keys.
 */
export function NodeMap({ points, counts, tier, className }: NodeMapProps) {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<MapEngine | null>(null);
  const { width, height } = useElementSize(stage);
  const active = useActive(stage);
  const seen = useInView(stage, { once: true, rootMargin: '0px 0px -15% 0px' });
  const reduced = useReducedMotion();
  const [tip, setTip] = useState<Tip | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const lit = useRef(false);

  const nodes = useMemo<MapNode[]>(
    () =>
      points
        .filter((p) => tier === 'all' || p.tier === tier)
        .map((p) => ({ lon: p.lon, lat: p.lat, tier: p.tier, weight: p.weight ?? 1, country: p.country ?? '' })),
    [points, tier],
  );

  // The countries the keyboard steps through: biggest first, for the tier on show.
  const order = useMemo(
    () =>
      counts
        .map((c) => ({ code: c.code, n: tier === 'all' ? c.nodes : c.tiers[tier] }))
        .filter((c) => c.n > 0)
        .sort((a, b) => b.n - a.n)
        .map((c) => c.code),
    [counts, tier],
  );

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const e = createMapEngine({
      canvas: el,
      onHover: (hit) => {
        setTip(hit);
        setFocus(hit ? hit.country : null);
      },
    });
    engine.current = e;
    return () => {
      e.dispose();
      engine.current = null;
    };
  }, []);

  useEffect(() => {
    if (width > 0 && height > 0) engine.current?.resize(width, height);
  }, [width, height]);
  useEffect(() => {
    engine.current?.setNodes(nodes);
    setTip(null);
    setFocus(null);
  }, [nodes]);
  useEffect(() => engine.current?.setFocus(focus), [focus]);
  useEffect(() => engine.current?.setActive(active), [active]);
  useEffect(() => engine.current?.setReduced(reduced), [reduced]);

  // The nodes ignite once, outward from the visitor's own part of the world, when the map is first seen.
  useEffect(() => {
    if (!seen || lit.current || nodes.length === 0 || width === 0) return;
    lit.current = true;
    engine.current?.ignite();
  }, [seen, nodes.length, width]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (order.length === 0) return;
    const current = focus ? order.indexOf(focus) : -1;
    let next = current;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (current + 1) % order.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (current - 1 + order.length) % order.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = order.length - 1;
    else if (e.key === 'Escape') {
      setTip(null);
      setFocus(null);
      return;
    } else return;
    e.preventDefault();
    const code = order[next];
    if (!code) return;
    setFocus(code);
    const at = engine.current?.anchorOf(code);
    setTip(at ? { country: code, ...at } : null);
  };

  const onBlur = () => {
    setTip(null);
    setFocus(null);
  };

  const byCode = useMemo(() => new Map(counts.map((c) => [c.code, c])), [counts]);
  const tipCounts = tip ? byCode.get(tip.country) : undefined;
  const announce = focus ? describe(byCode.get(focus), focus) : '';

  return (
    <div
      ref={stage}
      className={cn(styles.stage, className)}
      role="group"
      aria-label="Map of where the nodes run, use the arrow keys to step through the countries and Escape to let go"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />

      {points.length === 0 ? (
        <p className={styles.empty} role="status">
          Placing the nodes
        </p>
      ) : null}

      {tip && tipCounts ? (
        <div className={styles.tip} style={{ insetInlineStart: clampX(tip.x, width), insetBlockStart: tip.y }} data-flip={tip.y < 150 ? 'down' : 'up'}>
          <b>{countryName(tip.country)}</b>
          <span className={styles.tipTotal}>{formatInt(tier === 'all' ? tipCounts.nodes : tipCounts.tiers[tier])} nodes</span>
          <ul role="list">
            {TIER_IDS.filter((id) => tier === 'all' || tier === id).map((id) => (
              <li key={id} data-tier={id}>
                <i aria-hidden="true" />
                {tierName(id)} <b>{formatInt(tipCounts.tiers[id])}</b>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <table className="sr-only">
        <caption>Nodes per country, by tier</caption>
        <thead>
          <tr>
            <th scope="col">Country</th>
            {TIER_IDS.map((id) => (
              <th key={id} scope="col">
                {tierName(id)}
              </th>
            ))}
            <th scope="col">All tiers</th>
          </tr>
        </thead>
        <tbody>
          {counts.map((c) => (
            <tr key={c.code}>
              <th scope="row">{countryName(c.code)}</th>
              {TIER_IDS.map((id) => (
                <td key={id}>{formatInt(c.tiers[id])}</td>
              ))}
              <td>{formatInt(c.nodes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function describe(c: CountryCount | undefined, code: string): string {
  if (!c) return '';
  const parts = TIER_IDS.map((id: NodeTierId) => `${tierName(id)} ${formatInt(c.tiers[id])}`);
  return `${countryName(code)}: ${formatInt(c.nodes)} nodes. ${parts.join(', ')}.`;
}

/** Keeps the tooltip's anchor away from the stage's left and right edges, so it never spills out. */
function clampX(x: number, width: number): number {
  return Math.min(Math.max(x, 96), Math.max(96, width - 96));
}
