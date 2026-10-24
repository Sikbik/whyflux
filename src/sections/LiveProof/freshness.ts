/**
 * Which numbers on the proof wall are live and which are a snapshot, said per number.
 *
 * The live layer refreshes only some fields at runtime (src/lib/live/store.ts):
 *   - the tier counts (so nodes online, and the collateral derived from them) every minute;
 *   - capacity (cores, RAM, SSD) and per-country counts every 15 minutes, after an idle delay.
 * Everything else (running apps, operator identities, the redundancy and ArcaneOS shares) only moves
 * when scripts/snapshot.mjs is re-run, so it is labeled a snapshot even while the network answers.
 */
import type { FluxLiveSnapshot } from '@/lib/live';
import { SNAPSHOT_SUMMARY } from '@/lib/live/snapshot.generated';

export interface Freshness {
  status: FluxLiveSnapshot['status'];
  /** ISO time of the data, when it is worth showing as an age or a date. */
  fetchedAt?: string;
}

const COUNTED = new Set(['nodes', 'collateral']);
const CAPACITY = new Set(['countries', 'cores', 'ram', 'storage']);

export function freshnessOf(statId: string, live: FluxLiveSnapshot): Freshness {
  if (live.status === 'loading') return { status: 'loading' };
  if (live.status === 'live') {
    if (COUNTED.has(statId)) return { status: 'live', fetchedAt: live.fetchedAt };
    // The capacity fetch replaces the per-country list; while that list is still the bundled one,
    // these numbers are too. (If the answer equals the bundle exactly we err on the side of "snapshot".)
    if (CAPACITY.has(statId) && live.byCountry !== SNAPSHOT_SUMMARY.byCountry) return { status: 'live' };
  }
  return { status: 'snapshot', fetchedAt: live.snapshotAt ?? live.fetchedAt };
}
