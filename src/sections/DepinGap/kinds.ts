/**
 * Chapter 04 model. Five ways to host an app, each answering the same two questions: who is allowed to
 * host, and how many machines your app runs on. The kinds are generic on purpose (no platform or company
 * is named) and the picture is an illustration of how each one works, not a measurement. Flux's own two
 * answers are not typed here: the sentence under the picture and the receipts are read from the Flux
 * features in `src/data/flux.ts`, which carry their sources.
 */
import { features } from '@/data/flux';
import type { Feature } from '@/data/types';
import { stripPeriod } from '@/lib/format';

export type KindId = 'flux' | 'market' | 'cloud' | 'approved' | 'own';

export interface Kind {
  id: KindId;
  name: string;
  /** Who is allowed to host the machines your app runs on. `open` is the generous answer: anyone. */
  who: { answer: string; open: boolean };
  /**
   * How many machines run your app. `many` is the generous answer: several, or as many as you choose.
   * `hexes` is how many the small picture draws (an illustration: Flux draws its own field).
   */
  machines: { answer: string; many: boolean; hexes: number };
}

/** The two questions, as the words the picture poses them in. `key` is the word set in bold. */
export const QUESTIONS = {
  who: { before: 'Who can ', key: 'host', after: '?' },
  machines: { before: 'How many ', key: 'machines', after: ' run your app?' },
} as const;

/**
 * Flux first, because it is the answer. The rest follow from the most open host to the least: anyone,
 * a list of approved operators, one company, only you.
 */
export const KINDS: readonly Kind[] = [
  {
    id: 'flux',
    name: 'Flux',
    who: { answer: 'Anyone', open: true },
    machines: { answer: 'As many as you choose', many: true, hexes: 0 },
  },
  {
    id: 'market',
    name: 'Open marketplaces',
    who: { answer: 'Anyone', open: true },
    machines: { answer: 'One', many: false, hexes: 1 },
  },
  {
    id: 'approved',
    name: 'Approved-operator networks',
    who: { answer: 'Approved operators', open: false },
    machines: { answer: 'Several', many: true, hexes: 3 },
  },
  {
    id: 'cloud',
    name: 'A cloud region',
    who: { answer: 'One company', open: false },
    machines: { answer: 'Several', many: true, hexes: 3 },
  },
  {
    id: 'own',
    name: 'Your own server',
    who: { answer: 'Only you', open: false },
    machines: { answer: 'One', many: false, hexes: 1 },
  },
];

/** True where both answers are the generous ones. By construction that is Flux and nothing else here. */
export const passesBoth = (k: Kind): boolean => k.who.open && k.machines.many;

/** What a screen reader hears for the whole picture. */
export const PICTURE_LABEL = 'Five ways to host an app, by who can host and how many machines run your app';

const byId = (id: string): Feature | undefined => features.find((f) => f.id === id);

export const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

/** The two Flux features the picture stands on: open to any operator, and copies on independent machines. */
export function fluxFacts(): Feature[] {
  return ['permissionless', 'replicas'].map(byId).filter((f): f is Feature => f !== undefined);
}

/** Flux's line is the two feature headlines joined, so it can only say what the data says. */
export function fluxLine(): string {
  const open = byId('permissionless')?.headline;
  const many = byId('replicas')?.headline;
  if (open && many) return `${stripPeriod(open)}, and ${lowerFirst(stripPeriod(many))}`;
  return 'Anyone can run a node, and your app can run on as many of them as you choose';
}
