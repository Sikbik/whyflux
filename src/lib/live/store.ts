/**
 * One shared, in-memory client for live Flux network data. Every useFluxLive()
 * caller reads the same state; polling runs only while at least one is mounted.
 *
 * Start-up order:
 *  1. Bundled counts (snapshot.generated.ts) are the initial state: status 'snapshot',
 *     so numbers render on first paint with no network.
 *  2. public/data/network-snapshot.json (~15 KB) loads the node points.
 *  3. api.runonflux.io tier counts + chain height (~0.3 KB): status becomes 'live'.
 *     Repeats every 60 s while the tab is visible.
 *  4. When the browser is idle, stats.runonflux.io capacity + per-country counts
 *     (~19 KB brotli). Repeats every 15 min.
 *
 * Everything degrades silently: a failed request keeps the last good values and
 * nothing throws. All endpoints send Access-Control-Allow-Origin: * (checked
 * 2026-10-24 from origin http://127.0.0.1:5190).
 */
import type { NodeTierId } from '@/data/types.ts';
import { SNAPSHOT_SUMMARY } from './snapshot.generated.ts';
import type { CountryCount, FluxLiveSnapshot, NodePoint, SnapshotFile, SnapshotSummary } from './types.ts';

const API = 'https://api.runonflux.io';
const STATS = 'https://stats.runonflux.io';

export const LIVE_ENDPOINTS = {
  /** Confirmed nodes per tier. FluxOS caches 30 s. */
  nodeCount: `${API}/daemon/getfluxnodecount`,
  /** Chain height. */
  blockCount: `${API}/daemon/getblockcount`,
  /** Per-node benchmark + country, projected down to ~19 KB brotli. Stats caches 10 min. */
  capacity: `${STATS}/fluxinfo?projection=tier,benchmark.bench.cores,benchmark.bench.ram,benchmark.bench.ssd,geolocation.countryCode,geolocation.continentCode`,
  /** Same-origin snapshot written by scripts/snapshot.mjs. */
  snapshot: `${import.meta.env.BASE_URL}data/network-snapshot.json`,
} as const;

const COUNTS_EVERY_MS = 60_000;
const CAPACITY_EVERY_MS = 15 * 60_000;
const CAPACITY_FIRST_DELAY_MS = 4_000;
const COUNTS_TIMEOUT_MS = 10_000;
const CAPACITY_TIMEOUT_MS = 25_000;
/** Keep polling briefly after the last unmount so StrictMode / route remounts don't refetch. */
const STOP_GRACE_MS = 1_000;

const TIERS: readonly NodeTierId[] = ['cumulus', 'nimbus', 'stratus'];
const COLLATERAL: Record<NodeTierId, number> = { cumulus: 1000, nimbus: 12500, stratus: 40000 };

/* ---------------------------------------------------------------- state */

function fromSummary(s: SnapshotSummary | undefined): FluxLiveSnapshot {
  if (!s || !(s.totalNodes > 0)) {
    return { status: 'loading', fetchedAt: '', totalNodes: 0, tiers: { cumulus: 0, nimbus: 0, stratus: 0 }, points: [] };
  }
  return {
    status: 'snapshot',
    fetchedAt: s.generatedAt,
    snapshotAt: s.generatedAt,
    totalNodes: s.totalNodes,
    tiers: { ...s.tiers },
    lockedCollateral: s.lockedCollateral,
    countries: s.countries,
    continents: s.continents,
    operators: s.operators,
    asns: s.asns,
    arcaneNodes: s.arcaneNodes,
    totalCores: s.totalCores,
    totalRamTb: s.totalRamTb,
    totalSsdTb: s.totalSsdTb,
    runningApps: s.runningApps,
    runningInstances: s.runningInstances,
    multiInstanceApps: s.multiInstanceApps,
    registeredApps: s.registeredApps,
    appMessages: s.appMessages,
    blockHeight: s.blockHeight,
    byCountry: s.byCountry,
    points: [],
  };
}

let state: FluxLiveSnapshot = fromSummary(SNAPSHOT_SUMMARY);
const listeners = new Set<() => void>();

function patch(next: Partial<FluxLiveSnapshot>): void {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}

/* ---------------------------------------------------------------- fetch */

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** GET JSON with a timeout that also honours the shared abort signal. Never throws. */
async function getJson(url: string, signal: AbortSignal, timeoutMs: number): Promise<unknown> {
  if (signal.aborted) return undefined;
  const local = new AbortController();
  const onAbort = () => local.abort();
  signal.addEventListener('abort', onAbort, { once: true });
  const timer = setTimeout(() => local.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: local.signal, headers: { accept: 'application/json' } });
    if (!res.ok) return undefined;
    return (await res.json()) as unknown;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', onAbort);
  }
}

/** FluxOS wraps everything as {status, data} and reports errors with HTTP 200. */
function envelopeData(body: unknown): unknown {
  if (body && typeof body === 'object' && (body as { status?: unknown }).status === 'success') {
    return (body as { data?: unknown }).data;
  }
  return undefined;
}

let countsInFlight = false;
let capacityInFlight = false;
let lastCountsAt = 0;
let lastCapacityAt = 0;
let pointsLoaded = false;
let pointsInFlight = false;

async function refreshCounts(signal: AbortSignal): Promise<void> {
  if (countsInFlight) return;
  countsInFlight = true;
  try {
    const [countBody, heightBody] = await Promise.all([
      getJson(LIVE_ENDPOINTS.nodeCount, signal, COUNTS_TIMEOUT_MS),
      getJson(LIVE_ENDPOINTS.blockCount, signal, COUNTS_TIMEOUT_MS),
    ]);
    if (signal.aborted) return;
    const next: Partial<FluxLiveSnapshot> = {};

    const count = envelopeData(countBody) as Record<string, unknown> | undefined;
    if (count) {
      const tiers = {
        cumulus: count['cumulus-enabled'],
        nimbus: count['nimbus-enabled'],
        stratus: count['stratus-enabled'],
      };
      if (isNum(tiers.cumulus) && isNum(tiers.nimbus) && isNum(tiers.stratus)) {
        const sum = tiers.cumulus + tiers.nimbus + tiers.stratus;
        const total = isNum(count.total) ? count.total : sum;
        if (total >= 100) {
          const t = tiers as Record<NodeTierId, number>;
          next.tiers = t;
          next.totalNodes = total;
          next.lockedCollateral = TIERS.reduce((acc, id) => acc + t[id] * COLLATERAL[id], 0);
        }
      }
    }
    const height = envelopeData(heightBody);
    if (isNum(height) && height > 0) next.blockHeight = height;

    if (Object.keys(next).length > 0) {
      lastCountsAt = Date.now();
      patch({ ...next, status: 'live', fetchedAt: new Date(lastCountsAt).toISOString() });
    }
  } finally {
    countsInFlight = false;
  }
}

interface StatsRow {
  tier?: unknown;
  benchmark?: { bench?: { cores?: unknown; ram?: unknown; ssd?: unknown } };
  geolocation?: { countryCode?: unknown; continentCode?: unknown };
}

async function refreshCapacity(signal: AbortSignal): Promise<void> {
  if (capacityInFlight) return;
  capacityInFlight = true;
  try {
    const rows = envelopeData(await getJson(LIVE_ENDPOINTS.capacity, signal, CAPACITY_TIMEOUT_MS));
    if (signal.aborted || !Array.isArray(rows) || rows.length < 100) return;

    let cores = 0;
    let ramGb = 0;
    let ssdGb = 0;
    const continents = new Set<string>();
    const countries = new Map<string, CountryCount>();
    for (const row of rows as StatsRow[]) {
      const bench = row?.benchmark?.bench;
      // Unreachable nodes come back zeroed; skip them rather than count zeros.
      if (bench && isNum(bench.cores) && bench.cores > 0) {
        cores += bench.cores;
        if (isNum(bench.ram)) ramGb += bench.ram;
        if (isNum(bench.ssd)) ssdGb += bench.ssd;
      }
      const geo = row?.geolocation;
      if (geo && typeof geo.continentCode === 'string' && geo.continentCode) continents.add(geo.continentCode);
      const tier = typeof row?.tier === 'string' ? (row.tier.toLowerCase() as NodeTierId) : undefined;
      const cc = geo && typeof geo.countryCode === 'string' ? geo.countryCode.toUpperCase() : '';
      if (cc && tier && TIERS.includes(tier)) {
        const entry = countries.get(cc) ?? { code: cc, nodes: 0, tiers: { cumulus: 0, nimbus: 0, stratus: 0 } };
        entry.nodes += 1;
        entry.tiers[tier] += 1;
        countries.set(cc, entry);
      }
    }
    if (cores <= 0 || countries.size === 0) return;

    lastCapacityAt = Date.now();
    patch({
      status: 'live',
      fetchedAt: state.status === 'live' ? state.fetchedAt : new Date(lastCapacityAt).toISOString(),
      totalCores: Math.round(cores),
      totalRamTb: Math.round(ramGb / 100) / 10,
      totalSsdTb: Math.round(ssdGb / 100) / 10,
      countries: countries.size,
      continents: continents.size,
      byCountry: [...countries.values()].sort((a, b) => b.nodes - a.nodes || a.code.localeCompare(b.code)),
    });
  } finally {
    capacityInFlight = false;
  }
}

function decodePoints(raw: unknown): NodePoint[] {
  if (!Array.isArray(raw)) return [];
  const out: NodePoint[] = [];
  for (const p of raw) {
    if (!Array.isArray(p)) continue;
    const [lat, lon, t, w, cc] = p as unknown[];
    const tier = isNum(t) ? TIERS[t] : undefined;
    if (!isNum(lat) || !isNum(lon) || !tier) continue;
    out.push({ lat, lon, tier, weight: isNum(w) ? w : 1, ...(typeof cc === 'string' && cc ? { country: cc } : {}) });
  }
  return out;
}

async function loadSnapshotFile(signal: AbortSignal): Promise<void> {
  if (pointsLoaded || pointsInFlight) return;
  pointsInFlight = true;
  try {
    const file = (await getJson(LIVE_ENDPOINTS.snapshot, signal, CAPACITY_TIMEOUT_MS)) as Partial<SnapshotFile> | undefined;
    if (signal.aborted || !file) return;
    const points = decodePoints(file.points);
    if (points.length === 0) return;
    pointsLoaded = true;

    const next: Partial<FluxLiveSnapshot> = { points };
    // A snapshot newer than the bundle (script re-run without a rebuild) refreshes the
    // fields that live polling never touches, and everything else while still offline.
    const newer = typeof file.generatedAt === 'string' && (!state.snapshotAt || file.generatedAt > state.snapshotAt);
    if (newer && file.totalNodes && file.totalNodes > 0) {
      const fresh = fromSummary(file as SnapshotSummary);
      const snapshotOnly: (keyof FluxLiveSnapshot)[] = [
        'runningApps', 'runningInstances', 'multiInstanceApps', 'registeredApps', 'appMessages', 'operators', 'asns', 'arcaneNodes', 'snapshotAt',
      ];
      if (state.status === 'live') {
        for (const key of snapshotOnly) (next as Record<string, unknown>)[key] = fresh[key];
      } else {
        Object.assign(next, fresh, { points });
      }
    }
    patch(next);
  } finally {
    pointsInFlight = false;
  }
}

/* ---------------------------------------------------------------- scheduling */

let running = false;
let controller: AbortController | null = null;
let countsTimer: ReturnType<typeof setTimeout> | undefined;
let capacityTimer: ReturnType<typeof setTimeout> | undefined;
let stopTimer: ReturnType<typeof setTimeout> | undefined;
let idleHandle: number | undefined;

const hidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

function scheduleCounts(delay: number): void {
  clearTimeout(countsTimer);
  countsTimer = setTimeout(() => {
    countsTimer = undefined;
    const ctl = controller;
    if (!running || !ctl) return;
    if (hidden()) return; // resumed by onVisibility
    void refreshCounts(ctl.signal).finally(() => {
      if (running && controller === ctl) scheduleCounts(COUNTS_EVERY_MS);
    });
  }, Math.max(0, delay));
}

function scheduleCapacity(delay: number): void {
  clearTimeout(capacityTimer);
  capacityTimer = setTimeout(() => {
    capacityTimer = undefined;
    const ctl = controller;
    if (!running || !ctl) return;
    if (hidden()) return;
    const run = () => {
      idleHandle = undefined;
      if (!running || controller !== ctl) return;
      void refreshCapacity(ctl.signal).finally(() => {
        if (running && controller === ctl) scheduleCapacity(CAPACITY_EVERY_MS);
      });
    };
    // The response is ~0.5 MB of JSON to parse; do it when the main thread is quiet.
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleHandle = window.requestIdleCallback(run, { timeout: 10_000 });
    } else {
      run();
    }
  }, Math.max(0, delay));
}

function onVisibility(): void {
  if (!running || hidden()) return;
  const now = Date.now();
  if (countsTimer === undefined && !countsInFlight) scheduleCounts(lastCountsAt + COUNTS_EVERY_MS - now);
  if (capacityTimer === undefined && idleHandle === undefined && !capacityInFlight) {
    scheduleCapacity(lastCapacityAt ? lastCapacityAt + CAPACITY_EVERY_MS - now : CAPACITY_FIRST_DELAY_MS);
  }
}

function start(): void {
  if (running || typeof window === 'undefined') return;
  running = true;
  controller = new AbortController();
  const now = Date.now();
  void loadSnapshotFile(controller.signal);
  scheduleCounts(lastCountsAt ? lastCountsAt + COUNTS_EVERY_MS - now : 0);
  scheduleCapacity(lastCapacityAt ? lastCapacityAt + CAPACITY_EVERY_MS - now : CAPACITY_FIRST_DELAY_MS);
  document.addEventListener('visibilitychange', onVisibility);
}

function stop(): void {
  if (!running) return;
  running = false;
  controller?.abort();
  controller = null;
  clearTimeout(countsTimer);
  clearTimeout(capacityTimer);
  countsTimer = undefined;
  capacityTimer = undefined;
  if (idleHandle !== undefined && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    window.cancelIdleCallback(idleHandle);
  }
  idleHandle = undefined;
  document.removeEventListener('visibilitychange', onVisibility);
}

/* ---------------------------------------------------------------- public */

/** useSyncExternalStore subscribe: starts polling on the first subscriber, stops after the last. */
export function subscribeFluxLive(listener: () => void): () => void {
  listeners.add(listener);
  if (stopTimer !== undefined) {
    clearTimeout(stopTimer);
    stopTimer = undefined;
  }
  start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && stopTimer === undefined) {
      stopTimer = setTimeout(() => {
        stopTimer = undefined;
        if (listeners.size === 0) stop();
      }, STOP_GRACE_MS);
    }
  };
}

/** The current shared snapshot (stable reference until something changes). */
export function getFluxLive(): FluxLiveSnapshot {
  return state;
}
