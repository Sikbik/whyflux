/**
 * Chapter 04 model. The chapter is one picture: where an app can live, placed on two questions.
 * Across, who is allowed to host the machines (one company, approved operators, anyone). Up, how many
 * machines the app runs on (one, several). The five kinds of deployment are generic on purpose: no
 * platform is named here. They are placed by what defines them, and the picture is an illustration,
 * not a measurement. Flux's own line is not typed here: it is read from the Flux features in
 * `src/data/flux.ts`, which carry their sources.
 */
import { features } from '@/data/flux';
import type { Feature } from '@/data/types';
import { stripPeriod } from '@/lib/format';

export type CategoryId = 'own' | 'cloud' | 'approved' | 'market' | 'flux';
export type Col = 0 | 1 | 2;
export type Row = 'top' | 'bottom';

export interface Category {
  id: CategoryId;
  name: string;
  /** The name where a column is a third of a phone. */
  short: string;
  /** Who can host: one company, approved operators, anyone. */
  col: Col;
  /** How many machines the app runs on: several (top) or one (bottom). */
  row: Row;
  /** One line about it, with no full stop: it is set as a caption. */
  line: string;
}

/** The scale across, left to right. */
export const COLUMNS: readonly { label: string }[] = [
  { label: 'One company hosts' },
  { label: 'Approved operators host' },
  { label: 'Anyone can host' },
];

/** The scale up. */
export const ROWS: Record<Row, string> = {
  top: 'Your app on several machines',
  bottom: 'Your app on one machine',
};

const byId = (id: string): Feature | undefined => features.find((f) => f.id === id);

export const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

/** The two Flux features the picture stands on: open to any operator, and copies on independent machines. */
export function fluxFacts(): Feature[] {
  return ['permissionless', 'replicas'].map(byId).filter((f): f is Feature => f !== undefined);
}

/** Flux's line is the two feature headlines joined, so it can only say what the data says. */
function fluxLine(): string {
  const open = byId('permissionless')?.headline;
  const many = byId('replicas')?.headline;
  if (open && many) return `${stripPeriod(open)}, and ${lowerFirst(stripPeriod(many))}`;
  return 'Anyone can run a node, and your app can run on as many of them as you choose';
}

export const CATEGORIES: readonly Category[] = [
  {
    id: 'own',
    name: 'Your own server',
    short: 'Your own server',
    col: 0,
    row: 'bottom',
    line: 'One machine that you run: when it stops, your app stops',
  },
  {
    id: 'cloud',
    name: 'A cloud region',
    short: 'A cloud region',
    col: 0,
    row: 'top',
    line: 'Several machines, all run by one company',
  },
  {
    id: 'approved',
    name: 'Approved-operator networks',
    short: 'Approved operators',
    col: 1,
    row: 'top',
    line: 'Several machines, but only approved operators can host them',
  },
  {
    id: 'market',
    name: 'Open marketplaces',
    short: 'Open marketplaces',
    col: 2,
    row: 'bottom',
    line: 'Anyone can host, and your app is leased from one provider',
  },
  { id: 'flux', name: 'Flux', short: 'Flux', col: 2, row: 'top', line: fluxLine() },
];

export const categoryById = (id: CategoryId): Category => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]!;

/** The order the picture tells itself in: the simplest first, Flux last. */
export const STORY: readonly CategoryId[] = ['own', 'cloud', 'approved', 'market', 'flux'];

/** The order of the keys and of the page: the top band left to right, then the bottom band. */
export const READING: readonly CategoryId[] = [...CATEGORIES]
  .sort((a, b) => (a.row === b.row ? a.col - b.col : a.row === 'top' ? -1 : 1))
  .map((c) => c.id);

/** What the picture rests on once the story has been told. */
export const REST: CategoryId = 'flux';

/** A beat before the first step, and how long each step of the story holds, in ms. */
export const ENTER_MS = 600;
export const STEP_MS = 1500;
