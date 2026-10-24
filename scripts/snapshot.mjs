#!/usr/bin/env node
/**
 * Pulls a compact snapshot of the live Flux network and writes:
 *   public/data/network-snapshot.json   full snapshot incl. de-duplicated node points (fetched by the UI)
 *   src/lib/live/snapshot.generated.ts  counts only (bundled, so numbers render on first paint)
 *
 * Plain Node 24+, global fetch, no dependencies. Run: node scripts/snapshot.mjs
 * Dry run (fetch node data only, print the summary and concentration, write nothing):
 *   node scripts/snapshot.mjs --dry
 *
 * Sources (all public, no auth, CORS *):
 *   https://api.runonflux.io/daemon/getfluxnodecount           tier counts (required)
 *   https://api.runonflux.io/daemon/getblockcount              chain height
 *   https://stats.runonflux.io/fluxinfo?projection=...         per-node geo, benchmark, operator (required)
 *   https://api.runonflux.io/apps/locations                    running app instances
 *   https://api.runonflux.io/apps/globalappsspecifications     registered apps
 *   https://api.runonflux.io/apps/hashes                       every app message ever put on chain
 *
 * Required sources failing aborts the run without touching existing files. Optional sources
 * failing keep the previous snapshot's values for those fields.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_JSON = resolve(ROOT, 'public/data/network-snapshot.json');
const OUT_TS = resolve(ROOT, 'src/lib/live/snapshot.generated.ts');

const API = 'https://api.runonflux.io';
const STATS = 'https://stats.runonflux.io';
const PROJECTION = [
  'tier',
  'geolocation.lat',
  'geolocation.lon',
  'geolocation.countryCode',
  'geolocation.continentCode',
  'geolocation.asn',
  'geolocation.dataCenter',
  'ip',
  'benchmark.bench.cores',
  'benchmark.bench.ram',
  'benchmark.bench.ssd',
  'flux.zelid',
  'flux.arcaneVersion',
].join(',');

const URLS = {
  nodeCount: `${API}/daemon/getfluxnodecount`,
  blockCount: `${API}/daemon/getblockcount`,
  fluxinfo: `${STATS}/fluxinfo?projection=${PROJECTION}`,
  locations: `${API}/apps/locations`,
  specs: `${API}/apps/globalappsspecifications`,
  hashes: `${API}/apps/hashes`,
};

/** Grid size in degrees for de-duplicating node points. */
const CELL = 0.5;
const TIERS = ['cumulus', 'nimbus', 'stratus'];
const COLLATERAL = { cumulus: 1000, nimbus: 12500, stratus: 40000 };

const log = (...a) => console.log('[snapshot]', ...a);
const DRY = process.argv.includes('--dry');

async function getJson(url, { timeoutMs = 60_000, retries = 2 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { accept: 'application/json', 'user-agent': 'whyflux-snapshot/1' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      // FluxOS reports errors as HTTP 200 with status:"error".
      if (body?.status !== 'success') throw new Error(`envelope status ${body?.status}: ${JSON.stringify(body?.data)?.slice(0, 200)}`);
      return body.data;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw new Error(`${url}: ${lastErr?.message ?? lastErr}`);
}

async function optional(name, fn) {
  try {
    return await fn();
  } catch (err) {
    log(`optional source "${name}" failed, keeping previous value:`, err.message);
    return undefined;
  }
}

const tierKey = (t) => (typeof t === 'string' ? t.toLowerCase() : '');
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d;

function summarizeNodes(rows) {
  const countries = new Map(); // cc -> { nodes, tiers }
  const continents = new Set();
  const operators = new Set();
  const asns = new Set();
  const cells = new Map(); // "lat|lon|tier" -> { lat, lon, t, w, cc: Map }
  let cores = 0;
  let ramGb = 0;
  let ssdGb = 0;
  let benchmarked = 0;
  let arcane = 0;
  let located = 0;

  for (const r of rows) {
    const tier = tierKey(r?.tier);
    const t = TIERS.indexOf(tier);
    const geo = r?.geolocation ?? {};
    const bench = r?.benchmark?.bench ?? {};

    // Unreachable nodes come back as zeroed placeholders: treat as missing, not (0,0).
    const c = num(bench.cores);
    if (c > 0) {
      benchmarked += 1;
      cores += c;
      ramGb += num(bench.ram);
      ssdGb += num(bench.ssd);
    }
    if (r?.flux?.arcaneVersion) arcane += 1;
    if (r?.flux?.zelid) operators.add(r.flux.zelid);
    if (typeof geo.asn === 'string' && geo.asn) asns.add(geo.asn.split(' ')[0]);
    if (geo.continentCode) continents.add(geo.continentCode);

    const cc = typeof geo.countryCode === 'string' ? geo.countryCode.toUpperCase() : '';
    if (cc && t >= 0) {
      const entry = countries.get(cc) ?? { nodes: 0, tiers: [0, 0, 0] };
      entry.nodes += 1;
      entry.tiers[t] += 1;
      countries.set(cc, entry);
    }

    const lat = num(geo.lat);
    const lon = num(geo.lon);
    if ((lat !== 0 || lon !== 0) && t >= 0) {
      located += 1;
      const clat = round(Math.round(lat / CELL) * CELL, 2);
      const clon = round(Math.round(lon / CELL) * CELL, 2);
      const key = `${clat}|${clon}|${t}`;
      const cell = cells.get(key) ?? { lat: clat, lon: clon, t, w: 0, cc: new Map() };
      cell.w += 1;
      if (cc) cell.cc.set(cc, (cell.cc.get(cc) ?? 0) + 1);
      cells.set(key, cell);
    }
  }

  const byCountry = [...countries.entries()]
    .sort((a, b) => b[1].nodes - a[1].nodes || a[0].localeCompare(b[0]))
    .map(([code, v]) => ({ code, nodes: v.nodes, tiers: { cumulus: v.tiers[0], nimbus: v.tiers[1], stratus: v.tiers[2] } }));

  const points = [...cells.values()]
    .sort((a, b) => b.w - a.w)
    .map((p) => {
      const top = [...p.cc.entries()].sort((a, b) => b[1] - a[1])[0];
      return [p.lat, p.lon, p.t, p.w, top ? top[0] : ''];
    });

  return {
    statsRows: rows.length,
    benchmarked,
    located,
    countries: countries.size,
    continents: continents.size,
    operators: operators.size,
    asns: asns.size,
    arcaneNodes: arcane,
    totalCores: Math.round(cores),
    totalRamTb: round(ramGb / 1000, 1),
    totalSsdTb: round(ssdGb / 1000, 1),
    byCountry,
    points,
  };
}

/**
 * Concentration of the node set (research/flux.md section 13). Base: rows that report
 * an operator ID and an ASN, i.e. nodes that answered the stats crawl. Shares are of
 * that base. Human names for networks are curated in src/data/flux.ts (hostingOrgs).
 */
function summarizeConcentration(rows) {
  const base = rows.filter((r) => r?.flux?.zelid && typeof r?.geolocation?.asn === 'string' && r.geolocation.asn);
  const n = base.length;
  const ops = new Map();
  const nets = new Map(); // asn -> { name, nodes, dc, ops }
  const ips = new Set();
  let dataCenterNodes = 0;
  let europeNodes = 0;
  for (const r of base) {
    const geo = r.geolocation;
    const id = r.flux.zelid;
    ops.set(id, (ops.get(id) ?? 0) + 1);
    const [token, ...rest] = geo.asn.split(' ');
    const asn = Number(token.replace(/^AS/i, '')) || 0;
    const net = nets.get(asn) ?? { name: rest.join(' '), nodes: 0, dc: 0, ops: new Set() };
    net.nodes += 1;
    net.ops.add(id);
    if (geo.dataCenter === true) {
      net.dc += 1;
      dataCenterNodes += 1;
    }
    nets.set(asn, net);
    if (geo.continentCode === 'EU') europeNodes += 1;
    if (typeof r.ip === 'string' && r.ip) ips.add(r.ip.includes('[') ? r.ip.split(']')[0] : r.ip.replace(/:\d+$/, ''));
  }
  /** Fewest entries (largest first) whose counts add up to more than frac of the base. */
  const fewestFor = (sortedCounts, frac) => {
    let sum = 0;
    for (let i = 0; i < sortedCounts.length; i += 1) {
      sum += sortedCounts[i];
      if (sum > frac * n) return i + 1;
    }
    return sortedCounts.length;
  };
  const opCounts = [...ops.values()].sort((a, b) => b - a);
  const netList = [...nets.entries()].sort((a, b) => b[1].nodes - a[1].nodes);
  const netCounts = netList.map(([, v]) => v.nodes);
  return {
    basis: n,
    operators: ops.size,
    operatorsForHalf: fewestFor(opCounts, 1 / 2),
    operatorsForThird: fewestFor(opCounts, 1 / 3),
    largestOperator: opCounts[0] ?? 0,
    dataCenterNodes,
    europeNodes,
    distinctIps: ips.size,
    asns: nets.size,
    asnsForHalf: fewestFor(netCounts, 1 / 2),
    topNetworks: netList.slice(0, 20).map(([asn, v]) => [asn, v.name, v.nodes, v.dc, v.ops.size]),
  };
}

function summarizeApps(locations, specs, hashes) {
  const out = {};
  if (Array.isArray(locations)) {
    const perApp = new Map();
    for (const row of locations) {
      if (row?.name) perApp.set(row.name, (perApp.get(row.name) ?? 0) + 1);
    }
    out.runningApps = perApp.size;
    out.runningInstances = locations.length;
    out.multiInstanceApps = [...perApp.values()].filter((n) => n >= 2).length;
  }
  if (Array.isArray(specs)) out.registeredApps = specs.length;
  if (Array.isArray(hashes)) out.appMessages = hashes.length;
  return out;
}

async function readPrevious() {
  try {
    return JSON.parse(await readFile(OUT_JSON, 'utf8'));
  } catch {
    return {};
  }
}

async function main() {
  const started = Date.now();
  const prev = await readPrevious();

  log('fetching node count and per-node stats (required)...');
  const [count, rows] = await Promise.all([getJson(URLS.nodeCount, { timeoutMs: 20_000 }), getJson(URLS.fluxinfo, { timeoutMs: 120_000 })]);
  if (!Array.isArray(rows) || rows.length < 100) throw new Error(`fluxinfo returned ${rows?.length} rows`);
  const tiers = {
    cumulus: num(count['cumulus-enabled']),
    nimbus: num(count['nimbus-enabled']),
    stratus: num(count['stratus-enabled']),
  };
  const totalNodes = num(count.total) || tiers.cumulus + tiers.nimbus + tiers.stratus;
  if (totalNodes < 100) throw new Error(`implausible node count ${totalNodes}`);

  log(DRY ? 'dry run: skipping app data' : 'fetching chain height and app data (optional)...');
  const [height, locations, specs, hashes] = DRY ? [] : await Promise.all([
    optional('blockCount', () => getJson(URLS.blockCount, { timeoutMs: 20_000 })),
    optional('locations', () => getJson(URLS.locations, { timeoutMs: 120_000 })),
    optional('specs', () => getJson(URLS.specs, { timeoutMs: 180_000 })),
    optional('hashes', () => getJson(URLS.hashes, { timeoutMs: 180_000 })),
  ]);

  const nodes = summarizeNodes(rows);
  const apps = summarizeApps(locations, specs, hashes);
  const concentration = summarizeConcentration(rows);
  const lockedCollateral = TIERS.reduce((sum, t) => sum + tiers[t] * COLLATERAL[t], 0);

  const keep = (key, value) => (value === undefined ? prev[key] : value);
  const generatedAt = new Date().toISOString();

  const summary = {
    schema: 1,
    generatedAt,
    blockHeight: keep('blockHeight', typeof height === 'number' ? height : undefined),
    totalNodes,
    tiers,
    lockedCollateral,
    countries: nodes.countries,
    continents: nodes.continents,
    operators: nodes.operators,
    asns: nodes.asns,
    arcaneNodes: nodes.arcaneNodes,
    totalCores: nodes.totalCores,
    totalRamTb: nodes.totalRamTb,
    totalSsdTb: nodes.totalSsdTb,
    runningApps: keep('runningApps', apps.runningApps),
    runningInstances: keep('runningInstances', apps.runningInstances),
    multiInstanceApps: keep('multiInstanceApps', apps.multiInstanceApps),
    registeredApps: keep('registeredApps', apps.registeredApps),
    appMessages: keep('appMessages', apps.appMessages),
    byCountry: nodes.byCountry,
  };

  const full = {
    ...summary,
    coverage: { statsRows: nodes.statsRows, benchmarked: nodes.benchmarked, located: nodes.located },
    sources: URLS,
    /** Raw counts behind flux.ts `concentration` and `hostingOrgs`. topNetworks rows: [asn, registered name, nodes, data-center-flagged nodes, operator IDs] */
    concentration,
    pointCell: CELL,
    /** [lat, lon, tierIndex (0 cumulus, 1 nimbus, 2 stratus), nodeCount, countryCode] */
    points: nodes.points,
  };

  if (DRY) {
    const { byCountry, ...counts } = summary;
    log('dry run, nothing written. summary:', JSON.stringify(counts));
    log('concentration:', JSON.stringify(concentration, null, 1));
    return;
  }

  const json = JSON.stringify(full);
  await mkdir(dirname(OUT_JSON), { recursive: true });
  await writeFile(OUT_JSON, `${json}\n`);

  // One key per line, one country per line: readable diffs without 400 lines of braces.
  const body = Object.entries(summary)
    .map(([k, v]) =>
      k === 'byCountry'
        ? `  ${k}: [\n${v.map((c) => `    ${JSON.stringify(c)},`).join('\n')}\n  ],`
        : `  ${k}: ${JSON.stringify(v)},`,
    )
    .join('\n');
  const ts = `/**
 * GENERATED by scripts/snapshot.mjs on ${generatedAt}. Do not edit by hand.
 * Network counts bundled with the app so numbers render on first paint;
 * node points live in public/data/network-snapshot.json and load separately.
 */
import type { SnapshotSummary } from './types.ts';

export const SNAPSHOT_SUMMARY: SnapshotSummary = {
${body}
};
`;
  await writeFile(OUT_TS, ts);

  log(
    `ok in ${((Date.now() - started) / 1000).toFixed(1)}s: ${totalNodes} nodes`,
    `(C ${tiers.cumulus} / N ${tiers.nimbus} / S ${tiers.stratus}),`,
    `${nodes.countries} countries, ${summary.runningApps} apps on ${summary.runningInstances} instances,`,
    `${nodes.points.length} points, ${(json.length / 1024).toFixed(1)} KB`,
  );
}

main().catch((err) => {
  console.error('[snapshot] failed, existing files left untouched:', err.message);
  process.exitCode = 1;
});
