/**
 * The model behind chapter 07. Everything the operator's seat shows is derived here from
 * `operatorAccess` (src/data/flux.ts): the attempts, their answers per kind of node, the layers that
 * decide them. The UI adds no capability, layer, verdict or claim of its own. What lives in this file is
 * presentation only: which attempts the seat plays, the illustrative command lines, and the pacing.
 *
 * Verdict direction (types.ts): the question is "Can a node operator ...?", so `yes` means the operator
 * CAN (the app is exposed), `no` means they cannot, `partial` means only under the notes' conditions.
 */
import type { OperatorAccessRow, Verdict } from '@/data/types';

export type Host = 'legacy' | 'arcane';

export const HOSTS: readonly Host[] = ['legacy', 'arcane'];

/** The data's own words for the two kinds of node. */
export const HOST_NAME: Record<Host, string> = { legacy: 'Legacy node', arcane: 'ArcaneOS node' };

/** One row of `operatorAccess` with a guaranteed stable key. */
export interface Attempt extends OperatorAccessRow {
  key: string;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function toAttempts(rows: readonly OperatorAccessRow[]): Attempt[] {
  const used = new Set<string>();
  return rows.map((row, i) => {
    let key = row.id ?? (slug(row.capability) || `row-${i}`);
    while (used.has(key)) key = `${key}-${i}`;
    used.add(key);
    return { ...row, key };
  });
}

export const verdictOn = (row: Attempt, host: Host): Verdict => (host === 'legacy' ? row.legacy : row.arcane);

/** The per-node note, falling back to the row's bottom line. */
export const noteOn = (row: Attempt, host: Host): string => (host === 'legacy' ? row.legacyNote : row.arcaneNote) ?? row.note;

/**
 * What the seat plays: the attempts an ArcaneOS node turns away, in the data's order. The full table
 * (every row, both kinds of node) stays in the receipts.
 */
export const blockedOnArcane = (rows: readonly Attempt[]): Attempt[] => rows.filter((r) => r.arcane === 'no');

/** How many attempts landed on each verdict, on one kind of node, among the keys given. */
export function tally(rows: readonly Attempt[], keys: readonly string[], host: Host): Record<Verdict, number> {
  const out: Record<Verdict, number> = { no: 0, partial: 0, yes: 0, na: 0 };
  for (const key of keys) {
    const row = rows.find((r) => r.key === key);
    if (row) out[verdictOn(row, host)] += 1;
  }
  return out;
}

/* ---- layers (the rings) ------------------------------------------------------------------------- */

export interface Ring {
  /** The layer's short name: the text before " + " in a row's `layer`. */
  key: string;
  /** Position from the outside in: 0 is the outermost ring. */
  index: number;
  /** Keys of the attempts this layer decides. */
  attempts: string[];
}

export const MAX_RINGS = 8;

/** A layer that is not a defense draws no ring. */
const NOT_A_DEFENSE = /^by design$/i;

/** "FluxOS API gate + encrypted disk" belongs to the "FluxOS API gate" ring. */
export function layerKey(layer: string | undefined): string | null {
  if (!layer) return null;
  const first = layer.split(' + ')[0]?.trim() ?? '';
  return first && !NOT_A_DEFENSE.test(first) ? first : null;
}

/** One ring per distinct layer, outermost first in the order the rows list them (the data's order). */
export function buildRings(rows: readonly Attempt[]): Ring[] {
  const rings: Ring[] = [];
  for (const row of rows) {
    const key = layerKey(row.layer);
    if (!key) continue;
    let ring = rings.find((r) => r.key === key);
    if (!ring) {
      if (rings.length >= MAX_RINGS) continue;
      ring = { key, index: rings.length, attempts: [] };
      rings.push(ring);
    }
    ring.attempts.push(row.key);
  }
  return rings;
}

/** The ring an attempt is aimed at, or null when no ring is named (a layer that is not a defense). */
export function ringOf(row: Attempt, rings: readonly Ring[]): number | null {
  const key = layerKey(row.layer);
  if (!key) return null;
  const i = rings.findIndex((r) => r.key === key);
  return i < 0 ? null : i;
}

/**
 * How a layer stands on one kind of node: the worst verdict among the attempts it decides. A layer
 * that stops every one of them is closed, one that only limits some is gapped, one that lets any
 * through is open. Derived, never typed.
 */
export function ringVerdict(ring: Ring, rows: readonly Attempt[], host: Host): Verdict {
  let worst: Verdict = 'no';
  for (const key of ring.attempts) {
    const row = rows.find((r) => r.key === key);
    if (!row) continue;
    const v = verdictOn(row, host);
    if (v === 'yes') return 'yes';
    if (v === 'partial') worst = 'partial';
  }
  return worst;
}

/* ---- words and commands ---------------------------------------------------------------------------- */

const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** "Open a shell inside your container" becomes "Can a node operator open a shell inside your container?". */
export const questionFor = (row: Attempt): string => `Can a node operator ${lowerFirst(row.capability)}?`;

/**
 * Illustrative command lines, keyed by row id. Neutral and generic: they never claim real internals.
 * A row with no entry falls back to `try: {capability}`.
 */
const COMMANDS: Record<string, string> = {
  'root-shell': 'sudo -i',
  'container-shell': 'docker exec -it app sh',
  'env-secrets': 'docker inspect app',
  files: 'cp -r app/volumes ~/copy',
  logs: 'docker logs app',
  dashboard: 'try: inspect app from my node login',
  'stop-one': 'docker stop app',
  tamper: 'try: swap the image, patch the node software',
  spec: 'try: decrypt the private app spec',
  'see-what-runs': 'docker ps',
  'offline-disk': 'try: pull the disk, read it elsewhere',
  memory: "try: dump the app's memory",
  traffic: "try: watch the app's web traffic",
};

export const commandFor = (row: Attempt): string => COMMANDS[row.key] ?? `try: ${lowerFirst(row.capability)}`;

/* ---- pacing ----------------------------------------------------------------------------------------- */

/**
 * Milliseconds, in one place. The legacy pass is a quick montage (it is the contrast, not the point);
 * the ArcaneOS pass takes its time, one answer at a time.
 */
export const PACE = {
  /** How long the beam takes to reach its ring or the crystal. */
  beam: { legacy: 300, arcane: 520 },
  /** Time from one attempt to the next during a run: the beam, then long enough to read what it found. */
  hold: { legacy: 380, arcane: 1150 },
  /** Between the legacy pass and the flip, and after the flip. */
  beforeFlip: 1000,
  afterFlip: 800,
} as const;

/** How long an attempt holds before the next begins. */
export const holdFor = (host: Host): number => PACE.hold[host];
