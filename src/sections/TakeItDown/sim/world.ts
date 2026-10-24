/**
 * Chapter 05, the two worlds the same app is hosted in. Pure and deterministic: the same seed and
 * the same data build the same worlds, so a shared link replays the scenario.
 *
 *   flux    FLUX_NODES nodes sampled from the real network. Positions are real (useFluxLive().points),
 *           the country split is real (byCountry, largest remainder, every continent that has nodes
 *           appears at least once), the provider sizes are real (`hostingOrgs`), and which node
 *           belongs to which provider is illustrative: drawn at random inside the countries each
 *           network really operates in. Without `hostingOrgs` the spec's fallback applies: three
 *           illustrative hosts per country, weights .55, .30, .15.
 *   cloud   traditional hosting: one big company, three regions, three data centers (zones) each,
 *           three machines per data center.
 *
 * A host has a site (a data center), a country (a region, in the cloud lane), a provider and a
 * continent. The four weapons take out all hosts that share one of them.
 */
import type { HostingOrg } from '@/data/types';
import { CONTINENT_NAME, continentOf, type ContinentCode } from '@/lib/geo';
import type { CountryCount, NodePoint } from '@/lib/live';
import { mulberry32 } from '@/lib/rng';
import { CLOUD, FLUX_NODES, type LaneKind } from './model';

export interface ProviderInfo {
  name: string;
  /** 'datacenter' and 'isp' come from `hostingOrgs`; 'cloud' labels the traditional lane's one company. */
  kind: 'datacenter' | 'isp' | 'cloud';
  /** True when the name is a real network from `hostingOrgs`. */
  real: boolean;
}

export interface LaneWorld {
  kind: LaneKind;
  /** Number of hosts. */
  n: number;
  lat: Float32Array;
  lon: Float32Array;
  site: Uint8Array;
  nSites: number;
  /** Per host: index into `countryCodes` (in the cloud lane, the region). */
  country: Uint8Array;
  countryCodes: string[];
  countryLabels: string[];
  continent: Uint8Array;
  continentCodes: ContinentCode[];
  provider: Uint8Array;
  providers: ProviderInfo[];
}

export interface Worlds {
  cloud: LaneWorld;
  flux: LaneWorld;
  /** The positions and the country split came from the live layer (false: the labeled fallback set). */
  real: boolean;
  /** The provider sizes came from `hostingOrgs` (false: three illustrative hosts per country). */
  orgs: boolean;
}

export interface WorldInput {
  points: readonly NodePoint[];
  byCountry?: readonly CountryCount[];
  orgs?: readonly HostingOrg[];
  seed: number;
}

interface Cell {
  lat: number;
  lon: number;
  w: number;
}

interface Row {
  code: string;
  weight: number;
  cells: Cell[];
}

/**
 * Used only when the live layer has no node positions: six countries and a few sites in each. The
 * weights are relative and illustrative; the chapter labels the field as illustrative when it is used.
 */
const FALLBACK: readonly Row[] = [
  { code: 'DE', weight: 22, cells: [{ lat: 50.1, lon: 8.7, w: 5 }, { lat: 49.5, lon: 11, w: 3 }, { lat: 51.3, lon: 12.4, w: 2 }] },
  { code: 'US', weight: 17, cells: [{ lat: 39, lon: -77.5, w: 5 }, { lat: 33, lon: -97, w: 3 }, { lat: 37.4, lon: -122, w: 2 }] },
  { code: 'FI', weight: 15, cells: [{ lat: 60.2, lon: 25, w: 8 }, { lat: 62.2, lon: 25.7, w: 1 }] },
  { code: 'FR', weight: 10, cells: [{ lat: 48.9, lon: 2.4, w: 4 }, { lat: 45.7, lon: 4.8, w: 2 }] },
  { code: 'CA', weight: 6, cells: [{ lat: 45.5, lon: -73.6, w: 3 }, { lat: 49.3, lon: -123, w: 2 }] },
  { code: 'GB', weight: 3, cells: [{ lat: 51.5, lon: -0.1, w: 3 }, { lat: 53.5, lon: -2.2, w: 1 }] },
];

const CONTINENTS: readonly ContinentCode[] = ['EU', 'NA', 'AS', 'SA', 'OC', 'AF', 'AN'];

/** Where an extra cloud region sits when the node list does not reach a third continent. */
const EXTRA_REGIONS: readonly { continent: ContinentCode; code: string; lat: number; lon: number }[] = [
  { continent: 'AS', code: 'JP', lat: 35.7, lon: 139.7 },
  { continent: 'OC', code: 'AU', lat: -33.9, lon: 151.2 },
  { continent: 'SA', code: 'BR', lat: -23.5, lon: -46.6 },
];

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    return null;
  }
})();

/** "DE" to "Germany". Falls back to the code. */
function regionName(code: string): string {
  try {
    return regionNames?.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/* ---- sampling helpers ------------------------------------------------------------------------ */

function weightedPick(rand: () => number, weights: readonly number[]): number {
  let total = 0;
  for (const w of weights) total += w;
  if (total <= 0) return Math.floor(rand() * weights.length);
  let r = rand() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i] ?? 0;
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

/** `total` split by the weights, largest remainder. Returns a count per weight. */
function largestRemainder(weights: readonly number[], total: number): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  const quota = weights.map((w) => (sum > 0 ? (w / sum) * total : 0));
  const out = quota.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = quota.map((q, i) => ({ i, r: q - Math.floor(q) })).sort((a, b) => b.r - a.r || a.i - b.i);
  for (let k = 0; left > 0 && order.length; k = (k + 1) % order.length, left--) out[order[k]!.i]! += 1;
  return out;
}

/**
 * Split `total` nodes across the countries by weight (largest remainder), then make sure every
 * continent that has any node gets at least one: it is what lets "spread across continents" mean
 * something. The extra nodes come off the allocations that were rounded up the most, so the big
 * countries keep their real share.
 */
function allocate(rows: readonly Row[], total: number): number[] {
  const sum = rows.reduce((a, r) => a + r.weight, 0);
  const quota = rows.map((r) => (sum > 0 ? (r.weight / sum) * total : 0));
  const alloc = largestRemainder(
    rows.map((r) => r.weight),
    total,
  );
  const best = new Map<ContinentCode, number>();
  rows.forEach((r, i) => {
    const k = continentOf(r.code);
    if (!k) return;
    const b = best.get(k);
    if (b === undefined || r.weight > rows[b]!.weight) best.set(k, i);
  });
  for (const i of best.values()) {
    if (alloc[i]! > 0) continue;
    let donor = -1;
    let over = -Infinity;
    for (let j = 0; j < alloc.length; j++) {
      if (alloc[j]! < 1 || best.get(continentOf(rows[j]!.code) ?? 'EU') === j) continue; // keep each continent's best
      const o = alloc[j]! - quota[j]!;
      if (o > over || (o === over && alloc[j]! > alloc[donor]!)) {
        over = o;
        donor = j;
      }
    }
    if (donor < 0) break;
    alloc[donor]! -= 1;
    alloc[i] = 1;
  }
  return alloc;
}

/** Node positions per country, merged across tiers (the live points carry one entry per tier per cell). */
function collectCells(points: readonly NodePoint[]): Map<string, Cell[]> {
  const byCountry = new Map<string, Map<string, Cell>>();
  for (const p of points) {
    if (!p.country) continue;
    const cells = byCountry.get(p.country) ?? new Map<string, Cell>();
    const key = `${p.lat},${p.lon}`;
    const cell = cells.get(key);
    const w = p.weight ?? 1;
    if (cell) cell.w += w;
    else cells.set(key, { lat: p.lat, lon: p.lon, w });
    byCountry.set(p.country, cells);
  }
  const out = new Map<string, Cell[]>();
  for (const [code, cells] of byCountry) out.set(code, [...cells.values()].sort((a, b) => b.w - a.w || a.lat - b.lat || a.lon - b.lon));
  return out;
}

function buildRows(input: WorldInput): { rows: Row[]; real: boolean } {
  const cells = collectCells(input.points);
  if (cells.size === 0) return { rows: FALLBACK.map((r) => ({ ...r, cells: r.cells.map((c) => ({ ...c })) })), real: false };
  const counted = new Map<string, number>();
  for (const c of input.byCountry ?? []) counted.set(c.code, c.nodes);
  const rows: Row[] = [];
  for (const [code, list] of cells) {
    const fromPoints = list.reduce((a, c) => a + c.w, 0);
    rows.push({ code, weight: counted.get(code) ?? fromPoints, cells: list });
  }
  rows.sort((a, b) => b.weight - a.weight || a.code.localeCompare(b.code));
  return { rows, real: true };
}

/** The weighted centre of a country's sites: where its region sits on the map. */
function centroid(row: Row): { lat: number; lon: number } {
  let w = 0;
  let lat = 0;
  let lon = 0;
  for (const c of row.cells) {
    w += c.w;
    lat += c.lat * c.w;
    lon += c.lon * c.w;
  }
  return w > 0 ? { lat: lat / w, lon: lon / w } : { lat: row.cells[0]?.lat ?? 0, lon: row.cells[0]?.lon ?? 0 };
}

/* ---- world assembly --------------------------------------------------------------------------- */

interface HostDraft {
  lat: number;
  lon: number;
  siteKey: string;
  country: string;
  countryLabel: string;
  provider: number;
}

function assemble(
  kind: LaneKind,
  drafts: readonly HostDraft[],
  providers: ProviderInfo[],
  countryOrder: readonly string[],
  labelOf: (code: string) => string,
): LaneWorld {
  const n = drafts.length;
  const world: LaneWorld = {
    kind,
    n,
    lat: new Float32Array(n),
    lon: new Float32Array(n),
    site: new Uint8Array(n),
    nSites: 0,
    country: new Uint8Array(n),
    countryCodes: [...countryOrder],
    countryLabels: countryOrder.map(labelOf),
    continent: new Uint8Array(n),
    continentCodes: [],
    provider: new Uint8Array(n),
    providers,
  };
  const sites = new Map<string, number>();
  const conts: ContinentCode[] = [];
  drafts.forEach((d, i) => {
    world.lat[i] = d.lat;
    world.lon[i] = d.lon;
    let s = sites.get(d.siteKey);
    if (s === undefined) {
      s = sites.size;
      sites.set(d.siteKey, s);
    }
    world.site[i] = s;
    world.country[i] = Math.max(0, countryOrder.indexOf(d.country));
    const k = continentOf(d.country) ?? 'EU';
    let ci = conts.indexOf(k);
    if (ci < 0) {
      ci = conts.length;
      conts.push(k);
    }
    world.continent[i] = ci;
    world.provider[i] = d.provider;
  });
  world.nSites = sites.size;
  world.continentCodes = conts;
  return world;
}

function pickCell(rand: () => number, row: Row): Cell {
  return row.cells[weightedPick(rand, row.cells.map((c) => c.w))] ?? row.cells[0] ?? { lat: 0, lon: 0, w: 1 };
}

/* ---- flux ------------------------------------------------------------------------------------ */

/**
 * The providers behind the sample. With `hostingOrgs`: each real network gets its share of the
 * nodes (shares are normalized: they add up to 99.9), placed in the countries it really operates
 * in; the two "other" buckets become many small providers, one node each. Returns, per node, its
 * country row and provider index.
 */
function pairWithOrgs(
  rand: () => number,
  rows: readonly Row[],
  alloc: readonly number[],
  orgs: readonly HostingOrg[],
  providers: ProviderInfo[],
): { row: number; provider: number }[] {
  const capacity = [...alloc];
  const rowOf = new Map(rows.map((r, i) => [r.code, i] as const));
  const targets = largestRemainder(
    orgs.map((o) => o.sharePct),
    FLUX_NODES,
  );
  const named = orgs
    .map((o, i) => ({ o, t: targets[i] ?? 0, i }))
    .filter((x) => x.o.asn !== 0 && (x.o.countries?.length ?? 0) > 0 && x.t > 0)
    .sort((a, b) => b.t - a.t || a.i - b.i);

  const out: { row: number; provider: number }[] = [];
  for (const { o, t } of named) {
    const idx = providers.length;
    let placed = 0;
    for (let k = 0; k < t; k++) {
      const candidates: number[] = [];
      const weights: number[] = [];
      (o.countries ?? []).forEach((code, ci) => {
        const r = rowOf.get(code);
        if (r !== undefined && (capacity[r] ?? 0) > 0) {
          candidates.push(r);
          // The list is ordered most nodes first: earlier countries are likelier.
          weights.push(1 / (1 + ci * 0.7));
        }
      });
      if (!candidates.length) break;
      const r = candidates[weightedPick(rand, weights)]!;
      capacity[r]! -= 1;
      out.push({ row: r, provider: idx });
      placed++;
    }
    if (placed > 0) providers.push({ name: o.name, kind: o.kind ?? 'datacenter', real: true });
  }

  // The long tail: whatever capacity is left goes to many small providers, one node each. How many
  // are home and business internet against small data centers follows the two "other" buckets.
  const ispShare = orgs.filter((o) => o.asn === 0 && o.kind === 'isp').reduce((a, o) => a + o.sharePct, 0);
  const dcShare = orgs.filter((o) => o.asn === 0 && o.kind !== 'isp').reduce((a, o) => a + o.sharePct, 0);
  const pIsp = ispShare + dcShare > 0 ? ispShare / (ispShare + dcShare) : 0.5;
  rows.forEach((_, r) => {
    for (let k = 0; k < (capacity[r] ?? 0); k++) {
      const isp = rand() < pIsp;
      providers.push({ name: isp ? 'Home or business internet' : 'Small data center', kind: isp ? 'isp' : 'datacenter', real: false });
      out.push({ row: r, provider: providers.length - 1 });
    }
  });
  return out;
}

/** The spec's fallback: three illustrative hosts per country, weights .55, .30, .15. */
function pairIllustrative(
  rand: () => number,
  rows: readonly Row[],
  alloc: readonly number[],
  providers: ProviderInfo[],
): { row: number; provider: number }[] {
  const out: { row: number; provider: number }[] = [];
  rows.forEach((_, r) => {
    const base = providers.length;
    for (let k = 0; k < (alloc[r] ?? 0); k++) out.push({ row: r, provider: base + weightedPick(rand, [0.55, 0.3, 0.15]) });
    for (const name of ['Host A', 'Host B', 'Host C']) providers.push({ name, kind: 'datacenter', real: false });
  });
  return out;
}

function buildFlux(input: WorldInput, rows: readonly Row[]): { world: LaneWorld; orgs: boolean } {
  const rand = mulberry32(input.seed ^ 0x5eed0001);
  const alloc = allocate(rows, FLUX_NODES);
  const providers: ProviderInfo[] = [];
  const orgs = (input.orgs ?? []).filter((o) => o.sharePct > 0);
  const useOrgs = orgs.length > 0;
  const pairs = useOrgs ? pairWithOrgs(rand, rows, alloc, orgs, providers) : pairIllustrative(rand, rows, alloc, providers);

  const drafts: HostDraft[] = pairs.map(({ row, provider }) => {
    const r = rows[row]!;
    const cell = pickCell(rand, r);
    return {
      lat: cell.lat,
      lon: cell.lon,
      siteKey: `${r.code}|${cell.lat},${cell.lon}|${provider}`,
      country: r.code,
      countryLabel: regionName(r.code),
      provider,
    };
  });
  // Drop providers that ended up with no node (the illustrative fallback creates three per country).
  const used = new Set(drafts.map((d) => d.provider));
  const remap = new Map<number, number>();
  const kept: ProviderInfo[] = [];
  providers.forEach((p, i) => {
    if (used.has(i)) {
      remap.set(i, kept.length);
      kept.push(p);
    }
  });
  for (const d of drafts) d.provider = remap.get(d.provider) ?? 0;

  const order = [...new Set(drafts.map((d) => d.country))];
  return { world: assemble('flux', drafts, kept, order, regionName), orgs: useOrgs };
}

/* ---- cloud ----------------------------------------------------------------------------------- */

function buildCloud(rows: readonly Row[], rand: () => number): LaneWorld {
  // The three regions: the biggest country of each of the three biggest continents.
  const perContinent = new Map<ContinentCode, { weight: number; row: Row }>();
  const total = new Map<ContinentCode, number>();
  for (const r of rows) {
    const k = continentOf(r.code);
    if (!k) continue;
    total.set(k, (total.get(k) ?? 0) + r.weight);
    const cur = perContinent.get(k);
    if (!cur || r.weight > cur.weight) perContinent.set(k, { weight: r.weight, row: r });
  }
  const regions = [...perContinent.entries()]
    .sort((a, b) => (total.get(b[0]) ?? 0) - (total.get(a[0]) ?? 0) || CONTINENTS.indexOf(a[0]) - CONTINENTS.indexOf(b[0]))
    .slice(0, CLOUD.regions)
    .map(([continent, v]) => ({ continent, row: v.row, at: centroid(v.row) }));
  // A short list of countries (the labeled fallback) may cover fewer than three continents.
  for (const extra of EXTRA_REGIONS) {
    if (regions.length >= CLOUD.regions) break;
    if (regions.some((r) => r.continent === extra.continent)) continue;
    regions.push({ continent: extra.continent, row: { code: extra.code, weight: 0, cells: [] }, at: { lat: extra.lat, lon: extra.lon } });
  }

  const drafts: HostDraft[] = [];
  regions.forEach(({ row, at }, r) => {
    for (let z = 0; z < CLOUD.zones; z++) {
      // The zones of a region sit a degree or two apart; the layout pushes them apart for good.
      const a = (z / CLOUD.zones) * Math.PI * 2 + rand() * 0.4;
      for (let m = 0; m < CLOUD.machinesPerZone; m++) {
        drafts.push({
          lat: at.lat + Math.sin(a) * 1.8,
          lon: at.lon + Math.cos(a) * 2.4,
          siteKey: `${r}|${z}`,
          country: row.code,
          countryLabel: `${CONTINENT_NAME[regions[r]!.continent]} region`,
          provider: 0,
        });
      }
    }
  });
  const order = regions.map((x) => x.row.code);
  const label = (code: string) => {
    const k = continentOf(code);
    return `${k ? CONTINENT_NAME[k] : regionName(code)} region`;
  };
  return assemble('cloud', drafts, [{ name: 'The cloud company', kind: 'cloud', real: false }], order, label);
}

/* ---- both ------------------------------------------------------------------------------------ */

export function buildWorlds(input: WorldInput): Worlds {
  const { rows, real } = buildRows(input);
  const flux = buildFlux(input, rows);
  const rand = mulberry32(input.seed ^ 0x5eed0002);
  return {
    cloud: buildCloud(rows, rand),
    flux: flux.world,
    real,
    orgs: flux.orgs,
  };
}
