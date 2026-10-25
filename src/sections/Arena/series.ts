import type { Cell, Platform } from '@/data/types';
import { cellFor, platformById, seriesStyle, type SeriesMarker } from '@/lib/compare';
import { FLUX_ID, ORDERED_DIMENSIONS } from './model';

/** One platform drawn on the shape view: its scores in question order and how it is drawn. */
export interface Series {
  platform: Platform;
  /** In ORDERED_DIMENSIONS order. */
  cells: (Cell | undefined)[];
  /** 0 to 5; a question that does not apply counts as 0 on the chart (and says so in the table). */
  scores: number[];
  /** A CSS colour: Flux is the page accent, everyone else their own colour. */
  color: string;
  /** Dashed for web2, solid for DePIN and Flux (the secondary encoding, so hue is never alone). */
  dash: string | undefined;
  marker: SeriesMarker;
}

/** Flux first, then the chosen platforms in the order they were picked. Unknown ids are skipped. */
export function buildSeries(ids: readonly string[]): Series[] {
  const out: Series[] = [];
  for (const id of [FLUX_ID, ...ids]) {
    const platform = platformById(id);
    if (!platform || out.some((s) => s.platform.id === id)) continue;
    const cells = ORDERED_DIMENSIONS.map((d) => cellFor(id, d.id));
    const style = seriesStyle(platform);
    out.push({
      platform,
      cells,
      scores: cells.map((c) => (c && c.verdict !== 'na' ? c.score : 0)),
      color: platform.kind === 'flux' ? 'var(--accent)' : style.stroke,
      dash: style.dash,
      marker: style.marker,
    });
  }
  return out;
}

/**
 * Where each series is labelled: the question on which it stands out most from the others (its score
 * minus the best of the rest), then its highest score. Labels are spread: a spoke is used once, and a
 * neighbour is avoided when another choice is nearly as good.
 */
export function labelSpokes(series: readonly Series[]): number[] {
  const n = ORDERED_DIMENSIONS.length;
  const used: number[] = [];
  return series.map((s, si) => {
    const ranked = s.scores
      .map((score, i) => {
        const others = series.filter((_, j) => j !== si).map((o) => o.scores[i] ?? 0);
        return { i, score, lead: score - (others.length ? Math.max(...others) : 0) };
      })
      .sort((a, b) => b.lead - a.lead || b.score - a.score || a.i - b.i);
    const free = ranked.filter((c) => !used.includes(c.i));
    const apart = free.find((c) => used.every((u) => Math.min((c.i - u + n) % n, (u - c.i + n) % n) > 1));
    const pick = (apart ?? free[0] ?? ranked[0])?.i ?? 0;
    used.push(pick);
    return pick;
  });
}

/**
 * The question where Flux leads the chosen rivals by the most (its score minus the best of them), then
 * its highest score, then question order: where the readout opens, so it opens on a win.
 */
export function strongestLead(series: readonly Series[]): number {
  const flux = series[0];
  if (!flux) return 0;
  const rivals = series.slice(1);
  let best = 0;
  let bestLead = Number.NEGATIVE_INFINITY;
  let bestScore = -1;
  flux.scores.forEach((score, i) => {
    const lead = rivals.length ? score - Math.max(...rivals.map((r) => r.scores[i] ?? 0)) : 0;
    if (lead > bestLead || (lead === bestLead && score > bestScore)) {
      bestLead = lead;
      bestScore = score;
      best = i;
    }
  });
  return best;
}
