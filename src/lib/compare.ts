/**
 * Lookups over src/data/compare.ts, so the chapters that use the comparison data (04 DePIN gap,
 * 08 Arena, 09 Cost) read it the same way. Nothing here changes a fact; it only indexes them.
 *
 *   const c = cellFor('akash', 'self-healing');       // Cell | undefined
 *   const h = headToHead('flux', 'akash');             // { rows, wins, ties, losses }
 *   const groups = priceGroups();                       // [{ workload, points }] cheapest first
 *
 * Colour rule (research/competitors.md section 11): platform colours are unique within a kind, not
 * across kinds (Akash/Hetzner red, Render/AWS orange, Theta/Azure teal share a hue). Any chart that
 * mixes kinds must label series directly and use `seriesStyle()` for the secondary encoding.
 */
import { cells, dimensions, platforms, prices } from '@/data/compare';
import type { Cell, Dimension, Platform, PlatformKind, PricePoint } from '@/data/types';

export const FLUX_ID = 'flux';

const PLATFORM = new Map<string, Platform>(platforms.map((p) => [p.id, p]));
const DIMENSION = new Map<string, Dimension>(dimensions.map((d) => [d.id, d]));
const CELL = new Map<string, Cell>(cells.map((c) => [`${c.platformId}:${c.dimensionId}`, c]));

export const platformById = (id: string | null | undefined): Platform | undefined => (id ? PLATFORM.get(id) : undefined);
export const dimensionById = (id: string): Dimension | undefined => DIMENSION.get(id);
export const cellFor = (platformId: string, dimensionId: string): Cell | undefined => CELL.get(`${platformId}:${dimensionId}`);

/** 0 to 5, or 0 when the cell is missing (the UI renders gracefully while data fills in). */
export const scoreFor = (platformId: string, dimensionId: string): number => cellFor(platformId, dimensionId)?.score ?? 0;

export const platformsOfKind = (kind: PlatformKind): Platform[] => platforms.filter((p) => p.kind === kind);

/** The competitors: every platform except Flux, DePIN first, in the order of the data. */
export const rivals = (): Platform[] => [...platformsOfKind('depin'), ...platformsOfKind('web2')];

/** The filter groups of the matrix, in reading order, with their labels. */
export const DIMENSION_GROUPS: readonly { id: Dimension['group']; label: string }[] = [
  { id: 'decentralization', label: 'Decentralization' },
  { id: 'resilience', label: 'Resilience' },
  { id: 'developer', label: 'Developer experience' },
  { id: 'economics', label: 'Economics' },
  { id: 'scale', label: 'Scale' },
];

/** The dimensions of one group, in the order of the data. */
export const dimensionsInGroup = (group: Dimension['group']): Dimension[] => dimensions.filter((d) => d.group === group);

export type SeriesMarker = 'circle' | 'square' | 'diamond';

/**
 * The secondary encoding for mixed-kind charts: web2 platforms are dashed and square, DePIN are
 * solid and round, Flux is solid and a diamond. Always pair it with a direct label.
 */
export function seriesStyle(p: Platform): { stroke: string; dash: string | undefined; marker: SeriesMarker } {
  if (p.kind === 'flux') return { stroke: p.color, dash: undefined, marker: 'diamond' };
  if (p.kind === 'web2') return { stroke: p.color, dash: '5 4', marker: 'square' };
  return { stroke: p.color, dash: undefined, marker: 'circle' };
}

export interface HeadToHeadRow {
  dimension: Dimension;
  a: Cell | undefined;
  b: Cell | undefined;
  /** a.score minus b.score (positive: `a` is ahead). */
  delta: number;
}

/**
 * Two platforms across every dimension. Dimensions where either cell is `na` are listed but left
 * out of the tally. Losses are counted and shown: that is what makes the rest credible.
 */
export function headToHead(aId: string, bId: string): { rows: HeadToHeadRow[]; wins: number; ties: number; losses: number } {
  let wins = 0;
  let ties = 0;
  let losses = 0;
  const rows = dimensions.map((dimension): HeadToHeadRow => {
    const a = cellFor(aId, dimension.id);
    const b = cellFor(bId, dimension.id);
    const delta = (a?.score ?? 0) - (b?.score ?? 0);
    if (a && b && a.verdict !== 'na' && b.verdict !== 'na') {
      if (delta > 0) wins++;
      else if (delta < 0) losses++;
      else ties++;
    }
    return { dimension, a, b, delta };
  });
  return { rows, wins, ties, losses };
}

/** Dimensions where some platform scores higher than Flux: "where Flux loses", shown on purpose. */
export function fluxTrailsOn(): { dimension: Dimension; best: { platform: Platform; score: number }[] }[] {
  const out: { dimension: Dimension; best: { platform: Platform; score: number }[] }[] = [];
  for (const dimension of dimensions) {
    const flux = scoreFor(FLUX_ID, dimension.id);
    const ahead = platforms
      .filter((p) => p.id !== FLUX_ID)
      .map((platform) => ({ platform, score: scoreFor(platform.id, dimension.id) }))
      .filter((x) => x.score > flux)
      .sort((x, y) => y.score - x.score);
    if (ahead.length) out.push({ dimension, best: ahead });
  }
  return out;
}

export interface PriceGroup {
  /** The workload string, identical for every point in the group. */
  workload: string;
  /** Cheapest first. */
  points: PricePoint[];
  /** The Flux price in this group, when present. */
  flux: PricePoint | undefined;
}

/** `prices` grouped by workload, each group cheapest first. Flux appears once in each. */
export function priceGroups(): PriceGroup[] {
  const by = new Map<string, PricePoint[]>();
  for (const p of prices) by.set(p.workload, [...(by.get(p.workload) ?? []), p]);
  return [...by.entries()].map(([workload, points]) => {
    const sorted = [...points].sort((a, b) => a.usdPerMonth - b.usdPerMonth);
    return { workload, points: sorted, flux: sorted.find((p) => p.platformId === FLUX_ID) };
  });
}

/** How many times more a price is than Flux's in the same group (undefined without a Flux price). */
export function timesFlux(point: PricePoint, group: PriceGroup): number | undefined {
  return group.flux && group.flux.usdPerMonth > 0 ? point.usdPerMonth / group.flux.usdPerMonth : undefined;
}
