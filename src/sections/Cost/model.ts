/**
 * What the cost chapter shows, all of it read from `prices`: two workloads, each a group of
 * platforms priced for the same month. Nothing is typed in. The receipt's line items are parsed out
 * of each note and only trusted when they add up to the published price; when they do not, the note
 * is shown as plain sentences instead. The footnotes pull their sentences out of the same notes.
 */
import type { PricePoint, Source } from '@/data/types';
import { FLUX_ID, type PriceGroup, platformById, priceGroups } from '@/lib/compare';
import { formatNumber, stripPeriod } from '@/lib/format';
import { shortName } from '@/sections/Arena/model';

/* ---------------------------------------------------------------------------------------------
   The two workloads
   --------------------------------------------------------------------------------------------- */

export type BillId = 'one' | 'three';

export interface Workload {
  id: BillId;
  group: PriceGroup;
}

export const BILL_LABEL: Record<BillId, string> = { one: 'One server', three: 'Three copies behind a load balancer' };
export const BILL_LABEL_SHORT: Record<BillId, string> = { one: 'One server', three: 'Three copies' };

/** The single server and the three-replica setup, found by what the workload string says. */
export function workloads(): Workload[] {
  const groups = priceGroups();
  const three = groups.find((g) => /replica|load balanc/i.test(g.workload));
  const one = groups.find((g) => g !== three);
  const out: Workload[] = [];
  if (one) out.push({ id: 'one', group: one });
  if (three) out.push({ id: 'three', group: three });
  return out;
}

export const WORKLOADS: Workload[] = workloads();

/** `?bill=one|three`, falling back to the first workload that exists. */
export function parseBill(raw: string | null): BillId {
  const hit = WORKLOADS.find((w) => w.id === raw);
  return hit?.id ?? WORKLOADS[0]?.id ?? 'one';
}

export const workloadOf = (id: BillId): Workload | undefined => WORKLOADS.find((w) => w.id === id);

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
export const countWord = (n: number): string => WORDS[n] ?? String(n);

/** The date the prices were taken (the latest `asOf` across the points of a group). */
export const pricedOn = (group: PriceGroup): string => group.points.reduce((a, p) => (p.asOf > a ? p.asOf : a), '');

/** "11.4×", "4.0×": a price against Flux's, always one decimal so neighbouring multiples line up. */
export const timesText = (x: number): string => `${formatNumber(x, 1)}×`;

/* ---------------------------------------------------------------------------------------------
   The axis: linear, from zero, with ticks on round dollars
   --------------------------------------------------------------------------------------------- */

export interface Axis {
  max: number;
  step: number;
  ticks: number[];
}

export function niceAxis(value: number, maxTicks = 5): Axis {
  if (!(value > 0)) return { max: 1, step: 1, ticks: [0, 1] };
  const raw = value / maxTicks;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  const mult = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  const step = mult * pow;
  const max = Math.ceil(value / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step / 1000; v += step) ticks.push(Number(v.toFixed(6)));
  return { max, step, ticks };
}

/* ---------------------------------------------------------------------------------------------
   Reading a note
   --------------------------------------------------------------------------------------------- */

/** Splits at a full stop followed by a capital or a digit; "$0.0416/h" has no space after its dot. */
export function sentences(note: string): string[] {
  return note
    .replace(/([.!?])\s+(?=[A-Z0-9“"(*])/g, '$1\u0000')
    .split('\u0000')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Capitalizes a leading word ("a public IPv4"), never an identifier ("t3.medium", "e2-medium", "50 GB"). */
const cap = (s: string): string => (/^[a-z]+(?:\s|$)/.test(s) ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const tidy = (s: string): string => cap(stripPeriod(s.trim().replace(/\s+/g, ' ')));

const NUM = '[\\d,]+(?:\\.\\d+)?';
const num = (s: string | undefined): number => Number((s ?? '').replace(/,/g, ''));

export interface LineItem {
  label: string;
  amount: number;
}

interface Piece {
  item: LineItem;
  /** A clause that trailed the amount ("; disk operations are extra"): moved to the notes. */
  extra?: string;
}

/** One part of "a, plus b, plus c": `label = $x` (any trailing words stay with the label), `3 × $24 label` or one dollar amount. */
function readPart(raw: string): Piece | null {
  const part = raw.trim();
  const eq = part.match(new RegExp(`^(.*?)\\s*=\\s*\\$(${NUM})(.*)$`));
  if (eq) {
    const label = (eq[1] ?? '').trim();
    const amount = num(eq[2]);
    const tail = (eq[3] ?? '').trim();
    if (!label || !Number.isFinite(amount)) return null;
    if (tail.startsWith(';')) return { item: { label: cap(label), amount }, extra: tidy(tail.slice(1)) };
    return { item: { label: cap(tail ? `${label} ${tail}` : label), amount } };
  }
  const times = part.match(new RegExp(`^(\\d+)\\s*×\\s*\\$(${NUM})\\s+\\S`));
  if (times) return { item: { label: cap(part), amount: num(times[1]) * num(times[2]) } };
  const money = part.match(new RegExp(`\\$(${NUM})`, 'g'));
  if (money && money.length === 1) return { item: { label: cap(part), amount: num(money[0]?.slice(1)) } };
  return null;
}

/** "2 CPU × $1.60 + 4 GiB × $0.80 = $7.90 a month (about …)": each term is count × rate. */
function readTerms(body: string): { items: LineItem[]; extra?: string } | null {
  const m = body.match(new RegExp(`^(.*?)\\s=\\s\\$(${NUM})(.*)$`));
  if (!m) return null;
  const terms = (m[1] ?? '').split(/\s\+\s/);
  if (terms.length < 2) return null;
  const items: LineItem[] = [];
  for (const term of terms) {
    const t = term.trim().match(new RegExp(`^(${NUM})\\s+.+?\\s*×\\s*\\$(${NUM})$`));
    if (!t) return null;
    items.push({ label: cap(term.trim()), amount: num(t[1]) * num(t[2]) });
  }
  const paren = (m[3] ?? '').match(/\(([^)]+)\)/);
  return { items, extra: paren?.[1] ? tidy(paren[1]) : undefined };
}

export type NoteKind = 'included' | 'excluded' | 'context';

export interface Note {
  kind: NoteKind;
  text: string;
}

/** "Includes …" is what the price covers; egress, extras and "after N" are what it does not. */
function kindOf(s: string): NoteKind {
  if (/^(?:it )?includes?\b/i.test(s)) return 'included';
  if (/\bnot included\b|\bextra\b|\banother \$|\begress\b|\bbeyond\b|\bafter \d|\bcan add\b/i.test(s)) return 'excluded';
  return 'context';
}

export interface Bill {
  /** The sentence that says what the number is: the scope of an itemized note, else its first sentence. */
  lead: string | null;
  /** Line items that add up to the price; empty when the note does not itemize or does not add up. */
  items: LineItem[];
  notes: Note[];
}

/** Within a cent or two: the notes round each line. */
const ADDS_UP = 0.011;

export function readBill(point: PricePoint): Bill {
  const all = sentences(point.note);
  const first = all[0] ?? '';
  const rest = all.slice(1);

  // "us-east-1 on-demand: t3.medium … = $30.37, plus …": a short scope before the first colon.
  let scope: string | null = null;
  let body = stripPeriod(first);
  const colon = body.indexOf(':');
  const dollar = body.indexOf('$');
  if (colon > 0 && colon < 60 && (dollar < 0 || colon < dollar)) {
    scope = body.slice(0, colon).trim();
    body = body.slice(colon + 1).trim();
  }

  let items: LineItem[] = [];
  const extras: string[] = [];
  const parts = body.split(/,\s+plus\s+/);
  if (parts.length >= 2) {
    const pieces = parts.map(readPart);
    if (pieces.every((p): p is Piece => p !== null)) {
      items = pieces.map((p) => p.item);
      for (const p of pieces) if (p.extra) extras.push(p.extra);
    }
  } else {
    const terms = readTerms(body);
    if (terms) {
      items = terms.items;
      if (terms.extra) extras.push(terms.extra);
    }
  }

  const sum = items.reduce((a, i) => a + i.amount, 0);
  const itemized = items.length >= 2 && Math.abs(sum - point.usdPerMonth) <= ADDS_UP;

  const sentenceList = itemized ? [...extras, ...rest] : all.slice(1);
  const notes = sentenceList.map((s): Note => {
    const kind = kindOf(s);
    const text = tidy(s.replace(/^(?:not included|caveats):\s*/i, ''));
    return { kind, text };
  });

  if (itemized) return { lead: scope, items, notes };
  return { lead: first ? tidy(first) : null, items: [], notes };
}

/* ---------------------------------------------------------------------------------------------
   The footnotes
   --------------------------------------------------------------------------------------------- */

export interface Footnote {
  id: string;
  /** Who it is about: a platform id (gets its swatch) or null. */
  platformId: string | null;
  lead: string;
  text: string;
  sources: Source[];
}

const pointIn = (group: PriceGroup | undefined, platformId: string): PricePoint | undefined =>
  group?.points.find((p) => p.platformId === platformId);

const sentenceWith = (point: PricePoint | undefined, re: RegExp): string | undefined =>
  point ? sentences(point.note).find((s) => re.test(s)) : undefined;

const unique = (list: Source[]): Source[] => list.filter((s, i) => list.findIndex((x) => x.url === s.url) === i);

/** A platform's sources across both workloads whose address contains the needle. */
const findSources = (platformId: string, needle: string): Source[] =>
  unique(WORKLOADS.flatMap((w) => pointIn(w.group, platformId)?.sources ?? []).filter((s) => s.url.includes(needle)));

/** The machines that are burstable or share cores, and the page that says so. */
const SHARED_CORE_DOCS: Record<string, string> = {
  aws: 'burstable',
  azure: 'bv1-series',
  gcp: 'general-purpose-machines',
  digitalocean: 'pricing/droplets',
  hetzner: 'cost-optimized',
};
const SHARED_CORE = /shared|burstable|baseline/i;

/**
 * The caveats behind the chart, for the workload on screen, for the receipts toggle. Each sentence is
 * lifted from a note; only the connecting words are written here. The fact that one copy is down
 * until the network rebuilds it is not repeated here: it is in Flux's own receipt, in the note's words.
 */
export function footnotesFor(group: PriceGroup): Footnote[] {
  const out: Footnote[] = [];
  const flux = pointIn(group, FLUX_ID);
  const name = (id: string): string => {
    const p = platformById(id);
    return p ? shortName(p) : id;
  };

  // Burstable and shared-core machines on the clouds' side; reserved but not dedicated cores on Flux's.
  const shared = Object.keys(SHARED_CORE_DOCS).filter(
    (id) => pointIn(group, id) && WORKLOADS.some((w) => SHARED_CORE.test(pointIn(w.group, id)?.note ?? '')),
  );
  if (shared.length) {
    out.push({
      id: 'cores',
      platformId: null,
      lead: 'Shared cores',
      text: `The ${listNames(shared.map(name))} machines are burstable or shared-core. This compares prices for the same specification`,
      sources: unique(shared.flatMap((id) => findSources(id, SHARED_CORE_DOCS[id] ?? ''))),
    });
  }

  const hetzner = pointIn(group, 'hetzner');
  const caveats = sentenceWith(hetzner, /^caveats:/i);
  if (hetzner && caveats) {
    out.push({
      id: 'hetzner',
      platformId: 'hetzner',
      lead: 'Hetzner',
      text: tidy(caveats.replace(/^caveats:\s*/i, '')),
      sources: hetzner.sources,
    });
  }

  const akash = pointIn(group, 'akash');
  if (akash) {
    const range = akash.note.match(/ranged from (\$[\d,.]+) to (\$[\d,.]+)/i);
    const noLb = sentenceWith(akash, /no load balancing/i);
    const bid = sentenceWith(akash, /bid market/i);
    const text = noLb
      ? tidy(noLb)
      : range
        ? `The bar is the default provider price script. Akash is a bid market, so each provider sets its own price, and real leases for this size ranged from ${range[1]} to ${range[2]}`
        : bid
          ? tidy(bid)
          : null;
    if (text) out.push({ id: 'akash', platformId: 'akash', lead: 'Akash', text, sources: akash.sources });
  }

  if (flux) {
    const fluxAmount = flux.note.match(/([\d,.]+) FLUX if paid in FLUX/i)?.[1];
    const discount = WORKLOADS.map((w) => pointIn(w.group, FLUX_ID)?.note.match(/(\d+(?:\.\d+)?)% discount/i)?.[1]).find(Boolean);
    if (fluxAmount) {
      out.push({
        id: 'flux-pay',
        platformId: FLUX_ID,
        lead: 'Paying in FLUX',
        text: `Paid in FLUX instead of dollars, this workload comes to ${fluxAmount} FLUX${discount ? `, a ${discount}% discount` : ''}`,
        sources: flux.sources,
      });
    }
  }

  const providers = group.points.filter((p) => /all replicas run on/i.test(p.note));
  if (providers.length && flux && /different/i.test(flux.note)) {
    out.push({
      id: 'one-provider',
      platformId: null,
      lead: 'Three copies',
      text: 'In the cloud rows all three copies run with one provider. Flux places each copy on a different node',
      sources: flux.sources,
    });
  }

  return out;
}

function listNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
