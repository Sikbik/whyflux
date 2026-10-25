/**
 * Types for the live Flux network layer. Re-exported from ./index.ts, which is the
 * public surface; import from '@/lib/live', not from this file.
 * Changes are additive only (new optional fields), like src/data/types.ts.
 */
import type { NodeTierId } from '@/data/types.ts';

export interface NodePoint {
  lat: number;
  lon: number;
  tier: NodeTierId;
  /** ISO 3166-1 alpha-2, when known. */
  country?: string;
  /**
   * How many nodes of this tier sit in this grid cell. Points are rounded to a
   * 0.5 degree grid and de-duplicated, so one point can stand for many nodes
   * (Hetzner Falkenstein alone is hundreds). Scatter or size by weight.
   */
  weight?: number;
}

/** Node count for one country, by IP geolocation of each node. */
export interface CountryCount {
  /** ISO 3166-1 alpha-2. */
  code: string;
  nodes: number;
  tiers: Record<NodeTierId, number>;
}

export interface FluxLiveSnapshot {
  /** loading: nothing yet. live: fetched from the network. snapshot: bundled fallback. */
  status: 'loading' | 'live' | 'snapshot';
  /** ISO timestamp of the data. */
  fetchedAt: string;
  totalNodes: number;
  tiers: Record<NodeTierId, number>;
  countries?: number;
  /** Distinct apps with at least one running instance (snapshot only, refreshed by scripts/snapshot.mjs). */
  runningApps?: number;
  /** Logical CPU cores (threads) across benchmarked nodes. */
  totalCores?: number;
  /** Decimal terabytes. */
  totalRamTb?: number;
  /** Decimal terabytes (3,370 TB = 3.37 PB; use formatStorageTb). */
  totalSsdTb?: number;
  /** Node locations for a globe or map; may be downsampled. */
  points: NodePoint[];

  /* ---- additive optional fields ---- */

  /** Chain height. Blocks arrive every ~30 s. */
  blockHeight?: number;
  /** Running app containers across the network (one per app per node). Snapshot only. */
  runningInstances?: number;
  /** Running apps with 2 or more live instances. Snapshot only. */
  multiInstanceApps?: number;
  /** Apps registered on chain (paid, not expired). Snapshot only. */
  registeredApps?: number;
  /** App register/update messages recorded on chain since 2020-09-25. Snapshot only. */
  appMessages?: number;
  /** Continents with at least one node (EU, NA, AS, SA, OC, AF). */
  continents?: number;
  /** Distinct operator identities (Flux IDs) running nodes. Snapshot only. */
  operators?: number;
  /** Distinct networks (autonomous systems) hosting nodes. Snapshot only. */
  asns?: number;
  /** Nodes running ArcaneOS, the hardened node OS. Snapshot only. */
  arcaneNodes?: number;
  /** FLUX locked as node collateral, derived from tier counts. */
  lockedCollateral?: number;
  /** Per-country node counts, most nodes first. */
  byCountry?: CountryCount[];
  /** ISO timestamp of the bundled snapshot the counts started from. */
  snapshotAt?: string;
}

/**
 * Shape of the generated src/lib/live/snapshot.generated.ts (and of the counts
 * in public/data/network-snapshot.json). Internal to the live layer.
 */
export interface SnapshotSummary {
  schema: number;
  generatedAt: string;
  blockHeight?: number;
  totalNodes: number;
  tiers: Record<NodeTierId, number>;
  lockedCollateral: number;
  countries: number;
  continents: number;
  operators: number;
  asns: number;
  arcaneNodes: number;
  totalCores: number;
  totalRamTb: number;
  totalSsdTb: number;
  runningApps?: number;
  runningInstances?: number;
  multiInstanceApps?: number;
  registeredApps?: number;
  appMessages?: number;
  byCountry: CountryCount[];
}

/**
 * Raw concentration counts written by scripts/snapshot.mjs (research/flux.md
 * section 13). The curated, sourced versions are flux.ts `concentration` and
 * `hostingOrgs`; this is for regenerating them.
 */
export interface SnapshotConcentration {
  /** Nodes that reported an operator ID and an ASN; every count below is of these. */
  basis: number;
  operators: number;
  operatorsForHalf: number;
  operatorsForThird: number;
  largestOperator: number;
  dataCenterNodes: number;
  europeNodes: number;
  distinctIps: number;
  asns: number;
  asnsForHalf: number;
  /** [asn, registered name, nodes, data-center-flagged nodes, operator IDs], top 20. */
  topNetworks: [number, string, number, number, number][];
}

/** public/data/network-snapshot.json */
export interface SnapshotFile extends SnapshotSummary {
  /** Present in snapshots written after 2026-10-24 18:30 UTC. */
  concentration?: SnapshotConcentration;
  pointCell: number;
  /** [lat, lon, tierIndex (0 cumulus, 1 nimbus, 2 stratus), nodeCount, countryCode] */
  points: [number, number, number, number, string][];
}
