import { ArrowUp, BookOpen, Code2, type LucideIcon } from 'lucide-react';
import { nodeTiers } from '@/data/flux';
import type { NodeTier, Source } from '@/data/types';
import { formatInt } from '@/lib/live';
import { LINKS } from '@/sections/chapters';

export interface Door {
  id: 'deploy' | 'node' | 'learn' | 'look';
  /** The headline. `*bold*` marks the word that carries the weight. No period. */
  title: string;
  /** One line, no trailing period. */
  line: string;
  /** What the link says to a screen reader, and where it goes. */
  action: string;
  href: string;
  /** Deploy is the lit one (the first warm white on the page); the rest are equal. */
  lit?: boolean;
  /** The last row, for the visitor who only wants to look: same grammar, quieter. */
  quiet?: boolean;
  sources?: Source[];
}

/** The cheapest way in, read from the data so the number in the copy is never typed. */
function smallestTier(): NodeTier | undefined {
  return nodeTiers.reduce<NodeTier | undefined>((a, b) => (!a || b.collateral < a.collateral ? b : a), undefined);
}

export function buildDoors(): Door[] {
  const tier = smallestTier();
  const nodeDocs = tier?.sources.find((s) => s.url.startsWith(LINKS.docs));
  return [
    {
      id: 'deploy',
      title: 'Deploy an *app*',
      line: 'With Docker, Git or an AI agent',
      action: 'Open FluxCloud',
      href: LINKS.cloud,
      lit: true,
    },
    {
      id: 'node',
      title: 'Run a *node*',
      line: tier
        ? `Put your own hardware on the network, from ${formatInt(tier.collateral)} FLUX of collateral`
        : 'Put your own hardware on the network',
      action: 'Read the node docs',
      href: nodeDocs?.url ?? LINKS.docs,
      sources: tier?.sources.slice(0, 2),
    },
    {
      id: 'learn',
      title: 'Learn *how it works*',
      line: 'Hands-on lessons and simulations: break a node, price an app spec',
      action: 'Open Flux Academy',
      href: LINKS.academy,
    },
    {
      id: 'look',
      title: 'Or just *look around*',
      line: 'Flux Atlas maps every node and how they connect, live, on a 3D globe',
      action: 'Open Flux Atlas',
      href: LINKS.atlas,
      quiet: true,
    },
  ];
}

export interface QuietLink {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

/** The quieter row beneath the doors. Same links the footer carries, said once more where the visitor decides. */
export const QUIET: readonly QuietLink[] = [
  { id: 'code', label: 'Read the code', href: LINKS.github, icon: Code2 },
  { id: 'docs', label: 'Documentation', href: LINKS.docs, icon: BookOpen },
  { id: 'top', label: 'Back to the top', href: '#top', icon: ArrowUp },
];
