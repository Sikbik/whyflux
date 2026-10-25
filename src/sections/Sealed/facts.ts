import { fluxStats } from '@/data/flux';
import type { Stat } from '@/data/types';
import type { FluxLiveSnapshot } from '@/lib/live';

/** A stat from the sourced set, by id. */
export const statById = (id: string): Stat | undefined => fluxStats.find((s) => s.id === id);

/**
 * The share of nodes that run ArcaneOS, as a whole percent: computed from the snapshot counts when they
 * exist, else the sourced stat. `arcaneNodes` is a snapshot field (refreshed by scripts/snapshot.mjs), so
 * whatever shows it is dated, never called "live".
 */
export function arcanePercent(live: FluxLiveSnapshot): number | null {
  if (live.arcaneNodes && live.totalNodes > 0) return Math.round((live.arcaneNodes / live.totalNodes) * 100);
  return statById('arcane')?.value ?? null;
}
