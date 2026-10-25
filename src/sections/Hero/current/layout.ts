/**
 * How the headline is set: which words share a line, how big each line is, where its baseline falls
 * and how tall the block is. Pure arithmetic over the face's measurements, so the height can be
 * reserved before the font arrives and nothing moves when it does.
 *
 * Wide containers get two lines of one size, in the face's wide setting (the two halves of one
 * sentence). Phones get three, in its narrower one so the letters can be bigger: "Pull the plug"
 * fitted to the width and the payoff, "It keeps / running", a size larger.
 */
import type { LineSpec } from './glyphs';

/** What the layout needs to know about the face. */
export interface Metrics {
  /** Advance of a string at one unit of font size (kerning included, tracking not). */
  adv(text: string, weight: number, stretch: string): number;
  /** Cap height and descender depth, in em. */
  cap: number;
  descent: number;
}

export interface Style {
  weight: number;
  /** Width of the face (a CSS font-stretch keyword) on two lines and on three. */
  stretch: string;
  stackStretch: string;
  /** Letter-spacing in em. */
  tracking: number;
  /** Extra word space in em (tracking tightens the face's own, which is already narrow). */
  word: number;
  /** Baseline to baseline, in units of the larger font size. */
  pitch: number;
}

export const STYLE: Style = {
  weight: 800,
  stretch: 'semi-expanded',
  stackStretch: 'semi-condensed',
  tracking: -0.02,
  word: 0.07,
  pitch: 1.0,
};

export interface Plan {
  mode: 'wide' | 'stack';
  /** Height of the block in the page: first cap top to the last descender. */
  height: number;
  /** How far the canvas reaches above and below the block (bolts overshoot the letters). */
  top: number;
  bottom: number;
  /** The loud font size. */
  size: number;
  /** Lines with baselines measured from the top of the canvas. */
  lines: LineSpec[];
}

export interface PlanInput {
  /** Width the headline may use, in CSS pixels. */
  width: number;
  /** Viewport height: a wide headline takes a share of it. */
  vh: number;
  /** How far the canvas may reach above the block (up to the top of the hero), if the page knows. */
  top?: number;
}

/** Share of the width a line may fill: a little air so the tracking never clips an edge. */
const FILL = 0.985;
/** Below this font size a single line of the payoff is too small to carry the hero: stack it. */
const MIN_WIDE = 62;

export function plan(input: PlanInput, m: Metrics, style: Style = STYLE): Plan {
  const { weight, tracking, word, pitch } = style;
  const em = (text: string, stretch: string) =>
    m.adv(text, weight, stretch) + tracking * (text.length - 1) + word * (text.split(' ').length - 1);
  const fit = (text: string, stretch: string) => (input.width * FILL) / em(text, stretch);

  // A wide headline takes a share of the viewport height, never more than the width allows.
  const heightCap = Math.min(168, Math.max(64, input.vh * 0.15));
  const wide = Math.min(fit('It keeps running', style.stretch), heightCap);
  const mode = wide >= MIN_WIDE ? 'wide' : 'stack';
  const stretch = mode === 'wide' ? style.stretch : style.stackStretch;

  const words = mode === 'wide' ? ['Pull the plug', 'It keeps running'] : ['Pull the plug', 'It keeps', 'running'];
  const sizes = [mode === 'wide' ? wide : fit('Pull the plug', stretch)];
  if (mode === 'wide') sizes.push(wide);
  else {
    const loud = Math.min(fit('It keeps', stretch), sizes[0]! * 1.3);
    sizes.push(loud, loud);
  }

  // Room above for bolts to start; below, enough for a bolt riding a descender (never far into the lede).
  const top = Math.round(input.top ?? sizes[0]! * 0.34);
  const bottom = Math.round(Math.min(24, Math.max(14, sizes[sizes.length - 1]! * 0.2)));
  let baseline = top + m.cap * sizes[0]!;
  const lines: LineSpec[] = words.map((text, i) => {
    if (i > 0) baseline += pitch * Math.max(sizes[i - 1]!, sizes[i]!);
    return { text, size: sizes[i]!, weight, stretch, tracking, word, baseline, tone: i === 0 ? 0 : 1 };
  });
  const last = lines[lines.length - 1]!;
  const height = last.baseline + m.descent * last.size - top;
  return { mode, height: Math.round(height), top, bottom, size: sizes[sizes.length - 1]!, lines };
}
