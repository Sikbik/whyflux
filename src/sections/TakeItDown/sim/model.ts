/**
 * Chapter 05, the constants of the take-it-down simulation, in one place. Every value says where it
 * comes from (docs/DESIGN.md section 9 "The model", research/flux.md section 5, the FluxOS and
 * flux-domain-manager source pinned in src/data/flux.ts). None of it is a measurement of a real
 * deployment: it is a diagram that moves. Numbers that reach the page are formatted from these
 * constants, never retyped.
 *
 * This file imports nothing, so the model can run headless (a node script, a test).
 */

/* ---- the two clocks --------------------------------------------------------------------------- */

/** Logic runs at a fixed 20 Hz; rendering runs per frame (DESIGN.md: "Fixed time step 20 Hz"). */
export const STEP_S = 1 / 20;

/** The longest frame the loop catches up on. A slower frame (a hidden tab, a breakpoint) drops the rest. */
export const MAX_FRAME_S = 0.25;

/**
 * Two clocks, one sim. Things that take seconds (health checks, retries, the failover) run in real
 * time. Things that take minutes (a lost copy's record expiring, a node installing a replacement)
 * are compressed: 1 s of sim time stands for 5 minutes of real time (DESIGN.md model table). The
 * lane says so wherever it shows a rebuild.
 */
export const COMPRESSION = 300;

/** Minutes of real time one sim second stands for while a rebuild is compressed. */
export const MINUTES_PER_SIM_S = COMPRESSION / 60;

/* ---- Flux: traffic failover (real time) ------------------------------------------------------ */

/**
 * The Flux Domain Manager (HAProxy) health-checks every copy every 3 s, takes a copy out after 2
 * failed checks, brings it back after 2 good ones, and retries a failed request on another copy
 * ("retries 3", "option redispatch"). flux-domain-manager haproxyTemplate.js L220-L290,
 * https://github.com/RunOnFlux/flux-domain-manager/blob/a30f379b0724bfa633698104962e8abf6292506b/src/services/haproxyTemplate.js#L220-L290
 * (features['load-balancing'], research/flux.md 5.3).
 */
export const CHECK_EVERY_S = 3;
export const CHECKS_TO_FALL = 2;
export const CHECKS_TO_RISE = 2;
/** One attempt plus 3 retries. */
export const REQUEST_TRIES = 4;

/**
 * The gap between a copy dying and the balancer marking it down. The first failed check lands
 * somewhere within one interval after the failure, the second one interval later: so the gap is
 * between 3 and 6 s (derived, DESIGN.md "Detection gap").
 */
export const DETECT_MIN_S = CHECK_EVERY_S * (CHECKS_TO_FALL - 1);
export const DETECT_SPAN_S = CHECK_EVERY_S;

/** After it is installed, a copy takes traffic after 2 good checks: 3 to 6 s, the same arithmetic. */
export const WARM_MIN_S = CHECK_EVERY_S * (CHECKS_TO_RISE - 1);
export const WARM_SPAN_S = CHECK_EVERY_S;

/** Requests per second per lane. Visual only: it makes the counters and the dots move (model). */
export const REQUESTS_PER_S = 8;

/* ---- Flux: rebuilding a lost copy (compressed) ----------------------------------------------- */

/**
 * A running copy re-announces itself and its location record lives 125 minutes (locationTtlS 7500).
 * When a node dies suddenly its record simply ages out, so another node can claim the missing copy
 * up to 125 minutes later. A node that shuts down cleanly has its records dropped after 7 minutes
 * (sigtermExpiryS 420). FluxOS config default.js L565-L595,
 * https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/config/default.js#L565-L595
 * (features['self-healing'], research/flux.md 5.3).
 */
export const LOCATION_TTL_MIN = 125;
export const CLEAN_EXPIRY_MIN = 7;

/**
 * Model assumption: the record's remaining life at the moment of a sudden loss is anywhere between
 * the clean-shutdown figure and the whole 125 minutes, evenly. Every weapon here is a sudden loss.
 */
export const WAIT_MIN_MIN = CLEAN_EXPIRY_MIN;
export const WAIT_MAX_MIN = LOCATION_TTL_MIN;

/** "Install and sync: minutes (shown as 3 s)" (DESIGN.md; lifecycle['install']). */
export const INSTALL_SIM_S = 3;

/**
 * Reduced motion has no loop, so time moves when the visitor says: a strike settles the failover
 * (the seconds-long part, at most 6 s and a little more), and "Skip ahead" lets a whole rebuild finish.
 */
export const SETTLE_S = DETECT_MIN_S + DETECT_SPAN_S + 0.6;

/** A reduced-motion scenario starts with a few seconds of healthy traffic, so the first reading is not 0 of 0. */
export const PREROLL_S = 5;
export const SKIP_S = WAIT_MAX_MIN / MINUTES_PER_SIM_S + INSTALL_SIM_S + WARM_MIN_S + WARM_SPAN_S + 1;

/* ---- Flux: where copies land ---------------------------------------------------------------- */

/** Copies the row of hexagons offers; the network allows up to 100 (FluxOS config instances, features['replicas']). */
export const COPIES = { min: 1, max: 12, initial: 3 } as const;
export const FLUX_MAX_COPIES = 100;

/** How many nodes the Flux field samples from the real network (DESIGN.md: 36). */
export const FLUX_NODES = 36;

/*
 * Placement (engine.ts pickFluxHost): one copy per node, and no provider takes more than
 * ceil(copies / providers) copies. FluxOS counts the fault domains that can host an app and caps
 * how many copies one domain takes (placementFeasibility.js L1-L25, features['fault-domains'],
 * https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appPlacement/placementFeasibility.js#L1-L25).
 * In FluxOS that rule is for apps with replicated storage: the simulated app is one, and the
 * receipts popover says so. The "spread" rule adds a geolocation-style
 * preference for the continent that holds the fewest copies (features['geolocation']).
 */

/* ---- the traditional lane ------------------------------------------------------------------- */

/**
 * Traditional hosting: by default one server in one data center (a "zone") of one region. Spread
 * over 3 data centers it repairs itself inside the region, 10 s after a loss (DESIGN.md model
 * table). A region or company failure takes all of it either way. When it is down, the owner
 * redeploys by hand, and a new deployment takes 4 s (DESIGN.md model table).
 */
export const CLOUD_REPAIR_SIM_S = 10;
export const REDEPLOY_SIM_S = 4;
export const CLOUD = { regions: 3, zones: 3, machinesPerZone: 3 } as const;

/* ---- chaos and the weapons ------------------------------------------------------------------- */

/** Chaos mode: a random failure every 2.5 s (DESIGN.md), climbing one rung of the ladder every 10 s (model). */
export const CHAOS_EVERY_S = 2.5;
export const CHAOS_CLIMB_EVERY_S = 10;

export type Weapon = 1 | 2 | 3 | 4;
export type Placement = 'default' | 'spread';
export type LaneKind = 'cloud' | 'flux';

export interface WeaponInfo {
  id: Weapon;
  /** Short label for the button (sentence case). */
  label: string;
  /** What it takes out, in a phrase. */
  title: string;
  /** What it stands for in real life, said without naming anyone (it follows "In real life:"). */
  real: string;
  /** An id from src/data/compare.ts `incidents` that shows it happened: the year and the link are read from it. */
  incident?: string;
}

/** The failure ladder, small to large (DESIGN.md "The failure ladder"). */
export const WEAPONS: readonly WeaponInfo[] = [
  { id: 1, label: 'Machine', title: 'One machine', real: 'a dead disk, or a host that never comes back' },
  { id: 2, label: 'Data center', title: 'A whole facility', real: 'a data center fire', incident: 'ovh-fire-2021' },
  { id: 3, label: 'Country', title: 'A country or region', real: 'a whole cloud region knocked out', incident: 'aws-middle-east-2026' },
  { id: 4, label: 'Provider', title: 'A provider, company or account', real: 'a provider suspending an account', incident: 'gcp-railway-2026' },
];

/** The share link and the URL carry these (docs/DESIGN.md section 11). */
export const DEFAULT_SEED = 7;

export function parseCopies(raw: string | null): number {
  const n = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(n) ? Math.min(COPIES.max, Math.max(COPIES.min, n)) : COPIES.initial;
}

export function parsePlace(raw: string | null): Placement {
  return raw === 'spread' ? 'spread' : 'default';
}

export function parseSeed(raw: string | null): number {
  const n = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(n) && n >= 0 ? n >>> 0 : DEFAULT_SEED;
}
