/**
 * Small, pure helpers for showing live network data. No React, no fetching.
 * Chain constants are from fluxd (RunOnFlux/fluxd @ 8a60ee6, src/chainparams.cpp
 * and src/fluxnode/fluxnode.h); see research/flux.md.
 */
import type { NodeTierId } from '@/data/types.ts';
import { continentShares } from '@/lib/geo.ts';
import type { CountryCount, FluxLiveSnapshot } from './types.ts';

export const TIER_IDS: readonly NodeTierId[] = ['cumulus', 'nimbus', 'stratus'];

/** FLUX collateral per tier (fluxd V2_FLUXNODE_COLLAT_*). */
export const TIER_COLLATERAL: Readonly<Record<NodeTierId, number>> = { cumulus: 1000, nimbus: 12500, stratus: 40000 };

/** Proof of Node consensus constants (fluxd chainparams.cpp, mainnet). */
export const CHAIN = {
  ponActivationHeight: 2_020_000,
  blockSeconds: 30,
  initialSubsidy: 14,
  reductionInterval: 1_051_200,
  maxReductions: 20,
  /** Share of each block's subsidy: one node per tier paid every block, plus the dev fund. */
  split: { cumulus: 1 / 14, nimbus: 3.5 / 14, stratus: 9 / 14, foundation: 0.5 / 14 },
} as const;

/** Placeholder for a missing value. The house style bans em dashes. */
const MISSING = 'n/a';
const intFmt = new Intl.NumberFormat('en-US');
const compactFmt = new Map<number, Intl.NumberFormat>();

const ok = (n: number | undefined | null): n is number => typeof n === 'number' && Number.isFinite(n);

/** 6854 -> "6,854". Missing -> "n/a". */
export function formatInt(n: number | undefined | null): string {
  return ok(n) ? intFmt.format(Math.round(n)) : MISSING;
}

/** 56902 -> "56.9K", 97871500 -> "97.9M". Missing -> "n/a". */
export function formatCompact(n: number | undefined | null, maxFractionDigits = 1): string {
  if (!ok(n)) return MISSING;
  let fmt = compactFmt.get(maxFractionDigits);
  if (!fmt) {
    fmt = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: maxFractionDigits });
    compactFmt.set(maxFractionDigits, fmt);
  }
  return fmt.format(n);
}

/** Decimal TB to the friendliest unit: 192.3 -> {192, "TB"}, 3372.1 -> {3.37, "PB"}. */
export function formatStorageTb(tb: number | undefined | null): { value: number; unit: 'TB' | 'PB'; text: string } {
  if (!ok(tb)) return { value: 0, unit: 'TB', text: MISSING };
  if (tb >= 1000) {
    const value = Math.round(tb / 10) / 100;
    return { value, unit: 'PB', text: `${value} PB` };
  }
  const value = tb >= 100 ? Math.round(tb) : Math.round(tb * 10) / 10;
  return { value, unit: 'TB', text: `${value} TB` };
}

/** Ready-to-print capacity strings, e.g. { cores: "56.9K", ram: "192 TB", storage: "3.37 PB" }. */
export function capacityTotals(s: FluxLiveSnapshot): { cores: string; ram: string; storage: string } {
  return {
    cores: formatCompact(s.totalCores),
    ram: formatStorageTb(s.totalRamTb).text,
    storage: formatStorageTb(s.totalSsdTb).text,
  };
}

/** Share of nodes per tier, 0..1. All zeros while loading. */
export function tierShares(s: FluxLiveSnapshot): Record<NodeTierId, number> {
  const total = s.tiers.cumulus + s.tiers.nimbus + s.tiers.stratus;
  if (total <= 0) return { cumulus: 0, nimbus: 0, stratus: 0 };
  return { cumulus: s.tiers.cumulus / total, nimbus: s.tiers.nimbus / total, stratus: s.tiers.stratus / total };
}

/** FLUX locked as collateral for a set of tier counts. */
export function lockedCollateral(tiers: Record<NodeTierId, number>): number {
  return TIER_IDS.reduce((sum, id) => sum + tiers[id] * TIER_COLLATERAL[id], 0);
}

/**
 * Per-country node counts, most first. Uses byCountry when present, else sums
 * point weights (points carry each cell's majority country, so this is approximate).
 */
export function countryCounts(s: FluxLiveSnapshot, limit?: number): CountryCount[] {
  let list = s.byCountry;
  if (!list || list.length === 0) {
    const map = new Map<string, CountryCount>();
    for (const p of s.points) {
      if (!p.country) continue;
      const e = map.get(p.country) ?? { code: p.country, nodes: 0, tiers: { cumulus: 0, nimbus: 0, stratus: 0 } };
      const w = p.weight ?? 1;
      e.nodes += w;
      e.tiers[p.tier] += w;
      map.set(p.country, e);
    }
    list = [...map.values()].sort((a, b) => b.nodes - a.nodes);
  }
  return limit ? list.slice(0, limit) : list;
}

const regionNames = new Map<string, Intl.DisplayNames | null>();

/** "DE" -> "Germany". Falls back to the code. */
export function countryName(code: string, locale = 'en'): string {
  let names = regionNames.get(locale);
  if (names === undefined) {
    try {
      names = new Intl.DisplayNames([locale], { type: 'region' });
    } catch {
      names = null;
    }
    regionNames.set(locale, names);
  }
  try {
    return names?.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** Flag emoji for an ISO alpha-2 code ("DE" -> 🇩🇪). */
export function countryFlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return '';
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** Number of 10% subsidy reductions applied at a height (0 before 3,071,200). */
function reductionsAt(height: number): number {
  if (height < CHAIN.ponActivationHeight) return 0;
  return Math.min(CHAIN.maxReductions, Math.floor((height - CHAIN.ponActivationHeight) / CHAIN.reductionInterval));
}

/**
 * FLUX paid by the block at `height` (Proof of Node era): 14 at launch, -10% every
 * 1,051,200 blocks (~1 year). fluxd truncates to satoshis per step; this rounds to 4 dp.
 */
export function blockReward(height: number): { total: number; cumulus: number; nimbus: number; stratus: number; foundation: number } {
  const total = CHAIN.initialSubsidy * 0.9 ** reductionsAt(height);
  const r = (x: number) => Math.round(x * 10_000) / 10_000;
  return {
    total: r(total),
    cumulus: r(total * CHAIN.split.cumulus),
    nimbus: r(total * CHAIN.split.nimbus),
    stratus: r(total * CHAIN.split.stratus),
    foundation: r(total * CHAIN.split.foundation),
  };
}

/** The next 10% subsidy reduction after `height`, with a rough ETA at 30 s blocks. */
export function nextRewardReduction(height: number): { height: number; blocksLeft: number; etaSeconds: number } | null {
  const done = reductionsAt(height);
  if (done >= CHAIN.maxReductions) return null;
  const next = CHAIN.ponActivationHeight + (done + 1) * CHAIN.reductionInterval;
  const blocksLeft = Math.max(0, next - height);
  return { height: next, blocksLeft, etaSeconds: blocksLeft * CHAIN.blockSeconds };
}

/** Chain height extrapolated to `now` from the last known height (one block per ~30 s). */
export function estimateHeight(s: FluxLiveSnapshot, now = Date.now()): number | undefined {
  if (!ok(s.blockHeight)) return undefined;
  const at = Date.parse(s.fetchedAt);
  if (!Number.isFinite(at)) return s.blockHeight;
  return s.blockHeight + Math.max(0, Math.floor((now - at) / 1000 / CHAIN.blockSeconds));
}

/**
 * The live value for a Stat in src/data/flux.ts (fluxStats, concentration), in that stat's own
 * units, or undefined when the live layer has nothing for it. Lets the UI do:
 *   const v = liveStatValue(stat.id, live) ?? stat.value
 */
export function liveStatValue(statId: string, s: FluxLiveSnapshot): number | undefined {
  if (s.status === 'loading') return undefined;
  switch (statId) {
    case 'nodes':
      return s.totalNodes || undefined;
    case 'countries':
      return s.countries;
    case 'apps':
      return s.runningApps;
    case 'redundancy':
      return ok(s.multiInstanceApps) && ok(s.runningApps) && s.runningApps > 0
        ? Math.round((s.multiInstanceApps / s.runningApps) * 100)
        : undefined;
    case 'cores':
      return s.totalCores;
    case 'ram':
      return ok(s.totalRamTb) ? Math.round(s.totalRamTb) : undefined;
    case 'storage':
      return ok(s.totalSsdTb) ? Math.round(s.totalSsdTb / 10) / 100 : undefined;
    case 'collateral':
      return ok(s.lockedCollateral) ? Math.round(s.lockedCollateral / 100_000) / 10 : undefined;
    case 'operators':
      return s.operators;
    case 'europe-share': {
      const eu = continentShares(s.byCountry).find((c) => c.code === 'EU');
      return eu ? Math.round(eu.share * 1000) / 10 : undefined;
    }
    default:
      return undefined;
  }
}

/* ---------------------------------------------------------------- payouts */

/**
 * Parallel mining (research/flux.md §14): on top of each node payout, the payout address accrues
 * 10% of the amount on every active parallel chain (FLUX tokens on other chains), claimed through
 * Zelcore's Fusion app. Computed off-chain by Fusion from main-chain payouts; not a fluxd rule.
 * `endHeight` is the announced cut-over (per-chain pools exhausted, Progressive Node Rewards starts),
 * planned, not coded in consensus. Keep `activeChains` in step with flux.ts `parallelAssets`.
 */
export const PARALLEL_MINING = {
  sharePerChain: 0.1,
  /** Ten earning chains: nine active plus Ergo (deprecating, still earns; honoured on the main chain). */
  activeChains: 10,
  startHeight: 825_001,
  endHeight: 3_787_502,
} as const;

/** Blocks per day and per average month at the 30 s target (fluxd's year is 1,051,200 blocks = 365 days). */
const BLOCKS_PER_DAY = 86_400 / CHAIN.blockSeconds;
const BLOCKS_PER_MONTH = CHAIN.reductionInterval / 12;

/** Block 2,020,000 (Proof of Node activation) timestamp, and the mean spacing measured since then (2026-10-24). */
const PON_ACTIVATION_UNIX = 1_761_415_235;
const OBSERVED_BLOCK_SECONDS = 30.076;

/** FLUX for one node: one payout, and the long-run average per day and per month. */
export interface PayoutAmounts {
  perPayout: number;
  perDay: number;
  perMonth: number;
}

/** Parallel-asset accrual on top of a node's payouts: FLUX tokens on other chains, before claim fees. */
export interface ParallelAccrual extends PayoutAmounts {
  chains: number;
  sharePerChain: number;
}

export interface PayoutCycle extends PayoutAmounts {
  tier: NodeTierId;
  /** Confirmed nodes in the tier, i.e. the length of its payment queue. */
  nodes: number;
  /** Chain height the amounts were taken at (estimated to `now`). */
  height: number;
  /** Expected seconds between two payouts to one node: nodes x block time. */
  secondsBetween: number;
  hoursBetween: number;
  /** Long-run average payouts per node per day (below 1 when the queue is longer than a day of blocks). */
  payoutsPerDay: number;
  /** Parallel assets accrued per node, or null once the program's planned end height is reached. */
  parallel: ParallelAccrual | null;
  /** The same node after the next 10% reduction, with today's tier counts; null after the last one. */
  afterReduction: (PayoutAmounts & { height: number; etaSeconds: number; parallel: ParallelAccrual | null }) | null;
}

const r4 = (x: number) => Math.round(x * 10_000) / 10_000;

function amounts(perPayout: number, nodes: number): PayoutAmounts {
  return {
    perPayout: r4(perPayout),
    perDay: r4((BLOCKS_PER_DAY / nodes) * perPayout),
    perMonth: r4((BLOCKS_PER_MONTH / nodes) * perPayout),
  };
}

function parallelAccrual(perPayout: number, nodes: number, height: number): ParallelAccrual | null {
  if (height < PARALLEL_MINING.startHeight || height >= PARALLEL_MINING.endHeight) return null;
  const share = PARALLEL_MINING.sharePerChain * PARALLEL_MINING.activeChains;
  return { ...amounts(perPayout * share, nodes), chains: PARALLEL_MINING.activeChains, sharePerChain: PARALLEL_MINING.sharePerChain };
}

/**
 * The payout rotation for one node in `tier`, from live tier counts and chain height.
 *
 * Mechanism (fluxd @ 8a60ee6, research/flux.md §14): each tier is a strict round-robin queue
 * ordered by last-paid height. Every block pays the node at the front of each tier and moves it
 * to the back; new or restarted nodes join at the back. So one node is paid once per rotation of
 * its tier, and a rotation lasts as many blocks as the tier has confirmed nodes.
 *
 * Assumptions:
 * - Interval = confirmed nodes in the tier x 30 s (the Proof of Node target; 30.08 s observed since
 *   activation). Churn moves it a few percent: nodes leaving ahead of you shorten your wait, nodes
 *   joining queue behind you and only lengthen the next one. On 2026-10-24 the front Cumulus node
 *   had waited 3,254 blocks with 3,350 nodes in the tier.
 * - Every confirmed node in getfluxnodecount is in its tier's payment queue.
 * - FLUX per payout is blockReward() at the current height (estimated from the last known height
 *   and the time since). `afterReduction` applies the next 10% step to today's counts.
 * - Per day and per month are long-run averages (2,880 blocks a day; a month is 1/12 of fluxd's
 *   1,051,200-block year). Payouts themselves arrive whole, once per rotation.
 * - Native FLUX only. `parallel` is the parallel-asset accrual on top (10% per active chain, before
 *   Fusion claim fees), null from PARALLEL_MINING.endHeight. No prices: never convert to fiat.
 *
 * Returns undefined while tier counts are unknown (status 'loading').
 */
export function payoutCycle(tier: NodeTierId, s: FluxLiveSnapshot, now = Date.now()): PayoutCycle | undefined {
  const nodes = s.tiers[tier];
  if (!ok(nodes) || nodes <= 0) return undefined;
  const height =
    estimateHeight(s, now) ??
    CHAIN.ponActivationHeight + Math.max(0, Math.floor((now / 1000 - PON_ACTIVATION_UNIX) / OBSERVED_BLOCK_SECONDS));

  const perPayout = blockReward(height)[tier];
  const secondsBetween = nodes * CHAIN.blockSeconds;
  const next = nextRewardReduction(height);
  const nextPerPayout = next ? blockReward(next.height)[tier] : 0;

  return {
    tier,
    nodes,
    height,
    secondsBetween,
    hoursBetween: Math.round((secondsBetween / 3600) * 100) / 100,
    payoutsPerDay: r4(BLOCKS_PER_DAY / nodes),
    ...amounts(perPayout, nodes),
    parallel: parallelAccrual(perPayout, nodes, height),
    afterReduction: next
      ? {
          height: next.height,
          etaSeconds: next.etaSeconds,
          ...amounts(nextPerPayout, nodes),
          parallel: parallelAccrual(nextPerPayout, nodes, next.height),
        }
      : null,
  };
}

/** payoutCycle() for every tier, or undefined while tier counts are unknown. */
export function payoutCycles(s: FluxLiveSnapshot, now = Date.now()): Record<NodeTierId, PayoutCycle> | undefined {
  const c = payoutCycle('cumulus', s, now);
  const n = payoutCycle('nimbus', s, now);
  const st = payoutCycle('stratus', s, now);
  return c && n && st ? { cumulus: c, nimbus: n, stratus: st } : undefined;
}
