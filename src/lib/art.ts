/**
 * The art manifest. Generated images live in public/art/ (masters in assets-src/art/); this file is
 * how the page refers to them. A missing file never breaks anything: <ArtPlate> hides itself. See docs/DESIGN.md for
 * where each one is used.
 */

export type ArtId =
  | 'hero-horizon'
  | 'og-backdrop'
  | 'bg-blackout'
  | 'monolith-trio'
  | 'emblem-cumulus'
  | 'emblem-nimbus'
  | 'emblem-stratus'
  | 'bg-dawn'
  | 'bg-lattice-floor'
  | 'node-hero'
  | 'container-crystal'
  | 'bg-orbit-rings'
  | 'fx-lens-streaks'
  | 'fx-bokeh';

export interface ArtEntry {
  /** Intrinsic aspect, for reserving space (no layout shift). */
  w: number;
  h: number;
  /** Decorative plates use '' (the image is aria-hidden); key art gets real alt text. */
  alt: string;
  /** How it is composited: pure-black-floor pieces use `screen`, opaque plates use `normal`. */
  blend: 'screen' | 'normal';
}

export const ART_EXT = 'webp';

export const ART: Record<ArtId, ArtEntry> = {
  'hero-horizon': { w: 1774, h: 998, alt: '', blend: 'normal' },
  'og-backdrop': { w: 1774, h: 998, alt: '', blend: 'normal' },
  'bg-blackout': { w: 1774, h: 998, alt: '', blend: 'normal' },
  'monolith-trio': {
    w: 1254,
    h: 1254,
    alt: 'Three tall dark glass monoliths standing together, one of them cracked with a red fracture of light.',
    blend: 'screen',
  },
  'emblem-cumulus': {
    w: 1254,
    h: 1254,
    alt: 'A small hexagonal glass compute node with a cyan glowing core: the Cumulus tier.',
    blend: 'screen',
  },
  'emblem-nimbus': {
    w: 1254,
    h: 1254,
    alt: 'A mid-sized compute node of two stacked hexagonal glass prisms with a violet glowing core: the Nimbus tier.',
    blend: 'screen',
  },
  'emblem-stratus': {
    w: 1254,
    h: 1254,
    alt: 'A tall compute node of three stacked hexagonal glass prisms and a crystal spire with an amber glowing core: the Stratus tier.',
    blend: 'screen',
  },
  'bg-dawn': { w: 1774, h: 998, alt: '', blend: 'normal' },
  'bg-lattice-floor': { w: 1774, h: 998, alt: '', blend: 'screen' },
  'node-hero': {
    w: 1536,
    h: 1024,
    alt: 'A hexagonal glass compute node with its lid open and ribbons of blue light reaching out to other nodes.',
    blend: 'screen',
  },
  'container-crystal': {
    w: 1254,
    h: 1254,
    alt: 'A clear hexagonal glass container holding a stack of glowing slabs, like the layers of an image, about to launch.',
    blend: 'screen',
  },
  'bg-orbit-rings': { w: 1774, h: 998, alt: '', blend: 'screen' },
  'fx-lens-streaks': { w: 1774, h: 998, alt: '', blend: 'screen' },
  'fx-bokeh': { w: 1774, h: 998, alt: '', blend: 'screen' },
};

export function artUrl(id: ArtId): string {
  return `/art/${id}.${ART_EXT}`;
}
