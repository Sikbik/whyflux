/**
 * Chapter 06 model: the constants, derived phrases and pure helpers the beats share. Nothing here
 * renders. Every number on the page comes from src/data or src/lib/live; the few facts that are not
 * in the data yet are named constants below, each with its source.
 */
import { concentration, ecosystem, fluxStats, hostingOrgs, milestones, nodeTiers, parallelAssets, payoutRotation } from '@/data/flux';
import type { EcosystemItem, HostingOrg, NodeTier, NodeTierId, Source, Stat } from '@/data/types';
import { formatInt } from '@/lib/format';
import { liveStatValue } from '@/lib/live';
import type { FluxLiveSnapshot, PayoutCycle } from '@/lib/live';

export const TIER_IDS: readonly NodeTierId[] = ['cumulus', 'nimbus', 'stratus'];

const ACCESSED = '2026-10-24';

/** What a browser will say about a machine (read 2026-10-24): a logical processor count, and nothing about disk or connection. */
export const BROWSER_SOURCES: Source[] = [
  {
    label: 'MDN: Navigator.hardwareConcurrency (logical processors, may be reported lower)',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency',
    accessed: ACCESSED,
  },
];

/* ---------------------------------------------------------------------------------------------
   Data lookups
   --------------------------------------------------------------------------------------------- */

export function ecosystemItem(id: string): EcosystemItem | undefined {
  return ecosystem.find((e) => e.id === id);
}

export function tierName(id: NodeTierId): string {
  return nodeTiers.find((t) => t.id === id)?.name ?? id.charAt(0).toUpperCase() + id.slice(1);
}

/** Threads when the published spec has them, else cores. */
export function threadsOf(tier: NodeTier): number {
  return tier.threads ?? tier.cores;
}

const statOf = (list: readonly Stat[], id: string): Stat | undefined => list.find((s) => s.id === id);

export const concentrationStat = (id: string) => statOf(concentration, id);
export const fluxStat = (id: string) => statOf(fluxStats, id);

/** A source list without duplicates, in first-seen order. */
export function uniqueSources(...lists: (readonly (Source | undefined)[] | undefined)[]): Source[] {
  const seen = new Map<string, Source>();
  for (const list of lists) for (const s of list ?? []) if (s && !seen.has(s.url)) seen.set(s.url, s);
  return [...seen.values()];
}

/* ---------------------------------------------------------------------------------------------
   The strengths: who runs it, where, on what (each from the live layer first, then the sourced stat)
   --------------------------------------------------------------------------------------------- */

/** The operator-identity count: live where the layer has it, else the sourced stat. */
export function operatorCount(live: FluxLiveSnapshot): number | undefined {
  return liveStatValue('operators', live) ?? live.operators ?? fluxStat('operators')?.value;
}

/** Countries with a node. The same `live.countries` the hero's strip reads, so the two never disagree. */
export function countryCount(live: FluxLiveSnapshot): number | undefined {
  return live.countries ?? fluxStat('countries')?.value;
}

/** Distinct networks (autonomous systems) that host nodes. */
export function networkCount(live: FluxLiveSnapshot): number | undefined {
  return live.asns ?? concentrationStat('distinct-asns')?.value;
}

const kindOf = (o: HostingOrg): 'datacenter' | 'isp' => (o.kind === 'isp' ? 'isp' : 'datacenter');

/** The share of nodes on home and business internet (`isp`) or in data centers, 0..1, normalized. */
export function kindShare(kind: 'datacenter' | 'isp', orgs: readonly HostingOrg[] = hostingOrgs): number | undefined {
  const total = orgs.reduce((s, o) => s + o.sharePct, 0);
  if (total <= 0) return undefined;
  return orgs.filter((o) => kindOf(o) === kind).reduce((s, o) => s + o.sharePct, 0) / total;
}

/** 0.485 -> "About half"; otherwise the percent. A share that is close to a half reads as one. */
export function roughShare(fraction: number): string {
  if (Math.abs(fraction - 0.5) <= 0.06) return 'About half';
  return `${Math.round(fraction * 100)}%`;
}

/* ---------------------------------------------------------------------------------------------
   Links
   --------------------------------------------------------------------------------------------- */

/** The docs link inside a tier's sources (the "Read the node docs" button). */
export function docsSource(): Source | undefined {
  return nodeTiers.flatMap((t) => t.sources).find((s) => s.url.includes('docs.runonflux.com/fluxnodes/what-are-fluxnodes'));
}

/** The Titan staking docs, from the FluxNodes ecosystem entry's sources. */
export function titanSource(sources: readonly Source[] | undefined): Source | undefined {
  return sources?.find((s) => /titan/i.test(s.url) || /titan/i.test(s.label));
}

/* ---------------------------------------------------------------------------------------------
   The device check: threads, because that is the one number a browser will share
   --------------------------------------------------------------------------------------------- */

/** Logical processors, as `navigator.hardwareConcurrency` reports them. Nothing leaves the page. */
export function readThreads(): number | undefined {
  const n = navigator.hardwareConcurrency;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
}

const list = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

/**
 * The one line a check ends in. It speaks only of threads (all a browser can see) and never says a
 * device qualifies: the disk, the connection and the uptime are for the network's benchmark to read.
 */
export function deviceCaption(threads: number | undefined, tiers: readonly NodeTier[]): string {
  if (threads == null) return 'This browser keeps its thread count to itself';
  const have = `${formatInt(threads)} ${threads === 1 ? 'thread' : 'threads'}`;
  const fits = tiers.filter((t) => threads >= threadsOf(t));
  if (fits.length === 0) return `${have}, a step short of ${tiers[0]?.name ?? 'the smallest tier'}`;
  if (fits.length === tiers.length) return `${have}, enough for every tier`;
  return `${have}, enough for ${list.format(fits.map((t) => t.name))}`;
}

/* ---------------------------------------------------------------------------------------------
   How a node gets paid (the live numbers come from `payoutCycle` in src/lib/live)
   --------------------------------------------------------------------------------------------- */

/** The decimals an amount of FLUX needs, at most four (the precision the payout cycle rounds to). */
export function amountDecimals(n: number): number {
  for (let d = 0; d < 4; d++) if (Math.abs(n - Number(n.toFixed(d))) < 1e-9) return d;
  return 4;
}

/** An amount of FLUX without trailing zeros: 3.5 -> "3.5", 9 -> "9". */
export const amountText = (n: number): string => n.toFixed(amountDecimals(n));

/** The Proof of Node milestone: its sources back the chain facts. */
export const proofOfNode = () => milestones.find((m) => m.title.toLowerCase().startsWith('proof of node replaces mining'));

/** 100500 s -> { value: 28, decimals: 0, unit: "hours" }: the wait, in the unit a person would say it in. */
export function turnParts(seconds: number): { value: number; decimals: number; unit: string } {
  const hours = seconds / 3600;
  if (hours < 1.5) {
    const value = Math.max(1, Math.round(seconds / 60));
    return { value, decimals: 0, unit: value === 1 ? 'minute' : 'minutes' };
  }
  if (hours < 48) {
    const whole = hours >= 10;
    const value = whole ? Math.round(hours) : Math.round(hours * 10) / 10;
    return { value, decimals: whole ? 0 : 1, unit: value === 1 ? 'hour' : 'hours' };
  }
  return { value: Math.round((hours / 24) * 10) / 10, decimals: 1, unit: 'days' };
}

/** A FLUX amount to two figures: 0.86 -> "0.86", 6.08 -> "6.1", 14.09 -> "14", 214 -> "214". */
export function approxFlux(n: number): string {
  if (n >= 10) return String(Math.round(n));
  if (n >= 1) return String(Math.round(n * 10) / 10);
  return n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

/** The rotation items this beat rests on: one payout per tier in every block, paid in turn, and how long a rotation lasts. */
const ROTATION_IDS: readonly string[] = ['one-per-tier', 'paid-in-turn', 'rotation-length'];

export function payoutRotationSources(): Source[] {
  return uniqueSources(payoutRotation.filter((f) => ROTATION_IDS.includes(f.id)).flatMap((f) => f.sources));
}

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

/** 10 -> "ten parallel chains": a count of chains, the way a sentence would say it. */
export function parallelChains(count: number): string {
  return `${NUMBER_WORDS[count] ?? String(count)} parallel ${count === 1 ? 'chain' : 'chains'}`;
}

/**
 * What one turn pays a node, parallel assets counted in. While they run, a payout also earns on the other
 * chains, so the figure to lead with is the whole of it; once they stop (`parallel` is null) it is the
 * block reward alone, with nothing to break down. Every number comes from `payoutCycle`.
 */
export interface TurnPay {
  /** FLUX for one turn: the block reward and what it earns across the parallel chains. */
  total: number;
  /** FLUX a day, counted the same way. */
  perDay: number;
  /** While parallel assets run, the two parts of `total`. */
  split: { base: number; parallel: number; chains: string } | undefined;
}

export function turnPay({ perPayout, perDay, parallel }: PayoutCycle): TurnPay {
  return {
    total: perPayout + (parallel?.perPayout ?? 0),
    perDay: perDay + (parallel?.perDay ?? 0),
    split: parallel ? { base: perPayout, parallel: parallel.perPayout, chains: parallelChains(parallel.chains) } : undefined,
  };
}

/** Where the claim lines are backed: what parallel assets are, the share on each chain and how they are claimed. */
const PARALLEL_LINE_SOURCES: readonly string[] = ['/claim-parallel-assets', '/what-are-fluxnodes', '/openapi/openapi.yaml', '/swap/activechains', '/coinbase/summary', '#L176'];

/** The one thing this beat says about parallel assets, in parts so the words that carry it can be set in weight. */
export interface ParallelLine {
  /** "ten parallel chains" */
  chains: string;
  /** Percent of a payout the chains earn between them (10% on each of ten chains is 100). */
  totalShare: number;
  /** True when that is the whole payout again, which is the only case "matched in full" is true. */
  matched: boolean;
  /** Where it is claimed, when the data says so. */
  claimedIn: string | undefined;
  sources: Source[];
}

/**
 * Parallel assets, worked out from `parallelAssets`: the chain count, what they earn together and where it
 * is claimed all come from the data. Nothing at all unless the program is active, so the page never states
 * more than the data confirms.
 */
export function parallelAssetsLine(): ParallelLine | undefined {
  const { status, activeChains, sharePerChainPct, claim } = parallelAssets;
  if (status !== 'active' || activeChains < 1 || sharePerChainPct <= 0) return undefined;
  const totalShare = activeChains * sharePerChainPct;
  return {
    chains: parallelChains(activeChains),
    totalShare,
    matched: totalShare === 100,
    claimedIn: claim.wallets?.length
      ? claim.wallets.length === 1
        ? claim.wallets[0]
        : `${claim.wallets.slice(0, -1).join(', ')} or ${claim.wallets.at(-1)}`
      : /zelcore/i.test(claim.where)
        ? 'Zelcore'
        : undefined,
    sources: parallelAssets.sources.filter((s) => PARALLEL_LINE_SOURCES.some((part) => s.url.includes(part))),
  };
}

/* ---------------------------------------------------------------------------------------------
   The tier filter (URL param `tier`)
   --------------------------------------------------------------------------------------------- */

export type TierFilter = NodeTierId | 'all';

export function parseTier(value: string | null): TierFilter {
  return value === 'cumulus' || value === 'nimbus' || value === 'stratus' ? value : 'all';
}
