/**
 * Chapter 03: what the story and its three doors are made of. Facts come from the data layer
 * (`lifecycle`, `ecosystem`); this file holds only the choreography: which door is which, how the
 * scroll is cut into beats, the one short line each step gets, and where the phone cards crop the scene.
 *
 * The scene is illustrative: a made-up app, a made-up field of nodes, three copies. The lede says so
 * in a plain phrase. Nothing here dwells on timings: traffic fails over in seconds and the network
 * rebuilds the lost copy automatically, and that is all the story claims.
 */
import { ecosystem, lifecycle } from '@/data/flux';
import type { Source } from '@/data/types';

/* ---------------------------------------------------------------------------------------------- */
/* The three doors                                                                                 */
/* ---------------------------------------------------------------------------------------------- */

export type OnRampId = 'docker' | 'git' | 'agent';
export const ON_RAMP_IDS: readonly OnRampId[] = ['docker', 'git', 'agent'];

export interface OnRampDef {
  id: OnRampId;
  /** The title is `lead` then `key`; the key is set in the heavier weight. */
  lead: string;
  key: string;
  /** Short name for the switcher in the story. */
  pick: string;
  /** One line under the title. Same shape and length for all three. */
  line: string;
  /** The ecosystem record this door is told from. */
  from: 'fluxcloud' | 'orbit' | 'mcp';
}

export const ON_RAMPS: readonly OnRampDef[] = [
  {
    id: 'docker',
    lead: 'A ',
    key: 'Docker image',
    pick: 'Docker image',
    line: 'Fill in the FluxCloud form, or write a full spec',
    from: 'fluxcloud',
  },
  {
    id: 'git',
    lead: 'Deploy with ',
    key: 'Git',
    pick: 'Git push',
    line: 'Connect a repo to Orbit and every push deploys',
    from: 'orbit',
  },
  {
    id: 'agent',
    lead: 'An ',
    key: 'AI agent',
    pick: 'AI agent',
    line: 'Point an agent at the Flux Cloud MCP server',
    from: 'mcp',
  },
];

export function parseOnRamp(v: string | null | undefined): OnRampId | null {
  return ON_RAMP_IDS.find((id) => id === v) ?? null;
}

export function onRampById(id: OnRampId): OnRampDef {
  return ON_RAMPS.find((d) => d.id === id) ?? (ON_RAMPS[0] as OnRampDef);
}

/** The sources behind a door: its ecosystem record, plus the spec step for the Docker door. */
export function onRampSources(def: OnRampDef): Source[] {
  const own = ecosystem.find((e) => e.id === def.from)?.sources ?? [];
  const spec = def.id === 'docker' ? (lifecycle.find((s) => s.id === 'spec')?.sources ?? []) : [];
  return dedupe([...own, ...spec]);
}

/** The sources behind all three doors, once each. */
export function allDoorSources(): Source[] {
  return dedupe(ON_RAMPS.flatMap(onRampSources));
}

function dedupe(items: Source[]): Source[] {
  const seen = new Map<string, Source>();
  for (const s of items) if (!seen.has(s.url)) seen.set(s.url, s);
  return [...seen.values()];
}

/* ---------------------------------------------------------------------------------------------- */
/* The story's clock                                                                               */
/* ---------------------------------------------------------------------------------------------- */

/**
 * Scroll is cut into beats and each step owns some. Volunteering (5) and healing (9) are the two
 * moments that matter most, so they get two beats each: the longest stretch of the page's one pinned story.
 */
export const STEP_BEATS: readonly number[] = [1, 1, 1, 1, 2, 1, 1, 1, 2, 1];
export const BEATS = STEP_BEATS.reduce((a, b) => a + b, 0);
/** Viewport heights of scroll per beat. A one-beat step is 0.65 of a screen, a two-beat step 1.3. */
export const PER_BEAT = 0.65;

/** The first beat of each step. */
export const STEP_START: readonly number[] = STEP_BEATS.map((_, i) => STEP_BEATS.slice(0, i).reduce((a, b) => a + b, 0));

/** The story step (0 to 9) a beat belongs to. */
export function stepOfBeat(beat: number): number {
  for (let i = STEP_BEATS.length - 1; i >= 0; i--) if (beat >= (STEP_START[i] ?? 0)) return i;
  return 0;
}

/**
 * Scroll progress (0..1 across the pinned story) to story time: 0 to 10, where the integer part is the
 * step and the fraction is how far through it. Every picture on the stage is a function of this number.
 */
export function storyTime(progress: number): number {
  const u = Math.min(BEATS, Math.max(0, progress * BEATS));
  const beat = Math.min(BEATS - 1, Math.floor(u));
  const step = stepOfBeat(beat);
  const span = STEP_BEATS[step] ?? 1;
  const within = (beat - (STEP_START[step] ?? 0) + (u - beat)) / span;
  return Math.min(10, step + within);
}

/** Scroll progress at which a step begins (a hair in, so it is the active one). */
export function progressOfStep(step: number): number {
  return ((STEP_START[step] ?? 0) + 0.02) / BEATS;
}

/* ---------------------------------------------------------------------------------------------- */
/* What each step says                                                                              */
/* ---------------------------------------------------------------------------------------------- */

/**
 * One short line under each step's title (the titles are the data's). Plain captions: no periods, no
 * numbers, nothing the picture has not already said. Step one speaks for whichever door is chosen.
 */
export const LINES: readonly string[] = [
  'Three ways in, the same journey',
  'Any node can check the spec and price it in dollars',
  'You sign with your Flux ID, then the network passes it on',
  'The next block puts it in front of every node',
  'No scheduler: the nodes that fit claim the app themselves',
  'The chosen nodes pull the image, and sync data when storage is synced',
  'Each copy announces where it runs',
  'One address, balanced across every copy',
  'Traffic fails over in seconds, and the network rebuilds the lost copy automatically',
  'One address for your users, many independent machines behind it',
];

/** The line under a step's title. Step one follows the door. */
export function lineFor(step: number, on: OnRampId | null): string {
  if (step === 0 && on) return onRampById(on).line;
  return LINES[step] ?? '';
}

/** The first sentence of a record: a door's detail in the record's own words. */
const firstSentence = (text: string): string => {
  const end = text.indexOf('. ');
  return end === -1 ? text : text.slice(0, end + 1);
};

/**
 * The detail behind a step, for the receipts: the data's own text and its sources. Step one tells the
 * chosen door in its own record (the Docker door is the step itself, without its closing nod to Git), so
 * none of the three is the footnote of another.
 */
export function detailFor(step: number, on: OnRampId | null): { body: string; sources: Source[] } {
  const s = lifecycle[step];
  const whole = { body: s?.body ?? '', sources: s?.sources ?? [] };
  if (step !== 0 || !on) return whole;
  if (on === 'docker') {
    const spec = whole.body.split('. Or ')[0];
    return { body: spec && spec !== whole.body ? `${spec}.` : whole.body, sources: whole.sources };
  }
  const def = onRampById(on);
  const record = ecosystem.find((e) => e.id === def.from);
  return record ? { body: firstSentence(record.body), sources: onRampSources(def) } : whole;
}

/* ---------------------------------------------------------------------------------------------- */
/* The scene                                                                                        */
/* ---------------------------------------------------------------------------------------------- */

export const SCENE_W = 1200;
export const SCENE_H = 640;

/** A sample app and the address its copies answer on. Illustrative. */
export const SAMPLE_APP = 'my-app';
export const SAMPLE_HOST = `${SAMPLE_APP}.app.runonflux.io`;

/**
 * Where the pinned scene looks at each step: the centre (x, y) and how much width it takes in, in scene
 * units. The camera travels to a step's view as the step begins and holds it there, so every beat fills the
 * frame; the last view pulls back to take in the whole network. Phone cards use CROPS instead.
 */
export const CAMERA: readonly (readonly [number, number, number])[] = [
  [190, 240, 740],
  [350, 232, 720],
  [350, 320, 720],
  [520, 270, 880],
  [640, 302, 720],
  [752, 272, 580],
  [690, 312, 700],
  [880, 230, 700],
  [760, 285, 900],
  [800, 262, 880],
];

/** How much of a step, 0 to 1, the camera spends travelling into its view. */
const CAMERA_MOVE: readonly number[] = [0, 0.4, 0.4, 0.4, 0.3, 0.3, 0.35, 0.35, 0.3, 0.4];

const smooth = (u: number): number => u * u * (3 - 2 * u);

/** The camera at story time `t`: its centre and the width it shows. A plain function of the clock. */
export function cameraAt(t: number): readonly [number, number, number] {
  const last = CAMERA.length - 1;
  const step = Math.min(last, Math.max(0, Math.floor(t)));
  const to = CAMERA[step] ?? [SCENE_W / 2, SCENE_H / 2, SCENE_W];
  const from = CAMERA[step - 1];
  if (!from) return to;
  const u = smooth(Math.min(1, Math.max(0, (t - step) / (CAMERA_MOVE[step] ?? 0.35))));
  // The width eases geometrically so a zoom feels even; the centre eases along a straight line.
  return [from[0] + (to[0] - from[0]) * u, from[1] + (to[1] - from[1]) * u, from[2] * (to[2] / from[2]) ** u];
}

/** The SVG transform that points the scene's camera at story time `t`. */
export function cameraTransform(t: number): string {
  const [cx, cy, w] = cameraAt(t);
  const s = SCENE_W / w;
  return `matrix(${s.toFixed(4)} 0 0 ${s.toFixed(4)} ${(SCENE_W / 2 - s * cx).toFixed(2)} ${(SCENE_H / 2 - s * cy).toFixed(2)})`;
}

/**
 * The moment of the story each step is shown at when it holds still: a phone card, or a step under reduced
 * motion. Each is taken where the step's idea is on the picture, not at the step's end, where it has often
 * already handed over to the next.
 */
export const POSTER: readonly number[] = [0.97, 1.85, 2.85, 3.97, 4.9, 5.65, 6.95, 7.85, 8.96, 9.7];

/** Which part of the scene a phone card shows for each step: x, y, width, height of the viewBox. */
export const CROPS: readonly (readonly [number, number, number, number])[] = [
  [8, 40, 560, 500],
  [8, 40, 560, 500],
  [8, 40, 560, 500],
  [8, 40, 560, 500],
  [312, 40, 640, 500],
  [312, 40, 640, 500],
  [312, 40, 640, 500],
  [556, 40, 640, 500],
  [556, 40, 640, 500],
  [556, 40, 640, 500],
];
