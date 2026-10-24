/**
 * Chapter 10: how the ecosystem items are grouped into rings, named on the orbit and drawn.
 * The facts (names, statuses, copy, sources) all come from `ecosystem` in src/data/flux.ts; this
 * file only decides where an item sits and which short label and icon it wears.
 */
import {
  Bot,
  BrainCircuit,
  CloudUpload,
  Coins,
  Cpu,
  GitBranch,
  HardDrive,
  Hexagon,
  type LucideIcon,
  Microchip,
  Network,
  Shield,
  Store,
  Wallet,
} from 'lucide-react';
import type { EcosystemItem } from '@/data/types';

export type Status = EcosystemItem['status'];

/** How a status reads on the page: a plain word, never a badge. Live is the default and says nothing. */
export const STATUS: Record<Status, { label: string }> = {
  live: { label: 'Live' },
  beta: { label: 'Beta' },
  announced: { label: 'Planned' },
  deprecated: { label: 'Deprecated' },
};

/** The five product families, outermost ring first (the order the orbit reads in). */
const FAMILIES: readonly { id: string; name: string; ids: readonly string[] }[] = [
  { id: 'build', name: 'Build', ids: ['fluxcloud', 'orbit', 'mcp', 'marketplace'] },
  { id: 'run', name: 'Run', ids: ['fluxos', 'fluxedge', 'fluxai', 'fluxdrive'] },
  { id: 'operate', name: 'Operate', ids: ['fluxnodes', 'pnr-v2'] },
  { id: 'secure', name: 'Secure', ids: ['arcaneos'] },
  { id: 'pay', name: 'Pay', ids: ['wallets'] },
];

export interface Ring {
  id: string;
  name: string;
  items: EcosystemItem[];
}

/** Items grouped into rings, outermost first. An id the map does not know lands in an outer "More" ring. */
export function groupRings(items: readonly EcosystemItem[]): Ring[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const used = new Set<string>();
  const rings: Ring[] = [];
  for (const f of FAMILIES) {
    const list: EcosystemItem[] = [];
    for (const id of f.ids) {
      const item = byId.get(id);
      if (item) {
        list.push(item);
        used.add(id);
      }
    }
    if (list.length > 0) rings.push({ id: f.id, name: f.name, items: list });
  }
  const rest = items.filter((i) => !used.has(i.id));
  if (rest.length > 0) rings.unshift({ id: 'more', name: 'More', items: rest });
  return rings;
}

const SHORT: Record<string, string> = {
  fluxcloud: 'FluxCloud',
  orbit: 'Orbit',
  mcp: 'MCP server',
  marketplace: 'Marketplace',
  fluxos: 'FluxOS',
  fluxedge: 'FluxEdge',
  fluxai: 'FluxAI',
  fluxdrive: 'FluxDrive',
  fluxnodes: 'FluxNodes',
  'pnr-v2': 'Node rewards v2',
  arcaneos: 'ArcaneOS',
  wallets: 'Wallets',
};

/** The name that fits on the orbit. The full `name` from the data is used everywhere there is room. */
export function shortName(item: EcosystemItem): string {
  return SHORT[item.id] ?? item.name;
}

const ICONS: Record<string, LucideIcon> = {
  fluxcloud: CloudUpload,
  orbit: GitBranch,
  mcp: Bot,
  marketplace: Store,
  fluxos: Cpu,
  fluxedge: Microchip,
  fluxai: BrainCircuit,
  fluxdrive: HardDrive,
  fluxnodes: Network,
  'pnr-v2': Coins,
  arcaneos: Shield,
  wallets: Wallet,
};

export function iconFor(item: EcosystemItem): LucideIcon {
  return ICONS[item.id] ?? Hexagon;
}
