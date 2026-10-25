/**
 * Live Flux network data for the UI. Owned by the Flux research pass.
 * The public surface (types, EMPTY_SNAPSHOT, useFluxLive) is fixed; additions are optional.
 *
 * useFluxLive() returns bundled counts immediately (status 'snapshot'), loads node
 * points from /data/network-snapshot.json, then switches to 'live' once
 * api.runonflux.io answers. One shared cache for every caller; see ./store.ts.
 *
 * Refresh the bundled snapshot with: node scripts/snapshot.mjs
 */
import { useSyncExternalStore } from 'react';
import { getFluxLive, subscribeFluxLive } from './store.ts';
import type { FluxLiveSnapshot } from './types.ts';

export type { CountryCount, FluxLiveSnapshot, NodePoint } from './types.ts';
export type { ParallelAccrual, PayoutAmounts, PayoutCycle } from './format.ts';
export { getFluxLive, LIVE_ENDPOINTS, subscribeFluxLive } from './store.ts';
export {
  blockReward,
  capacityTotals,
  CHAIN,
  countryCounts,
  countryFlag,
  countryName,
  estimateHeight,
  formatCompact,
  formatInt,
  formatStorageTb,
  liveStatValue,
  lockedCollateral,
  nextRewardReduction,
  PARALLEL_MINING,
  payoutCycle,
  payoutCycles,
  TIER_COLLATERAL,
  TIER_IDS,
  tierShares,
} from './format.ts';

export const EMPTY_SNAPSHOT: FluxLiveSnapshot = {
  status: 'loading',
  fetchedAt: '',
  totalNodes: 0,
  tiers: { cumulus: 0, nimbus: 0, stratus: 0 },
  points: [],
};

/** React hook: the latest network snapshot. Never throws; never suspends. */
export function useFluxLive(): FluxLiveSnapshot {
  return useSyncExternalStore(subscribeFluxLive, getFluxLive, getFluxLive);
}
