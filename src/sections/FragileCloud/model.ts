/**
 * Chapter 01 model: everything pure. Nothing here is a fact: it reads `src/data/compare.ts`
 * (incidents, cloudMarketShare) and arranges it for the page (grouping, ordering, layout math).
 * The few timings of the blackout sequence are constants of the illustration, not claims.
 */
import type { Incident, MarketShare, Source } from '@/data/types';

/* --------------------------------------------------------------------------
   Companies and kinds
   -------------------------------------------------------------------------- */

/** The four rows of the ruler: the big three, then the rest. */
export type GroupId = 'aws' | 'azure' | 'google' | 'other';

export const GROUP_ORDER: readonly GroupId[] = ['aws', 'azure', 'google', 'other'];

/** Short names for tight places (the ruler's row labels, the phone's list). */
export const GROUP_SHORT: Record<GroupId, string> = {
  aws: 'AWS',
  azure: 'Azure',
  google: 'Google',
  other: 'Others',
};

/**
 * Matches both spellings in the data: market-share rows say "Amazon Web Services", incidents say
 * "AWS". Anything that is not one of the big three (Cloudflare, Fastly, OVHcloud, Hetzner,
 * CrowdStrike, and the "Everyone else" row) is `other`.
 */
export function groupOf(name: string): GroupId {
  if (/\bAWS\b|Amazon/i.test(name)) return 'aws';
  if (/Azure|Microsoft/i.test(name)) return 'azure';
  if (/Google/i.test(name)) return 'google';
  return 'other';
}

export type Kind = NonNullable<Incident['kind']>;
export type KindFilter = 'all' | Kind;

const KINDS: readonly Kind[] = ['outage', 'physical', 'deplatforming'];

export const KIND_LABEL: Record<Kind, string> = {
  outage: 'Outage',
  physical: 'Physical',
  deplatforming: 'Deplatforming',
};

export function isKind(v: string | null | undefined): v is Kind {
  return KINDS.some((k) => k === v);
}

/** An incident without a kind is a plain outage. */
export const kindOf = (i: Incident): Kind => i.kind ?? 'outage';

/** "CrowdStrike (Windows)" becomes "CrowdStrike"; "Microsoft Azure" becomes "Azure". */
export function shortProvider(name: string): string {
  const g = groupOf(name);
  if (g !== 'other') return GROUP_SHORT[g];
  return name.replace(/\s*\(.*\)\s*$/, '').trim();
}

/* --------------------------------------------------------------------------
   Time
   -------------------------------------------------------------------------- */

/** UTC milliseconds of a YYYY-MM-DD date. */
export const dayMs = (iso: string): number => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);

export const byDate = (a: Incident, b: Incident): number => dayMs(a.date) - dayMs(b.date);

/* --------------------------------------------------------------------------
   The share of spending (the lede, and the share beside each row of the ruler)
   -------------------------------------------------------------------------- */

export interface ShareRow {
  id: GroupId;
  provider: string;
  sharePct: number;
  /** True for the three named companies. */
  big: boolean;
}

export interface Share {
  rows: ShareRow[];
  /** Combined share of the named companies, computed. */
  top: number;
  asOf: string;
  sources: Source[];
}

/** The market-share rows in the order of the data, the named companies and then the remainder. */
export function buildShare(rows: readonly MarketShare[]): Share | null {
  if (rows.length === 0) return null;
  const mapped = rows.map((r): ShareRow => {
    const id = groupOf(r.provider);
    return { id, provider: r.provider, sharePct: r.sharePct, big: id !== 'other' };
  });
  const big = mapped.filter((r) => r.big);
  const seen = new Map<string, Source>();
  for (const r of rows) if (!seen.has(r.source.url)) seen.set(r.source.url, r.source);
  const asOf = rows[0]?.asOf ?? '';
  return {
    rows: mapped,
    top: big.reduce((s, r) => s + r.sharePct, 0),
    asOf,
    sources: [...seen.values()],
  };
}

/* --------------------------------------------------------------------------
   What an incident reads as: one big number, and the names that went dark
   -------------------------------------------------------------------------- */

export type Readout =
  | { type: 'hours'; hours: number }
  /** A timescale read from the `impact` text, for events that ran for days or longer. */
  | { type: 'word'; word: string; tail?: string };

/**
 * The big number. `durationHours` when the data has it. Otherwise a word read from the incident's
 * own `impact` text: the data leaves the hours out of events that ran for days, weeks or for good,
 * because a number would be wrong (research/competitors.md section 7).
 */
export function readoutFor(i: Incident): Readout | null {
  if (typeof i.durationHours === 'number') return { type: 'hours', hours: i.durationHours };
  const t = i.impact;
  if (/\bmonths?\b/i.test(t)) return { type: 'word', word: 'Months', tail: 'offline' };
  if (/\bweeks?\b/i.test(t)) return { type: 'word', word: 'Weeks', tail: 'offline' };
  if (/\bdays?\b/i.test(t)) return { type: 'word', word: 'Days', tail: 'offline' };
  if (/never came back|for good|permanent/i.test(t)) return { type: 'word', word: 'Never came back' };
  if (i.kind === 'deplatforming') return { type: 'word', word: 'Cut off' };
  return null;
}

/** The unit a readout counts in, fixed by the final value so it never flips mid-count. */
export function durationUnit(hours: number): { label: string; perHour: number; decimals: number } {
  if (hours < 1) return { label: 'minutes', perHour: 60, decimals: 0 };
  if (hours < 48) return { label: 'hours', perHour: 1, decimals: 1 };
  return { label: 'days', perHour: 1 / 24, decimals: 1 };
}

/** The value shown at a moment of the count: `hours` is the final duration, `p` runs 0 to 1. */
export function durationText(hours: number, p: number): string {
  const { perHour, decimals } = durationUnit(hours);
  const v = hours * perHour * Math.min(1, Math.max(0, p));
  return v.toFixed(decimals).replace(/\.0+$/, '');
}

/** Most names one incident shows; the rest fold into a last "more". */
export const MAX_NAMES = 12;

export interface NameItem {
  key: string;
  name: string;
  /** The folded remainder, not a service. */
  more?: boolean;
}

/**
 * What goes dark: the services named in the record, or the provider when none are named. Nothing is
 * invented: a short record gives a short list.
 */
export function namesFor(i: Incident): NameItem[] {
  const named = (i.affected ?? []).filter((s) => s.trim().length > 0);
  if (named.length === 0) return [{ key: 'provider', name: shortProvider(i.provider) }];
  if (named.length <= MAX_NAMES) return named.map((name, n) => ({ key: `${n}:${name}`, name }));
  const head = named.slice(0, MAX_NAMES - 1).map((name, n) => ({ key: `${n}:${name}`, name }));
  return [...head, { key: 'more', name: `${named.length - head.length} more`, more: true }];
}

export type NameSize = 'one' | 'few' | 'some' | 'many' | 'lots';

/** The type sizes of the names (rem at their largest), from the biggest down. */
const NAME_SIZES: readonly { key: NameSize; rem: number }[] = [
  { key: 'one', rem: 6.6 },
  { key: 'few', rem: 5 },
  { key: 'some', rem: 3.7 },
  { key: 'many', rem: 3 },
];

/**
 * How big the names are set: the largest size at which they still fit the column in a few lines.
 * Layout math, not a fact: a rough count of the lines the names take at each size.
 */
export function nameSize(names: readonly NameItem[]): NameSize {
  const chars = names.reduce((sum, n) => sum + n.name.length, 0) + 2 * Math.max(0, names.length - 1);
  for (const size of NAME_SIZES) {
    const px = size.rem * 16;
    const perLine = 560 / (px * 0.66);
    const lines = Math.ceil((chars * 1.2) / perLine);
    if (lines * px * 1.05 <= 300) return size.key;
  }
  return 'lots';
}

/* --------------------------------------------------------------------------
   The ruler: incidents by date, in a row per company
   -------------------------------------------------------------------------- */

/** Marker diameter in px: grows with the square root of the hours; a fixed medium when unknown. */
export function markerSize(i: Incident): number {
  if (typeof i.durationHours !== 'number') return 21;
  return Math.min(28, 12 + 4.2 * Math.sqrt(i.durationHours));
}

export interface Placed {
  incident: Incident;
  group: GroupId;
  /** 0..1 along the ruler. */
  t: number;
  /** Center from the top of the plot, px. */
  y: number;
  d: number;
}

export interface TimelineLayout {
  placed: Placed[];
  rows: { group: GroupId; top: number; height: number }[];
  height: number;
  /** Start of each calendar year inside the range, for the axis. */
  years: { label: string; t: number }[];
  startMs: number;
  endMs: number;
}

export const ROW_PAD = 5;
export const LANE_PITCH = 30;

/**
 * Time runs left to right across `plotW` px, linear in days. Each company has a row; markers in
 * one row that would overlap are pushed to a second lane, so every marker stays reachable.
 */
export function layoutTimeline(list: readonly Incident[], plotW: number): TimelineLayout {
  const sorted = [...list].sort(byDate);
  const startMs = sorted.length ? dayMs(sorted[0]!.date) : 0;
  const endMs = sorted.length ? dayMs(sorted[sorted.length - 1]!.date) : 1;
  const span = Math.max(1, endMs - startMs);
  const W = Math.max(200, plotW);

  const rows: TimelineLayout['rows'] = [];
  const placed: Placed[] = [];
  let top = 0;
  for (const group of GROUP_ORDER) {
    const mine = sorted.filter((i) => groupOf(i.provider) === group);
    const lanes: { x: number; r: number }[][] = [];
    const slots = mine.map((incident) => {
      const t = (dayMs(incident.date) - startMs) / span;
      const x = t * W;
      const d = markerSize(incident);
      let lane = lanes.findIndex((l) => l.every((o) => Math.abs(o.x - x) >= (o.r + d / 2) * 0.92 + 3));
      if (lane < 0) {
        lane = lanes.length;
        lanes.push([]);
      }
      lanes[lane]!.push({ x, r: d / 2 });
      return { incident, t, d, lane };
    });
    const laneCount = Math.max(1, lanes.length);
    const height = ROW_PAD * 2 + laneCount * LANE_PITCH;
    for (const s of slots) {
      placed.push({
        incident: s.incident,
        group,
        t: s.t,
        d: s.d,
        y: top + ROW_PAD + s.lane * LANE_PITCH + LANE_PITCH / 2,
      });
    }
    rows.push({ group, top, height });
    top += height;
  }

  const years: TimelineLayout['years'] = [];
  if (sorted.length) {
    const y0 = new Date(startMs).getUTCFullYear();
    const y1 = new Date(endMs).getUTCFullYear();
    for (let y = y0; y <= y1; y++) {
      const t = (Date.UTC(y, 0, 1) - startMs) / span;
      years.push({ label: String(y), t: Math.min(1, Math.max(0, t)) });
    }
  }
  return { placed, rows, height: top, years, startMs, endMs };
}

/* --------------------------------------------------------------------------
   Timings of the blackout sequence (an illustration, not a measurement)
   -------------------------------------------------------------------------- */

/** How long the services stay lit before they flicker out. */
export const LIT_MS = 620;
/** How long the stage holds each incident while it replays. */
export const REPLAY_STEP_MS = 2800;
