/**
 * The data contract between research (src/data/*, src/lib/live/*) and the UI.
 *
 * Research fills these shapes with sourced facts; the UI renders them.
 * Rules for every value in src/data:
 * - Every number and every factual claim carries at least one Source with an
 *   access date. No source, no claim.
 * - "asOf" is the date the value was true (YYYY-MM-DD), not when it was typed.
 * - Persuasive framing lives in copy (headline, pitch); the facts underneath
 *   stay accurate, including where a competitor is genuinely strong.
 *
 * Changes to this file are additive only: add optional fields, never rename
 * or remove, so the UI never breaks under a parallel edit.
 */

export interface Source {
  label: string;
  url: string;
  /** YYYY-MM-DD the source was read. */
  accessed: string;
}

/** A single headline number, e.g. "Nodes online". */
export interface Stat {
  id: string;
  label: string;
  value: number;
  /** Shown after the number, e.g. "+", "%", " TB". */
  suffix?: string;
  /** Shown before the number, e.g. "$". */
  prefix?: string;
  /** Decimal places when rendered. Defaults to 0. */
  decimals?: number;
  asOf: string;
  source: Source;
  note?: string;
  /** True when src/lib/live can refresh this value at runtime. */
  live?: boolean;
}

/* --------------------------------------------------------------------------
   Flux itself
   -------------------------------------------------------------------------- */

export type NodeTierId = 'cumulus' | 'nimbus' | 'stratus';

export interface NodeTier {
  id: NodeTierId;
  name: string;
  /** FLUX locked as collateral. */
  collateral: number;
  cores: number;
  /** Threads, when the published spec distinguishes them from cores. */
  threads?: number;
  ramGb: number;
  ssdGb: number;
  /** Minimum disk write speed (MB/s) or EPS benchmark, as published. */
  benchmark?: string;
  /** Live count of nodes in this tier, if known. */
  count?: number;
  pitch: string;
  sources: Source[];
}

export interface Feature {
  id: string;
  /** Short name, e.g. "Self-healing deployments". */
  title: string;
  /** One punchy line for a card. */
  headline: string;
  /** 2-4 sentences, accurate, explains how it actually works. */
  body: string;
  /** The Kubernetes (or web2) concept this maps to, e.g. "ReplicaSet". */
  analogy?: string;
  /** lucide-react icon name suggestion, e.g. "HeartPulse". */
  icon?: string;
  sources: Source[];
}

/** One step of the deploy lifecycle, in order. */
export interface LifecycleStep {
  id: string;
  title: string;
  body: string;
  /** What the network does at this step, for diagram labels. */
  actor: 'developer' | 'blockchain' | 'fluxos' | 'node' | 'network' | 'user';
  sources: Source[];
}

/** A product or component in the Flux ecosystem (FluxEdge, ArcaneOS, ...). */
export interface EcosystemItem {
  id: string;
  name: string;
  headline: string;
  body: string;
  url?: string;
  status: 'live' | 'beta' | 'announced' | 'deprecated';
  sources: Source[];
}

/** A dated milestone for a timeline. */
export interface Milestone {
  date: string;
  title: string;
  body: string;
  sources: Source[];
}

/**
 * One network that hosts FluxNodes, by autonomous system (ASN), biggest first
 * (flux.ts `hostingOrgs`). The list ends with "other" buckets (asn 0) that
 * group the long tail, so all entries add up to 100%.
 */
export interface HostingOrg {
  /** Human name, e.g. "Hetzner", "OVHcloud". */
  name: string;
  /** The network's ASN; 0 for an "other" bucket that groups many networks. */
  asn: number;
  nodes: number;
  /** Percent (0..100) of nodes with a known network. */
  sharePct: number;
  sources: Source[];
  /** 'datacenter' = a hosting or cloud company; 'isp' = home and business internet. */
  kind?: 'datacenter' | 'isp';
  /** Every ASN counted, when the company uses more than one. */
  asns?: number[];
  /** Registered ASN holder, when it differs from the name. */
  holder?: string;
  /** ISO alpha-2 countries of this network's nodes, most nodes first. */
  countries?: string[];
  /** Distinct operator IDs (Flux IDs) with nodes on this network. */
  operators?: number;
  /** For an "other" bucket: how many networks it groups. */
  networks?: number;
  note?: string;
}

/* --------------------------------------------------------------------------
   Comparison: Flux vs other DePIN vs web2 clouds
   -------------------------------------------------------------------------- */

export type PlatformKind = 'flux' | 'depin' | 'web2';

export interface Platform {
  id: string;
  name: string;
  kind: PlatformKind;
  /** What it is in five words, e.g. "GPU rendering marketplace". */
  category: string;
  /** Neutral one-liner. */
  summary: string;
  /** Where Flux wins against this platform, 1-3 sentences, persuasive but true. */
  fluxEdge: string;
  /** Where this platform is genuinely strong. Keeps the page credible. */
  theirStrength: string;
  website: string;
  /** Accent for charts. Distinct per platform, readable on near-black. */
  color: string;
  /** Simple-icons slug or a path under /art, if a logo is wanted. */
  logo?: string;
  launched?: string;
  sources: Source[];
}

export interface Dimension {
  id: string;
  /** Short column label, e.g. "Permissionless operators". */
  label: string;
  /** The question a visitor asks, e.g. "Can anyone run the hardware?" */
  question: string;
  /** Why this matters, 1-2 sentences. */
  why: string;
  /** Grouping for filters. */
  group: 'decentralization' | 'resilience' | 'developer' | 'economics' | 'scale';
}

export type Verdict = 'yes' | 'partial' | 'no' | 'na';

export interface Cell {
  platformId: string;
  dimensionId: string;
  verdict: Verdict;
  /** 0..5 for radar / bar views. */
  score: number;
  /** One line shown in the matrix cell. */
  short: string;
  /** Longer explanation for a tooltip or drawer. */
  detail: string;
  sources: Source[];
}

/** A real outage or deplatforming event that argues for decentralization. */
export interface Incident {
  id: string;
  date: string;
  provider: string;
  title: string;
  /** What broke and for how long. */
  impact: string;
  durationHours?: number;
  /** Well-known services that went down. */
  affected?: string[];
  /**
   * What kind of failure it was: 'outage' = a software, config or network
   * fault; 'physical' = fire, power, weather or attack on a facility;
   * 'deplatforming' = the provider suspended or banned the customer.
   */
  kind?: 'outage' | 'physical' | 'deplatforming';
  sources: Source[];
}

/** One workload priced across platforms, for a cost comparison. */
export interface PricePoint {
  platformId: string;
  /** e.g. "2 vCPU / 4 GB RAM / 50 GB SSD, 1 month". */
  workload: string;
  /** USD per month for that workload. */
  usdPerMonth: number;
  /** What is and is not included (egress, redundancy, ...). */
  note: string;
  asOf: string;
  sources: Source[];
}

/** Market concentration, e.g. cloud market share by provider. */
export interface MarketShare {
  provider: string;
  sharePct: number;
  asOf: string;
  source: Source;
}

/** "Flux is a decentralized Kubernetes": one row of the concept map. */
export interface ConceptMapping {
  /** The Kubernetes (or classic cloud) concept, e.g. "Scheduler". */
  k8s: string;
  /** What plays that role in Flux, e.g. "FluxOS app spawner". */
  flux: string;
  /** How Flux does it differently, 1-2 sentences. */
  note: string;
  sources: Source[];
}

/* --------------------------------------------------------------------------
   Privacy: what a node operator can and cannot reach
   -------------------------------------------------------------------------- */

/**
 * One row of the "Can a node operator...?" matrix (flux.ts `operatorAccess`).
 * `legacy` and `arcane` answer the capability question for that kind of node:
 * 'yes' = the operator CAN do it (your app is exposed), 'no' = they cannot,
 * 'partial' = only under the conditions in the notes, 'na' = does not apply.
 * So for privacy, 'no' is the good answer.
 */
export interface OperatorAccessRow {
  /** Stable key, e.g. "root-shell". */
  id?: string;
  /** The attempt, phrased to follow "Can a node operator...", e.g. "Open a shell inside your container". */
  capability: string;
  legacy: Verdict;
  arcane: Verdict;
  /** One or two sentences: the honest bottom line across both node types. */
  note: string;
  /** Why the answer is what it is on a legacy (self-installed) node. */
  legacyNote?: string;
  /** What stops it (or doesn't) on an ArcaneOS node. */
  arcaneNote?: string;
  /** Short name of the ArcaneOS layer that decides it, e.g. "No root account", "No TEE". */
  layer?: string;
  sources: Source[];
}

/* --------------------------------------------------------------------------
   Node rewards: payout rotation and parallel assets
   -------------------------------------------------------------------------- */

/** One chain where FLUX exists as a token (a "parallel asset"), for flux.ts `parallelAssets`. */
export interface ParallelChain {
  /** Fusion's chain key, e.g. "eth", "bsc", "kda". */
  id: string;
  /** e.g. "Ethereum". */
  name: string;
  /** Token standard, e.g. "ERC-20", "BEP-20". */
  standard?: string;
  /** Contract address, asset id or module name, as published in the Flux docs. */
  contract?: string;
  /**
   * 'active' = node rewards accrue on it today; 'deprecating' = being retired, but node payouts
   * still earn its share (honoured on the main chain); 'shut-down' = no longer earning.
   */
  status: 'active' | 'deprecating' | 'shut-down';
  /** True for the chains FLUX stays on after the 2027 consolidation (Ethereum, BNB Chain). */
  survives: boolean;
  note?: string;
}

/** One dated step of the parallel-asset program (launch, retirements, planned cut-over). */
export interface ParallelAssetEvent {
  /** YYYY-MM-DD, or YYYY-MM when only the month is published. */
  date: string;
  /** Main-chain block height, when one is set. */
  height?: number;
  title: string;
  body: string;
  /** True when the step is announced but has not happened yet. */
  planned?: boolean;
  sources: Source[];
}

/** Parallel assets as part of node rewards (flux.ts `parallelAssets`). */
export interface ParallelAssetProgram {
  /** One punchy line. */
  headline: string;
  /** 2-4 sentences: what they are and how they relate to the block reward. */
  body: string;
  /** Share of each node payout that accrues on every active chain, in percent (10). */
  sharePerChainPct: number;
  /** Chains on which node rewards accrue today. */
  activeChains: number;
  /** Total extra, in percent of each payout, across all active chains (activeChains x sharePerChainPct). */
  totalSharePct: number;
  chains: ParallelChain[];
  /** How operators collect it. */
  claim: {
    /** e.g. "Fusion app in Zelcore". */
    where: string;
    /** Wallets that can make the claim, as they should read in copy, e.g. ["Zelcore", "SSP Wallet"]. */
    wallets?: string[];
    /** False: nothing is sent automatically; the operator claims. */
    automatic: boolean;
    /** 1-2 sentences on the steps and fees. */
    how: string;
    sources: Source[];
  };
  /** 'active' today; the planned end is in `timeline`. */
  status: 'active' | 'winding-down' | 'ended';
  /** One or two precise sentences on the current status and what is planned. */
  statusNote: string;
  /** Main-chain height at which the per-chain reward pools run out and accrual stops (planned, not a consensus rule). */
  plannedEndHeight?: number;
  timeline: ParallelAssetEvent[];
  asOf: string;
  sources: Source[];
}
