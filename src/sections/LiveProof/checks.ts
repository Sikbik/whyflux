/**
 * Beat D: the three public requests behind the proof wall, runnable in the visitor's own browser.
 * The endpoints come from LIVE_ENDPOINTS (src/lib/live); nothing here invents one. Each check
 * fetches the answer, prints the first lines of it, and sets what it returned beside the number
 * the wall is showing.
 */
import { CHAIN, formatInt, formatStorageTb, type FluxLiveSnapshot, LIVE_ENDPOINTS } from '@/lib/live';

export type CheckId = 'nodes' | 'height' | 'capacity';

export interface Compare {
  label: string;
  /** What this run returned, formatted. */
  here: string;
  /** What the wall is showing, formatted ("–" when the wall has nothing). */
  wall: string;
  /** match: identical. close: within what a refresh explains. differs: a real gap. */
  tone: 'match' | 'close' | 'differs';
}

export type CheckResult =
  | { ok: true; ms: number; bytes: number; preview: string[]; compares: Compare[] }
  | { ok: false; ms: number; error: string };

export interface CheckContext {
  signal: AbortSignal;
  live: FluxLiveSnapshot;
  /** The height the heartbeat is showing, if it has one. */
  height?: number;
}

export interface CheckDef {
  id: CheckId;
  title: string;
  /** One line: what the endpoint returns. */
  returns: string;
  url: string;
  host: string;
  path: string;
  /** What to paste into a terminal. Prints the number the wall shows. */
  command: string;
  run: (ctx: CheckContext) => Promise<CheckResult>;
}

const TIMEOUT_MS = 25_000;

function urlParts(url: string): { host: string; path: string } {
  const u = new URL(url);
  return { host: u.host, path: `${u.pathname}${u.search}` };
}

/** FluxOS wraps answers as { status, data }; anything else is not what we asked for. */
function unwrap(body: unknown): unknown {
  if (body && typeof body === 'object' && (body as { status?: unknown }).status === 'success') {
    return (body as { data?: unknown }).data;
  }
  return undefined;
}

async function request(
  url: string,
  outer: AbortSignal,
): Promise<{ ok: true; ms: number; bytes: number; body: unknown } | { ok: false; ms: number; error: string }> {
  const { host } = urlParts(url);
  const t0 = performance.now();
  const timer = new AbortController();
  const stop = window.setTimeout(() => timer.abort(), TIMEOUT_MS);
  const onAbort = () => timer.abort();
  outer.addEventListener('abort', onAbort, { once: true });
  const since = () => Math.round(performance.now() - t0);
  try {
    const res = await fetch(url, { signal: timer.signal, headers: { accept: 'application/json' }, cache: 'no-store' });
    if (!res.ok) return { ok: false, ms: since(), error: `${host} answered with HTTP ${res.status}` };
    const text = await res.text();
    try {
      return { ok: true, ms: since(), bytes: text.length, body: JSON.parse(text) as unknown };
    } catch {
      return { ok: false, ms: since(), error: `${host} answered, but not with JSON, so there is nothing to compare` };
    }
  } catch {
    if (outer.aborted) return { ok: false, ms: since(), error: 'Stopped' };
    if (timer.signal.aborted) {
      return { ok: false, ms: since(), error: `No answer from ${host} within ${TIMEOUT_MS / 1000} seconds, it may be busy or your network may be blocking it` };
    }
    return { ok: false, ms: since(), error: `Could not reach ${host}, check your connection or run the command in a terminal` };
  } finally {
    window.clearTimeout(stop);
    outer.removeEventListener('abort', onAbort);
  }
}

/** JSON as the first lines of a terminal answer: objects in full, long arrays cut after two rows. */
export function previewJson(value: unknown, maxLines = 13): string[] {
  const lines: string[] = [];
  const walk = (v: unknown, indent: string, lead: string, trail: string) => {
    if (Array.isArray(v)) {
      if (v.length === 0) return void lines.push(`${indent}${lead}[]${trail}`);
      lines.push(`${indent}${lead}[`);
      const shown = v.slice(0, 2);
      shown.forEach((item, i) => walk(item, `${indent}  `, '', i < shown.length - 1 || v.length > shown.length ? ',' : ''));
      if (v.length > shown.length) lines.push(`${indent}  // … ${formatInt(v.length - shown.length)} more`);
      lines.push(`${indent}]${trail}`);
    } else if (v && typeof v === 'object') {
      const entries = Object.entries(v as Record<string, unknown>);
      lines.push(`${indent}${lead}{`);
      entries.forEach(([k, item], i) => walk(item, `${indent}  `, `${JSON.stringify(k)}: `, i < entries.length - 1 ? ',' : ''));
      lines.push(`${indent}}${trail}`);
    } else {
      lines.push(`${indent}${lead}${JSON.stringify(v)}${trail}`);
    }
  };
  walk(value, '', '', '');
  return lines.length > maxLines ? [...lines.slice(0, maxLines - 1), '…'] : lines;
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** "Close" is a gap a refresh explains: nodes join and leave, and the wall is a few seconds behind. */
function compare(label: string, here: number, wall: number | undefined, fmt: (n: number) => string, tolerance?: number): Compare {
  if (wall === undefined || !Number.isFinite(wall)) return { label, here: fmt(here), wall: '–', tone: 'close' };
  const [h, w] = [fmt(here), fmt(wall)];
  const slack = tolerance ?? Math.max(3, wall * 0.002);
  const tone = h === w ? 'match' : Math.abs(here - wall) <= slack ? 'close' : 'differs';
  return { label, here: h, wall: w, tone };
}

const NODE_COUNT = LIVE_ENDPOINTS.nodeCount;
const BLOCK_COUNT = LIVE_ENDPOINTS.blockCount;
const CAPACITY = LIVE_ENDPOINTS.capacity;

export const CHECKS: readonly CheckDef[] = [
  {
    id: 'nodes',
    title: 'Nodes online',
    returns: 'Confirmed nodes, in total and per tier',
    url: NODE_COUNT,
    ...urlParts(NODE_COUNT),
    command: `curl -s ${NODE_COUNT} \\\n  | jq '.data.total'`,
    async run({ signal, live }) {
      const r = await request(NODE_COUNT, signal);
      if (!r.ok) return r;
      const data = unwrap(r.body);
      const d = data && typeof data === 'object' ? (data as Record<string, unknown>) : undefined;
      if (!d || !isNum(d.total)) return { ok: false, ms: r.ms, error: 'The API replied, but not with a node count' };
      const compares = [compare('Nodes online', d.total, live.totalNodes || undefined, formatInt)];
      for (const tier of ['cumulus', 'nimbus', 'stratus'] as const) {
        const n = d[`${tier}-enabled`];
        if (isNum(n)) compares.push(compare(tier[0]?.toUpperCase() + tier.slice(1), n, live.tiers[tier] || undefined, formatInt));
      }
      return { ok: true, ms: r.ms, bytes: r.bytes, preview: previewJson(r.body), compares };
    },
  },
  {
    id: 'height',
    title: 'Block height',
    returns: `The height of the chain, one new block about every ${CHAIN.blockSeconds} seconds`,
    url: BLOCK_COUNT,
    ...urlParts(BLOCK_COUNT),
    command: `curl -s ${BLOCK_COUNT} | jq '.data'`,
    async run({ signal, height }) {
      const r = await request(BLOCK_COUNT, signal);
      if (!r.ok) return r;
      const data = unwrap(r.body);
      if (!isNum(data)) return { ok: false, ms: r.ms, error: 'The API replied, but not with a block height' };
      return { ok: true, ms: r.ms, bytes: r.bytes, preview: previewJson(r.body), compares: [compare('Block height', data, height, formatInt, 3)] };
    },
  },
  {
    id: 'capacity',
    title: 'Cores, memory, storage, countries',
    returns: 'One row per node: its tier, benchmark and country',
    url: CAPACITY,
    ...urlParts(CAPACITY),
    command: `curl -s "${CAPACITY}" \\\n  | jq '[.data[].benchmark.bench.cores // 0] | add'`,
    async run({ signal, live }) {
      const r = await request(CAPACITY, signal);
      if (!r.ok) return r;
      const rows = unwrap(r.body);
      if (!Array.isArray(rows) || rows.length === 0) return { ok: false, ms: r.ms, error: 'The API replied, but with no node rows' };
      // The same sums the live layer makes: reachable nodes only, countries from IP geolocation.
      let cores = 0;
      let ramGb = 0;
      let ssdGb = 0;
      const countries = new Set<string>();
      for (const row of rows as { benchmark?: { bench?: { cores?: unknown; ram?: unknown; ssd?: unknown } }; geolocation?: { countryCode?: unknown } }[]) {
        const bench = row?.benchmark?.bench;
        if (bench && isNum(bench.cores) && bench.cores > 0) {
          cores += bench.cores;
          if (isNum(bench.ram)) ramGb += bench.ram;
          if (isNum(bench.ssd)) ssdGb += bench.ssd;
        }
        const cc = row?.geolocation?.countryCode;
        if (typeof cc === 'string' && cc) countries.add(cc.toUpperCase());
      }
      const tb = (n: number) => formatStorageTb(n).text;
      const compares = [
        compare('CPU cores', Math.round(cores), live.totalCores, formatInt),
        compare('RAM', Math.round(ramGb / 100) / 10, live.totalRamTb, tb),
        compare('SSD storage', Math.round(ssdGb / 100) / 10, live.totalSsdTb, tb),
        compare('Countries', countries.size, live.countries, formatInt),
      ];
      return { ok: true, ms: r.ms, bytes: r.bytes, preview: previewJson(r.body), compares };
    },
  },
];
