/**
 * Chapter 02: the theater's constants and its fixed geometry. Nothing in here is a measurement of the
 * network: it is an illustration with invented nodes, and the page says so in the stage's first line.
 *
 * The numbers that mirror real behaviour of Flux are the timings the simulation honors. Each one names its
 * source (the same records the data layer cites), so the picture and the data cannot drift apart:
 *
 *   CHECK_SECONDS, CHECK_FAILS   the load balancer's health check: `inter 3s fall 2`
 *                                (flux-domain-manager, haproxyTemplate.js) -> kubernetesMap 'Liveness and readiness probes'
 *   LOCATION_TTL_MIN             a running copy's location record lives 125 minutes (`locationTtlS: 7500`)
 *                                (FluxOS config default.js)                -> kubernetesMap 'Node failure'
 *
 * Nothing on the page prints these numbers; they only set how the picture behaves. Everything else (node
 * count, install times, how fast the slow steps run) is a stage setting.
 */
import { mulberry32 } from '@/lib/rng';

/** Illustrative: how many nodes the stage draws. */
export const NODE_COUNT = 28;
/** Health check cadence and tolerance of the load balancer. */
export const CHECK_SECONDS = 3;
export const CHECK_FAILS = 2;
/** How long a location record lives after a sudden death. */
export const LOCATION_TTL_MIN = 125;
/** How many copies the stepper lets you try. */
export const SHOWN_MAX = 12;

/** Stage settings: how fast the slow steps run. One real second of the stage is this many simulated minutes. */
export const MINUTES_PER_SECOND = 15;
export const STAGE_BLOCK_EVERY = 4.2;
export const WAKE_FIRST: readonly [number, number] = [0.15, 1.5];
export const WAKE_AGAIN: readonly [number, number] = [1.1, 2.3];
export const INSTALL_TIME: readonly [number, number] = [1.2, 2.3];
export const REQUEST_EVERY = 0.72;
export const DEFAULT_COPIES = 3;
/** The sample app's name on the registry. */
export const APP_NAME = 'my-app';

/* ---------------------------------------------------------------------------------------------- */
/* Zones and shared IPs                                                                           */
/* ---------------------------------------------------------------------------------------------- */

/** Three regions of the illustrative field. A geolocation rule allows copies in one of them. */
export const ZONES = ['A', 'B', 'C'] as const;
export const ZONE_SIZES = [9, 10, 9] as const;

export function zoneOf(node: number): number {
  return node < ZONE_SIZES[0] ? 0 : node < ZONE_SIZES[0] + ZONE_SIZES[1] ? 1 : 2;
}

/**
 * Nodes that share one public IP (the network really does let several nodes sit behind one address).
 * A node never takes an app that already runs on its IP. Pairs of neighbours in both layouts.
 */
export const IP_PAIRS: readonly (readonly [number, number])[] = [
  [0, 1],
  [3, 4],
  [6, 7],
  [9, 10],
  [12, 13],
  [16, 17],
  [19, 20],
  [22, 23],
  [25, 26],
];

const IP_GROUP: number[] = Array.from({ length: NODE_COUNT }, (_, i) => -1 - i);
IP_PAIRS.forEach(([a, b], g) => {
  IP_GROUP[a] = g;
  IP_GROUP[b] = g;
});
/** Nodes with the same value share an IP. Singles are unique negatives. */
export function ipGroupOf(node: number): number {
  return IP_GROUP[node] ?? -1 - node;
}

/* ---------------------------------------------------------------------------------------------- */
/* Geometry                                                                                       */
/* ---------------------------------------------------------------------------------------------- */

export interface Pt {
  x: number;
  y: number;
}

export interface Box extends Pt {
  w: number;
  h: number;
}

export interface Layout {
  w: number;
  h: number;
  nodeR: number;
  nodes: Pt[];
  /** Where the registry strip sits (it has no outline: this only places what is drawn in it). */
  registry: Box;
  fdm: Pt;
  users: Pt;
  zones: Box[];
}

const ROWS_WIDE: readonly (readonly number[])[] = [
  [3, 3, 3],
  [3, 4, 3],
  [3, 3, 3],
];
const ROWS_TALL: readonly (readonly number[])[] = [
  [5, 4],
  [5, 5],
  [5, 4],
];

function build(phone: boolean): Layout {
  const rand = mulberry32(phone ? 71 : 29);
  const jit = (amp: number) => (rand() - 0.5) * 2 * amp;
  const nodes: Pt[] = [];
  const zones: Box[] = [];

  if (!phone) {
    const w = 760;
    const h = 540;
    const centers = [136, 380, 624];
    const rowY = [168, 258, 348];
    ROWS_WIDE.forEach((_, z) => {
      const rows = ROWS_WIDE[z] ?? [];
      const cx = centers[z] ?? 0;
      rows.forEach((count, r) => {
        const gap = count === 4 ? 56 : 64;
        const x0 = cx - ((count - 1) * gap) / 2;
        for (let i = 0; i < count; i++) {
          nodes.push({ x: x0 + i * gap + jit(8), y: (rowY[r] ?? 0) + jit(7) });
        }
      });
      zones.push({ x: cx - 108, y: 118, w: 216, h: 278 });
    });
    return finish(nodes, zones, w, h, 19, false);
  }

  const w = 360;
  const h = 540;
  const zoneTop = [92, 212, 332];
  ROWS_TALL.forEach((rows, z) => {
    const top = zoneTop[z] ?? 0;
    rows.forEach((count, r) => {
      const gap = 62;
      const x0 = 180 - ((count - 1) * gap) / 2;
      for (let i = 0; i < count; i++) {
        nodes.push({ x: x0 + i * gap + jit(5), y: top + 26 + r * 56 + jit(5) });
      }
    });
    zones.push({ x: 18, y: top, w: 324, h: 112 });
  });
  return finish(nodes, zones, w, h, 15, true);
}

function finish(nodes: Pt[], zones: Box[], w: number, h: number, nodeR: number, phone: boolean): Layout {
  return {
    w,
    h,
    nodeR,
    nodes,
    zones,
    registry: phone ? { x: 8, y: 8, w: w - 16, h: 62 } : { x: 12, y: 12, w: w - 24, h: 76 },
    fdm: phone ? { x: 250, y: 488 } : { x: 400, y: 478 },
    users: phone ? { x: 90, y: 488 } : { x: 170, y: 478 },
  };
}

const wide = build(false);
const tall = build(true);

export function layoutFor(phone: boolean): Layout {
  return phone ? tall : wide;
}

/** Where a named anchor sits in a layout. */
export type Anchor = number | 'reg' | 'fdm' | 'users';

export function anchorPoint(layout: Layout, a: Anchor): Pt {
  if (typeof a === 'number') return layout.nodes[a] ?? { x: 0, y: 0 };
  if (a === 'fdm') return layout.fdm;
  if (a === 'users') return layout.users;
  const r = layout.registry;
  return { x: r.x + r.w * 0.42, y: r.y + r.h };
}
