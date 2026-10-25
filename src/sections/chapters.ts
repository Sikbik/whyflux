/**
 * The chapter list: the single source of truth for section ids, numbers, nav labels and acts.
 * No component imports here, so the nav, the footer and the section folders can all read it.
 * The order is the order of the page. docs/DESIGN.md has the storyboard behind each entry.
 */

export interface Chapter {
  /** The anchor id: `#id`. Also the `id` the section passes to <Section>. */
  id: string;
  /** Chapter number as printed, "00" for the hero. */
  num: string;
  /** Short nav label. */
  label: string;
  /** Full title, for the mobile menu and the document. */
  title: string;
  /** 0 = intro, 1..4 = the four acts. */
  act: 0 | 1 | 2 | 3 | 4;
}

export const ACTS: Record<number, string> = {
  0: 'Intro',
  1: 'The problem',
  2: 'The idea',
  3: 'The proof',
  4: 'The network',
};

export const chapters: readonly Chapter[] = [
  { id: 'top', num: '00', label: 'Intro', title: 'Pull the plug, it keeps running', act: 0 },
  { id: 'fragile', num: '01', label: 'Fragile', title: 'The fragile cloud', act: 1 },
  { id: 'kubernetes', num: '02', label: 'Kubernetes', title: 'A decentralized Kubernetes', act: 2 },
  { id: 'lifecycle', num: '03', label: 'Lifecycle', title: 'How a deployment works', act: 2 },
  { id: 'open', num: '04', label: 'Open', title: 'Open to anyone, on as many machines as you choose', act: 2 },
  { id: 'takedown', num: '05', label: 'Take it down', title: 'Try to take it down', act: 3 },
  { id: 'operators', num: '06', label: 'Operators', title: 'The people who run the network', act: 3 },
  { id: 'sealed', num: '07', label: 'Privacy', title: 'Your app, sealed', act: 3 },
  { id: 'arena', num: '08', label: 'Arena', title: 'The comparison arena', act: 3 },
  { id: 'cost', num: '09', label: 'Cost', title: 'What it actually costs', act: 3 },
  { id: 'ecosystem', num: '10', label: 'Ecosystem', title: 'More than a cloud', act: 4 },
  { id: 'proof', num: '11', label: 'Proof', title: 'Watch the network', act: 4 },
  { id: 'join', num: '12', label: 'Join', title: 'Your move', act: 4 },
];

export function chapterById(id: string): Chapter | undefined {
  return chapters.find((c) => c.id === id);
}

/** Outbound links used across the page. One place, so the copy and the nav never disagree. */
export const LINKS = {
  cloud: 'https://cloud.runonflux.com',
  flux: 'https://runonflux.com',
  docs: 'https://docs.runonflux.com',
  academy: 'https://academy.app.runonflux.io',
  atlas: 'https://atlas.app.runonflux.io',
  github: 'https://github.com/RunOnFlux',
} as const;
