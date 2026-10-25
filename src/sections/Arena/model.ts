/**
 * The arena's pure logic: the scoring rubric, names, the dimension order and the outcome of one
 * question in a matchup. Nothing here is a fact about a platform: every fact is read from
 * src/data/compare.ts through @/lib/compare. What lives here is the method and the labels.
 */
import { cells } from '@/data/compare';
import type { Dimension, Platform, PlatformKind, Verdict } from '@/data/types';
import {
  cellFor,
  DIMENSION_GROUPS,
  dimensionsInGroup,
  FLUX_ID,
  type HeadToHeadRow,
  platformById,
  platformsOfKind,
  rivals,
} from '@/lib/compare';

export { cellFor, DIMENSION_GROUPS, FLUX_ID, platformById, rivals };

export type GroupId = Dimension['group'];
export type ArenaView = 'matrix' | 'h2h' | 'shape';

export const VIEWS: readonly ArenaView[] = ['matrix', 'h2h', 'shape'];

/* ---------------------------------------------------------------------------------------------
   The rubric
   --------------------------------------------------------------------------------------------- */

/**
 * The 0 to 5 scale every cell is scored on. Source: research/competitors.md section 1 and the head
 * comment of src/data/compare.ts. Verdicts follow the score: yes is 4 or 5, partial is 2 or 3, no is
 * 0 or 1, and na (scored 0) means the question does not apply to that platform.
 */
export const RUBRIC: readonly { score: number; verdict: Verdict; meaning: string }[] = [
  { score: 5, verdict: 'yes', meaning: 'Yes, by default, no assembly required' },
  { score: 4, verdict: 'yes', meaning: 'Yes, with a real caveat' },
  { score: 3, verdict: 'partial', meaning: 'Partial: it exists, but opt-in, limited or do it yourself' },
  { score: 2, verdict: 'partial', meaning: 'Weak: possible only with significant work, or for a narrow workload' },
  { score: 1, verdict: 'no', meaning: 'Essentially no' },
  { score: 0, verdict: 'no', meaning: 'No, or not offered' },
];

const VERDICT_WORD: Record<Verdict, string> = { yes: 'Yes', partial: 'Partial', no: 'No', na: 'Not applicable' };

export const verdictWord = (v: Verdict): string => VERDICT_WORD[v];

/** The latest `accessed` date across every cell source: "scores checked on". */
export const SCORES_CHECKED: string = (() => {
  let latest = '';
  for (const c of cells) for (const s of c.sources) if (s.accessed > latest) latest = s.accessed;
  return latest;
})();

/* ---------------------------------------------------------------------------------------------
   Names
   --------------------------------------------------------------------------------------------- */

/** Compact names for the roster and tight labels. The full name is always the accessible name. */
const SHORT_NAMES: Record<string, string> = {
  akash: 'Akash',
  icp: 'ICP',
  render: 'Render',
  golem: 'Golem',
  theta: 'Theta',
  phala: 'Phala',
  aws: 'AWS',
  azure: 'Azure',
  gcp: 'Google Cloud',
};

export const shortName = (p: Platform): string => SHORT_NAMES[p.id] ?? p.name;

export const KIND_LABEL: Record<PlatformKind, string> = { flux: 'Flux', depin: 'DePIN', web2: 'Web2' };
export const KIND_GROUP_LABEL: Record<PlatformKind, string> = {
  flux: 'The baseline',
  depin: 'DePIN networks',
  web2: 'Web2 clouds',
};

/** Rivals grouped by kind, in the order of the data. */
export const rivalGroups = (): { kind: PlatformKind; label: string; platforms: Platform[] }[] =>
  (['depin', 'web2'] as const).map((kind) => ({ kind, label: KIND_LABEL[kind], platforms: platformsOfKind(kind) }));

/* ---------------------------------------------------------------------------------------------
   Dimensions in group order (the order the matrix columns and the radar spokes use)
   --------------------------------------------------------------------------------------------- */

/**
 * Lead with the strongest ground. Resilience is the page's thesis, so it opens; any group not named
 * here follows in the data's order. Within a group the questions run from Flux's highest score down
 * (ties keep the data's order), so every view starts with what Flux does best.
 */
const GROUP_ORDER: readonly GroupId[] = ['resilience', 'decentralization', 'developer', 'economics', 'scale'];

const fluxScore = (d: Dimension): number => {
  const c = cellFor(FLUX_ID, d.id);
  return !c || c.verdict === 'na' ? -1 : c.score;
};

const strongestFirst = (list: Dimension[]): Dimension[] =>
  list
    .map((d, i) => ({ d, i, s: fluxScore(d) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.d);

export const GROUPED_DIMENSIONS: readonly { group: GroupId; label: string; dimensions: Dimension[] }[] = [
  ...GROUP_ORDER,
  ...DIMENSION_GROUPS.map((g) => g.id).filter((id) => !GROUP_ORDER.includes(id)),
]
  .map((id) => ({ group: id, label: DIMENSION_GROUPS.find((g) => g.id === id)?.label ?? id, dimensions: strongestFirst(dimensionsInGroup(id)) }))
  .filter((g) => g.dimensions.length > 0);

export const ORDERED_DIMENSIONS: readonly Dimension[] = GROUPED_DIMENSIONS.flatMap((g) => g.dimensions);

export const groupLabel = (id: GroupId): string => DIMENSION_GROUPS.find((g) => g.id === id)?.label ?? id;

/* ---------------------------------------------------------------------------------------------
   One question in a matchup
   --------------------------------------------------------------------------------------------- */

export type Outcome = 'win' | 'tie' | 'loss' | 'na';

/** How one row of `headToHead(flux, x)` came out for Flux. A cell that is missing or not applicable is `na`. */
export function outcomeOf(row: HeadToHeadRow | undefined): Outcome {
  if (!row || !row.a || !row.b || row.a.verdict === 'na' || row.b.verdict === 'na') return 'na';
  return row.delta > 0 ? 'win' : row.delta < 0 ? 'loss' : 'tie';
}
